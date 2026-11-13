
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireRole } from "@/lib/auth";

export const runtime = "nodejs";

type Params = {
  params: Promise<{ id: string }>;
};

export async function DELETE(
  _request: NextRequest,
  { params }: Params
) {
  try {
    const user = await requireRole("school");

    if (!user.schoolId) {
      return NextResponse.json(
        { message: "Akses sekolah tidak valid." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const studentId = Number(id);

    if (!Number.isInteger(studentId) || studentId <= 0) {
      return NextResponse.json(
        { message: "ID siswa tidak valid." },
        { status: 400 }
      );
    }

    // Pastikan siswa merupakan milik sekolah yang sedang login.
    const students = await sql`
      SELECT id, nisn
      FROM school_students
      WHERE id = ${studentId}
        AND school_id = ${user.schoolId}
      LIMIT 1
    `;

    if (students.length === 0) {
      return NextResponse.json(
        { message: "Data siswa tidak ditemukan." },
        { status: 404 }
      );
    }

    const student = students[0];

    // Nonaktifkan akun tanpa menghapus profil dan riwayat siswa.
    const result = await sql`
      UPDATE users
      SET is_active = FALSE
      WHERE id IN (
        SELECT sp.user_id
        FROM student_profiles sp
        INNER JOIN users u ON u.id = sp.user_id
        WHERE sp.nisn = ${student.nisn}
          AND u.school_id = ${user.schoolId}
          AND u.role = 'student'
          AND u.is_active = TRUE
      )
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { message: "Akun siswa tidak ditemukan atau sudah tidak aktif." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Akun siswa berhasil dinonaktifkan. Data dan riwayat PKL tetap tersimpan.",
    });
  } catch (error) {
    console.error("HAPUS AKUN SISWA ERROR:", error);

    return NextResponse.json(
      { message: "Terjadi kesalahan saat menonaktifkan akun siswa." },
      { status: 500 }
    );
  }
}
