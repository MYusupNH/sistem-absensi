
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

const MAX_SELFIE_LENGTH = 6 * 1024 * 1024;
const MAX_GPS_ACCURACY = 100;

function hitungJarak(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371000;
  const toRad = (value: number) => (value * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function validCoordinate(latitude: number, longitude: number) {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

// Mengambil lokasi penempatan PKL siswa yang sudah disetujui.
async function getPklLocation(studentId: number | string) {
  const locations = await sql`
    SELECT
      l.id,
      l.judul,
      l.nama_instansi,
      l.lokasi,
      l.latitude::double precision AS latitude,
      l.longitude::double precision AS longitude,
      COALESCE(l.radius_absensi, 100)::integer AS radius_absensi
    FROM detail_pengajuan_pkl d
    JOIN pengajuan_pkl p
      ON p.id = d.pengajuan_id
    JOIN lowongan_pkl l
      ON l.id = p.lowongan_id
    WHERE d.student_user_id = ${studentId}
      AND p.status = 'DISETUJUI'
    ORDER BY p.updated_at DESC
    LIMIT 1
  `;

  if (locations.length === 0) {
    return null;
  }

  const item = locations[0];

  return {
    id: Number(item.id),
    judul: item.judul,
    nama_instansi: item.nama_instansi,
    lokasi: item.lokasi,
    latitude:
      item.latitude === null || item.latitude === undefined
        ? null
        : Number(item.latitude),
    longitude:
      item.longitude === null || item.longitude === undefined
        ? null
        : Number(item.longitude),
    radius_absensi: Number(item.radius_absensi || 100),
  };
}

export async function GET() {
  const user = await requireRole("student");

  if (!user) {
    return NextResponse.json(
      { message: "Silakan login sebagai siswa." },
      { status: 401 }
    );
  }

  try {
    const attendance = await sql`
      SELECT
        id,
        tanggal,
        jam_masuk,
        jam_keluar,
        latitude,
        longitude,
        jarak_meter
      FROM absensi_pkl
      WHERE student_user_id = ${user.id}
        AND tanggal = (NOW() AT TIME ZONE 'Asia/Jakarta')::date
      LIMIT 1
    `;

    const reports = await sql`
      SELECT
        id,
        tanggal,
        kegiatan,
        hasil,
        kendala,
        created_at
      FROM laporan_pkl
      WHERE student_user_id = ${user.id}
      ORDER BY tanggal DESC, created_at DESC
      LIMIT 10
    `;

    const location = await getPklLocation(user.id);

    return NextResponse.json({
      attendance,
      reports,
      pklLocation: location,
      maxGpsAccuracy: MAX_GPS_ACCURACY,
    });
  } catch (error) {
    console.error("Gagal mengambil aktivitas siswa:", error);

    return NextResponse.json(
      { message: "Gagal mengambil data aktivitas." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const user = await requireRole("student");

  if (!user) {
    return NextResponse.json(
      { message: "Silakan login sebagai siswa." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const action = String(body.action || "");

    // ABSENSI MASUK
    if (action === "masuk") {
      const selfieData = String(body.selfieData || "");
      const latitude = Number(body.latitude);
      const longitude = Number(body.longitude);
      const accuracy = Number(body.accuracy);

      if (
        !selfieData ||
        !/^data:image\/(jpeg|jpg|png|webp);base64,/i.test(selfieData)
      ) {
        return NextResponse.json(
          { message: "Foto selfie wajib diambil langsung melalui kamera." },
          { status: 400 }
        );
      }

      if (selfieData.length > MAX_SELFIE_LENGTH) {
        return NextResponse.json(
          { message: "Ukuran foto terlalu besar. Silakan ambil foto ulang." },
          { status: 400 }
        );
      }

      if (!validCoordinate(latitude, longitude)) {
        return NextResponse.json(
          {
            message:
              "Koordinat GPS tidak valid. Aktifkan GPS dan coba kembali.",
          },
          { status: 400 }
        );
      }

      // VALIDASI AKURASI GPS
      if (
        !Number.isFinite(accuracy) ||
        accuracy <= 0 ||
        accuracy > MAX_GPS_ACCURACY
      ) {
        return NextResponse.json(
          {
            message: `Akurasi GPS belum memenuhi syarat. Maksimal ±${MAX_GPS_ACCURACY} meter. Silakan ambil ulang lokasi.`,
            accuracy,
            maxAccuracy: MAX_GPS_ACCURACY,
          },
          { status: 400 }
        );
      }

      const location = await getPklLocation(user.id);

      if (!location) {
        return NextResponse.json(
          {
            message:
              "Belum ada penempatan PKL yang disetujui untuk akunmu.",
          },
          { status: 403 }
        );
      }

      if (
        location.latitude === null ||
        location.longitude === null ||
        !validCoordinate(location.latitude, location.longitude)
      ) {
        return NextResponse.json(
          {
            message:
              "Koordinat lokasi PKL belum diatur Admin. Hubungi Admin terlebih dahulu.",
          },
          { status: 400 }
        );
      }

      const radius = Number(location.radius_absensi);

      if (!Number.isFinite(radius) || radius <= 0) {
        return NextResponse.json(
          {
            message: "Pengaturan radius lokasi PKL tidak valid.",
          },
          { status: 400 }
        );
      }

      // CEK JARAK SISWA DARI LOKASI PKL
      const jarak = hitungJarak(
        latitude,
        longitude,
        location.latitude,
        location.longitude
      );

      if (jarak > radius) {
        return NextResponse.json(
          {
            message: `Presensi ditolak. Kamu berada sekitar ${Math.round(
              jarak
            )} meter dari lokasi PKL. Batas yang diizinkan ${radius} meter.`,
            jarak: Math.round(jarak),
            radius,
          },
          { status: 403 }
        );
      }

      // SIMPAN ABSENSI MASUK
      const result = await sql`
        INSERT INTO absensi_pkl (
          student_user_id,
          tanggal,
          jam_masuk,
          selfie_data,
          latitude,
          longitude,
          jarak_meter
        )
        VALUES (
          ${user.id},
          (NOW() AT TIME ZONE 'Asia/Jakarta')::date,
          NOW(),
          ${selfieData},
          ${latitude},
          ${longitude},
          ${jarak}
        )
        ON CONFLICT (student_user_id, tanggal)
        DO NOTHING
        RETURNING
          id,
          tanggal,
          jam_masuk,
          jam_keluar,
          latitude,
          longitude,
          jarak_meter
      `;

      if (result.length === 0) {
        return NextResponse.json(
          { message: "Kamu sudah melakukan absensi masuk hari ini." },
          { status: 400 }
        );
      }

      return NextResponse.json({
        message:
          "Absensi masuk berhasil! Selfie dan lokasi GPS berhasil disimpan.",
        attendance: result[0],
      });
    }

    // ABSENSI KELUAR
    if (action === "keluar") {
      const result = await sql`
        UPDATE absensi_pkl
        SET
          jam_keluar = NOW(),
          updated_at = NOW()
        WHERE student_user_id = ${user.id}
          AND tanggal = (NOW() AT TIME ZONE 'Asia/Jakarta')::date
          AND jam_masuk IS NOT NULL
          AND jam_keluar IS NULL
        RETURNING
          id,
          tanggal,
          jam_masuk,
          jam_keluar
      `;

      if (result.length === 0) {
        return NextResponse.json(
          {
            message:
              "Absensi keluar belum dapat dilakukan. Pastikan sudah absen masuk dan belum absen keluar.",
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        message: "Absensi keluar berhasil dicatat.",
        attendance: result[0],
      });
    }

    // LAPORAN KEGIATAN HARIAN
    if (action === "laporan") {
      const kegiatan = String(body.kegiatan || "").trim();
      const hasil = String(body.hasil || "").trim();
      const kendala = String(body.kendala || "").trim();

      if (!kegiatan || kegiatan.length < 5) {
        return NextResponse.json(
          { message: "Deskripsi kegiatan minimal 5 karakter." },
          { status: 400 }
        );
      }

      if (
        kegiatan.length > 5000 ||
        hasil.length > 3000 ||
        kendala.length > 3000
      ) {
        return NextResponse.json(
          { message: "Isi laporan terlalu panjang." },
          { status: 400 }
        );
      }

      const result = await sql`
        INSERT INTO laporan_pkl (
          student_user_id,
          tanggal,
          kegiatan,
          hasil,
          kendala
        )
        VALUES (
          ${user.id},
          (NOW() AT TIME ZONE 'Asia/Jakarta')::date,
          ${kegiatan},
          ${hasil || null},
          ${kendala || null}
        )
        ON CONFLICT (student_user_id, tanggal)
        DO UPDATE SET
          kegiatan = EXCLUDED.kegiatan,
          hasil = EXCLUDED.hasil,
          kendala = EXCLUDED.kendala,
          updated_at = NOW()
        RETURNING
          id,
          tanggal,
          kegiatan,
          hasil,
          kendala,
          created_at
      `;

      return NextResponse.json({
        message: "Laporan kegiatan berhasil disimpan.",
        report: result[0],
      });
    }

    return NextResponse.json(
      { message: "Aksi tidak valid." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Gagal menyimpan aktivitas siswa:", error);

    return NextResponse.json(
      {
        message: "Terjadi kesalahan saat menyimpan data aktivitas.",
      },
      { status: 500 }
    );
  }
}
