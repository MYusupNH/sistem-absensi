import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

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

    const fullName = String(body.fullName ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const nisn = String(body.nisn ?? "").trim();
    const className = String(body.className ?? "").trim();
    const major = String(body.major ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const password = String(body.password ?? "");
    const isActive = body.isActive;

    if (!fullName || !email) {
      return NextResponse.json(
        { message: "Nama dan email wajib diisi." },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { message: "Format email tidak valid." },
        { status: 400 }
      );
    }

    if (typeof isActive !== "boolean") {
      return NextResponse.json(
        { message: "Status akun tidak valid." },
        { status: 400 }
      );
    }

    if (password && password.length < 8) {
      return NextResponse.json(
        { message: "Kata sandi baru minimal 8 karakter." },
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

    // Periksa apakah email sudah digunakan akun lain.
    const duplicateEmail = await sql`
      SELECT id
      FROM users
      WHERE LOWER(email) = ${email}
        AND id <> ${studentId}
      LIMIT 1
    `;

    if (duplicateEmail.length > 0) {
      return NextResponse.json(
        { message: "Email sudah digunakan oleh akun lain." },
        { status: 409 }
      );
    }

    // Perbarui data akun siswa.
    if (password.trim()) {
      const passwordHash = await bcrypt.hash(password, 12);

      await sql`
        UPDATE users
        SET
          full_name = ${fullName},
          email = ${email},
          is_active = ${isActive},
          password_hash = ${passwordHash}
        WHERE id = ${studentId}
          AND role = 'student'
      `;
    } else {
      await sql`
        UPDATE users
        SET
          full_name = ${fullName},
          email = ${email},
          is_active = ${isActive}
        WHERE id = ${studentId}
          AND role = 'student'
      `;
    }

    // Periksa apakah profil siswa sudah tersedia.
    const existingProfile = await sql`
      SELECT id
      FROM student_profiles
      WHERE user_id = ${studentId}
      LIMIT 1
    `;

    if (existingProfile.length > 0) {
      await sql`
        UPDATE student_profiles
        SET
          nisn = ${nisn},
          class_name = ${className},
          major = ${major},
          phone = ${phone}
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
          ${nisn},
          ${className},
          ${major},
          ${phone}
        )
      `;
    }

    return NextResponse.json({
      success: true,
      message: "Data siswa berhasil diperbarui.",
    });
  } catch (error: unknown) {
    console.error("UPDATE STUDENT ERROR:", error);

    const databaseError = error as { code?: string };

    if (databaseError.code === "23505") {
      return NextResponse.json(
        { message: "Email atau NISN sudah digunakan." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: "Terjadi kesalahan saat memperbarui data siswa." },
      { status: 500 }
    );
  }
}