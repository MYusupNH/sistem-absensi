
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireRole("school");

  if (!user) {
    return NextResponse.json(
      { message: "Silakan login sebagai sekolah." },
      { status: 401 }
    );
  }

  if (!user.schoolId) {
    return NextResponse.json(
      { message: "Akun sekolah belum memiliki data sekolah." },
      { status: 403 }
    );
  }

  try {
    const rows = await sql`
      SELECT
        k.id,
        k.tanggal,
        k.jenis,
        k.alasan,
        k.bukti_url,
        k.status,
        k.catatan_guru,
        k.created_at,
        u.full_name,
        sp.nisn,
        sp.class_name,
        sp.major
      FROM ketidakhadiran_pkl k
      JOIN users u ON u.id = k.student_user_id
      LEFT JOIN student_profiles sp ON sp.user_id = u.id
      WHERE u.school_id = ${user.schoolId}
        AND u.role = 'student'
      ORDER BY
        CASE WHEN k.status = 'MENUNGGU' THEN 0 ELSE 1 END,
        k.tanggal DESC
    `;

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("Gagal mengambil pengajuan izin:", error);

    return NextResponse.json(
      { message: "Gagal mengambil pengajuan ketidakhadiran." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const user = await requireRole("school");

  if (!user) {
    return NextResponse.json(
      { message: "Silakan login sebagai sekolah." },
      { status: 401 }
    );
  }

  if (!user.schoolId) {
    return NextResponse.json(
      { message: "Akun sekolah belum memiliki data sekolah." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const id = Number(body.id);
    const status = String(body.status || "").toUpperCase();
    const catatan = String(body.catatan_guru || "").trim();

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { message: "ID pengajuan tidak valid." },
        { status: 400 }
      );
    }

    if (!["DISETUJUI", "DITOLAK"].includes(status)) {
      return NextResponse.json(
        { message: "Status pemeriksaan tidak valid." },
        { status: 400 }
      );
    }

    if (catatan.length > 1000) {
      return NextResponse.json(
        { message: "Catatan maksimal 1.000 karakter." },
        { status: 400 }
      );
    }

    const result = await sql`
      UPDATE ketidakhadiran_pkl k
      SET
        status = ${status},
        catatan_guru = ${catatan || null},
        reviewed_by = ${user.id},
        reviewed_at = NOW(),
        updated_at = NOW()
      FROM users siswa
      WHERE k.id = ${id}
        AND siswa.id = k.student_user_id
        AND siswa.school_id = ${user.schoolId}
        AND siswa.role = 'student'
        AND k.status = 'MENUNGGU'
      RETURNING
        k.id,
        k.tanggal,
        k.jenis,
        k.status,
        k.catatan_guru,
        k.reviewed_at
    `;

    if (result.length === 0) {
      return NextResponse.json(
        {
          message:
            "Pengajuan tidak ditemukan, bukan milik sekolah Anda, atau sudah diperiksa.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message:
        status === "DISETUJUI"
          ? "Pengajuan ketidakhadiran disetujui."
          : "Pengajuan ketidakhadiran ditolak.",
      data: result[0],
    });
  } catch (error) {
    console.error("Gagal memeriksa pengajuan izin:", error);

    return NextResponse.json(
      { message: "Terjadi kesalahan saat memeriksa pengajuan." },
      { status: 500 }
    );
  }
}
