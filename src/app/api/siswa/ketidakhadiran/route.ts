
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

function validDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(new Date(`${value}T00:00:00+07:00`).getTime());
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
    const rows = await sql`
      SELECT
        id,
        tanggal,
        jenis,
        alasan,
        bukti_url,
        status,
        catatan_guru,
        created_at,
        reviewed_at
      FROM ketidakhadiran_pkl
      WHERE student_user_id = ${user.id}
      ORDER BY tanggal DESC, created_at DESC
      LIMIT 100
    `;

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("Gagal mengambil ketidakhadiran:", error);

    return NextResponse.json(
      { message: "Gagal mengambil data ketidakhadiran." },
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

    const tanggal = String(body.tanggal || "").trim();
    const jenis = String(body.jenis || "").toUpperCase();
    const alasan = String(body.alasan || "").trim();
    const buktiUrl = String(body.bukti_url || "").trim() || null;

    if (!validDate(tanggal)) {
      return NextResponse.json(
        { message: "Tanggal ketidakhadiran tidak valid." },
        { status: 400 }
      );
    }

    if (jenis !== "IZIN" && jenis !== "SAKIT") {
      return NextResponse.json(
        { message: "Jenis ketidakhadiran harus IZIN atau SAKIT." },
        { status: 400 }
      );
    }

    if (alasan.length < 5 || alasan.length > 2000) {
      return NextResponse.json(
        { message: "Alasan wajib diisi 5 sampai 2.000 karakter." },
        { status: 400 }
      );
    }

    if (buktiUrl && buktiUrl.length > 2000) {
      return NextResponse.json(
        { message: "Alamat bukti terlalu panjang." },
        { status: 400 }
      );
    }

    const todayRows = await sql`
      SELECT (NOW() AT TIME ZONE 'Asia/Jakarta')::date AS today
    `;

    const today = String(todayRows[0].today).slice(0, 10);

    if (tanggal > today) {
      return NextResponse.json(
        { message: "Pengajuan tidak boleh untuk tanggal mendatang." },
        { status: 400 }
      );
    }

    const attendance = await sql`
      SELECT id
      FROM absensi_pkl
      WHERE student_user_id = ${user.id}
        AND tanggal = ${tanggal}::date
        AND jam_masuk IS NOT NULL
      LIMIT 1
    `;

    if (attendance.length > 0) {
      return NextResponse.json(
        { message: "Kamu sudah tercatat hadir pada tanggal tersebut." },
        { status: 400 }
      );
    }

    const existing = await sql`
      SELECT id, status
      FROM ketidakhadiran_pkl
      WHERE student_user_id = ${user.id}
        AND tanggal = ${tanggal}::date
      LIMIT 1
    `;

    if (existing.length > 0) {
      return NextResponse.json(
        {
          message: "Pengajuan untuk tanggal tersebut sudah ada.",
          data: existing[0],
        },
        { status: 409 }
      );
    }

    const result = await sql`
      INSERT INTO ketidakhadiran_pkl (
        student_user_id,
        tanggal,
        jenis,
        alasan,
        bukti_url
      )
      VALUES (
        ${user.id},
        ${tanggal}::date,
        ${jenis},
        ${alasan},
        ${buktiUrl}
      )
      RETURNING
        id,
        tanggal,
        jenis,
        alasan,
        bukti_url,
        status,
        created_at
    `;

    return NextResponse.json(
      {
        message: "Pengajuan ketidakhadiran berhasil dikirim.",
        data: result[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Gagal mengajukan ketidakhadiran:", error);

    return NextResponse.json(
      { message: "Terjadi kesalahan saat mengirim pengajuan." },
      { status: 500 }
    );
  }
}
