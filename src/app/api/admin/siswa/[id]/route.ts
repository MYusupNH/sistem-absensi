
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// ========================================
// EDIT DATA SISWA
// ========================================

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const admin = await requireRole("admin");

    if (!admin) {
      return NextResponse.json(
        { message: "Akses ditolak. Silakan login sebagai Admin." },
        { status: 401 }
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

    const body = await request.json();

    const {
      fullName,
      email,
      nisn,
      className,
      major,
      phone,
      password,
      isActive,
    } = body;

    if (!fullName?.trim() || !email?.trim()) {
      return NextResponse.json(
        { message: "Nama lengkap dan email wajib diisi." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: "Format email tidak valid." },
        { status: 400 }
      );
    }

    if (typeof isActive !== "boolean") {
      return NextResponse.json(
        { message: "Status siswa tidak valid." },
        { status: 400 }
      );
    }

    if (password && password.length < 8) {
      return NextResponse.json(
        { message: "Password minimal 8 karakter." },
        { status: 400 }
      );
    }

    const existingStudent = await sql`
      SELECT id
      FROM users
      WHERE id = ${studentId}
        AND role = 'student'
      LIMIT 1
    `;

    if (existingStudent.length === 0) {
      return NextResponse.json(
        { message: "Data siswa tidak ditemukan." },
        { status: 404 }
      );
    }

    const duplicateEmail = await sql`
      SELECT id
      FROM users
      WHERE LOWER(email) = LOWER(${email.trim()})
        AND id != ${studentId}
      LIMIT 1
    `;

    if (duplicateEmail.length > 0) {
      return NextResponse.json(
        { message: "Email sudah digunakan oleh akun lain." },
        { status: 409 }
      );
    }

    if (password?.trim()) {
      const passwordHash = await bcrypt.hash(password, 10);

      await sql`
        UPDATE users
        SET
          full_name = ${fullName.trim()},
          email = ${email.trim()},
          is_active = ${isActive},
          password_hash = ${passwordHash}
        WHERE id = ${studentId}
          AND role = 'student'
      `;
    } else {
      await sql`
        UPDATE users
        SET
          full_name = ${fullName.trim()},
          email = ${email.trim()},
          is_active = ${isActive}
        WHERE id = ${studentId}
          AND role = 'student'
      `;
    }

    const existingProfile = await sql`
      SELECT user_id
      FROM student_profiles
      WHERE user_id = ${studentId}
      LIMIT 1
    `;

    if (existingProfile.length > 0) {
      await sql`
        UPDATE student_profiles
        SET
          nisn = ${nisn || null},
          class_name = ${className || null},
          major = ${major || null},
          phone = ${phone || null}
        WHERE user_id = ${studentId}
      `;
    } else {
      await sql`
        INSERT INTO student_profiles (
          user_id,
          nisn,
          class_name,
          major,
          phone
        )
        VALUES (
          ${studentId},
          ${nisn || null},
          ${className || null},
          ${major || null},
          ${phone || null}
        )
      `;
    }

    return NextResponse.json({
      success: true,
      message: "Data siswa berhasil diperbarui.",
    });
  } catch (error) {
    console.error("UPDATE STUDENT ERROR:", error);

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      return NextResponse.json(
        { message: "Data email atau NISN sudah digunakan." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: "Terjadi kesalahan saat memperbarui data siswa." },
      { status: 500 }
    );
  }
}

// ========================================
// HAPUS PERMANEN DATA SISWA
// ========================================

export async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const admin = await requireRole("admin");

    if (!admin) {
      return NextResponse.json(
        { message: "Akses ditolak. Silakan login sebagai Admin." },
        { status: 401 }
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

    const result = await sql`
      DELETE FROM users
      WHERE id = ${studentId}
        AND role = 'student'
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { message: "Data siswa tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Data siswa berhasil dihapus secara permanen.",
    });
  } catch (error) {
    console.error("DELETE STUDENT ERROR:", error);

    return NextResponse.json(
      {
        message:
          "Gagal menghapus data siswa. Kemungkinan masih terdapat data terkait di tabel lain.",
      },
      { status: 500 }
    );
  }
}
