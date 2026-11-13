
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

function parseCoordinate(value: unknown, min: number, max: number) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number) || number < min || number > max) {
    return NaN;
  }

  return number;
}

function validateCoordinates(latitude: number | null, longitude: number | null) {
  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return false;
  }

  // Kedua koordinat harus diisi bersama-sama.
  return (latitude === null) === (longitude === null);
}

export async function GET() {
  try {
    const user = await requireRole("admin");

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Akses hanya untuk Admin." },
        { status: 401 }
      );
    }

    const data = await sql`
      SELECT *
      FROM lowongan_pkl
      ORDER BY created_at DESC
    `;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("GET LOWONGAN ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Gagal mengambil data lowongan." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole("admin");

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Akses hanya untuk Admin." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const {
      judul,
      nama_instansi,
      lokasi,
      deskripsi,
      persyaratan,
      jurusan,
      kuota,
      tanggal_mulai,
      tanggal_selesai,
      status,
    } = body;

    if (
      !judul?.trim() ||
      !nama_instansi?.trim() ||
      !lokasi?.trim() ||
      !deskripsi?.trim()
    ) {
      return NextResponse.json(
        { success: false, message: "Lengkapi semua kolom wajib." },
        { status: 400 }
      );
    }

    const jumlahKuota = Number(kuota);
    const latitude = parseCoordinate(body.latitude, -90, 90);
    const longitude = parseCoordinate(body.longitude, -180, 180);
    const radius = Number(body.radius_absensi ?? 100);

    if (!Number.isInteger(jumlahKuota) || jumlahKuota < 1) {
      return NextResponse.json(
        { success: false, message: "Kuota minimal 1 siswa." },
        { status: 400 }
      );
    }

    if (!validateCoordinates(latitude, longitude)) {
      return NextResponse.json(
        {
          success: false,
          message: "Latitude dan longitude harus diisi bersama dan dalam format yang valid.",
        },
        { status: 400 }
      );
    }

    if (!Number.isInteger(radius) || radius < 20 || radius > 1000) {
      return NextResponse.json(
        { success: false, message: "Radius absensi harus antara 20 sampai 1000 meter." },
        { status: 400 }
      );
    }

    if (
      tanggal_mulai &&
      tanggal_selesai &&
      tanggal_selesai < tanggal_mulai
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Tanggal selesai tidak boleh sebelum tanggal mulai.",
        },
        { status: 400 }
      );
    }

    const result = await sql`
      INSERT INTO lowongan_pkl (
        judul,
        nama_instansi,
        lokasi,
        deskripsi,
        persyaratan,
        jurusan,
        kuota,
        tanggal_mulai,
        tanggal_selesai,
        status,
        latitude,
        longitude,
        radius_absensi
      )
      VALUES (
        ${judul.trim()},
        ${nama_instansi.trim()},
        ${lokasi.trim()},
        ${deskripsi.trim()},
        ${persyaratan || ""},
        ${jurusan || ""},
        ${jumlahKuota},
        ${tanggal_mulai || null},
        ${tanggal_selesai || null},
        ${status === "DITUTUP" ? "DITUTUP" : "DIBUKA"},
        ${latitude},
        ${longitude},
        ${radius}
      )
      RETURNING *
    `;

    return NextResponse.json({
      success: true,
      message: "Lowongan PKL berhasil ditambahkan.",
      data: result[0],
    });
  } catch (error) {
    console.error("POST LOWONGAN ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Gagal menyimpan lowongan." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireRole("admin");

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Akses hanya untuk Admin." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const {
      id,
      judul,
      nama_instansi,
      lokasi,
      deskripsi,
      persyaratan,
      jurusan,
      kuota,
      tanggal_mulai,
      tanggal_selesai,
      status,
    } = body;

    const lowonganId = Number(id);
    const jumlahKuota = Number(kuota);
    const latitude = parseCoordinate(body.latitude, -90, 90);
    const longitude = parseCoordinate(body.longitude, -180, 180);
    const radius = Number(body.radius_absensi ?? 100);

    if (!Number.isInteger(lowonganId) || lowonganId < 1) {
      return NextResponse.json(
        { success: false, message: "ID lowongan tidak valid." },
        { status: 400 }
      );
    }

    if (
      !judul?.trim() ||
      !nama_instansi?.trim() ||
      !lokasi?.trim() ||
      !deskripsi?.trim() ||
      !Number.isInteger(jumlahKuota) ||
      jumlahKuota < 1
    ) {
      return NextResponse.json(
        { success: false, message: "Periksa kembali data lowongan." },
        { status: 400 }
      );
    }

    if (!validateCoordinates(latitude, longitude)) {
      return NextResponse.json(
        {
          success: false,
          message: "Latitude dan longitude harus diisi bersama dan dalam format yang valid.",
        },
        { status: 400 }
      );
    }

    if (!Number.isInteger(radius) || radius < 20 || radius > 1000) {
      return NextResponse.json(
        { success: false, message: "Radius absensi harus antara 20 sampai 1000 meter." },
        { status: 400 }
      );
    }

    if (
      tanggal_mulai &&
      tanggal_selesai &&
      tanggal_selesai < tanggal_mulai
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Tanggal selesai tidak boleh sebelum tanggal mulai.",
        },
        { status: 400 }
      );
    }

    const result = await sql`
      UPDATE lowongan_pkl
      SET
        judul = ${judul.trim()},
        nama_instansi = ${nama_instansi.trim()},
        lokasi = ${lokasi.trim()},
        deskripsi = ${deskripsi.trim()},
        persyaratan = ${persyaratan || ""},
        jurusan = ${jurusan || ""},
        kuota = ${jumlahKuota},
        tanggal_mulai = ${tanggal_mulai || null},
        tanggal_selesai = ${tanggal_selesai || null},
        status = ${status === "DITUTUP" ? "DITUTUP" : "DIBUKA"},
        latitude = ${latitude},
        longitude = ${longitude},
        radius_absensi = ${radius},
        updated_at = NOW()
      WHERE id = ${lowonganId}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, message: "Lowongan tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Lowongan berhasil diperbarui.",
      data: result[0],
    });
  } catch (error) {
    console.error("PATCH LOWONGAN ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Gagal memperbarui lowongan." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireRole("admin");

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Akses hanya untuk Admin." },
        { status: 401 }
      );
    }

    const id = Number(request.nextUrl.searchParams.get("id"));

    if (!Number.isInteger(id) || id < 1) {
      return NextResponse.json(
        { success: false, message: "ID lowongan tidak valid." },
        { status: 400 }
      );
    }

    const result = await sql`
      DELETE FROM lowongan_pkl
      WHERE id = ${id}
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, message: "Lowongan tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Lowongan berhasil dihapus.",
    });
  } catch (error) {
    console.error("DELETE LOWONGAN ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Gagal menghapus lowongan." },
      { status: 500 }
    );
  }
}
