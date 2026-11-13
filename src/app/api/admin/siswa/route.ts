
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sql } from "@/lib/db";
import { requireRole } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const admin = await requireRole("admin");

  if (!admin) {
    return NextResponse.json(
      { message: "Akses ditolak." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();

    const fullName = String(body.fullName || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const nisn = String(body.nisn || "").trim();
    const className = String(body.className || "").trim();
    const major = String(body.major || "").trim();
    const phone = String(body.phone || "").trim();
    const schoolId = Number(body.schoolId);

    if (
      !fullName ||
      !email ||
      !password ||
      !nisn ||
      !className ||
      !major ||
      !schoolId
    ) {
      return NextResponse.json(
        { message: "Semua kolom wajib diisi kecuali nomor telepon." },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { message: "Format email tidak valid." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: "Password minimal 8 karakter." },
        { status: 400 }
      );
    }

    if (!Number.isSafeInteger(schoolId) || schoolId <= 0) {
      return NextResponse.json(
        { message: "Sekolah tidak valid." },
        { status: 400 }
      );
    }

    // Periksa sekolah
    const school = await sql`
      SELECT id
      FROM schools
      WHERE id = ${schoolId}
        AND status = 'ACTIVE'
      LIMIT 1
    `;

    if (school.length === 0) {
      return NextResponse.json(
        { message: "Sekolah tidak ditemukan atau belum aktif." },
        { status: 404 }
      );
    }

    // Periksa email
    const existingEmail = await sql`
      SELECT id
      FROM users
      WHERE LOWER(email) = ${email}
      LIMIT 1
    `;

    if (existingEmail.length > 0) {
      return NextResponse.json(
        { message: "Email sudah digunakan." },
        { status: 409 }
      );
    }

    // Periksa NISN
    const existingNisn = await sql`
      SELECT user_id
      FROM student_profiles
      WHERE nisn = ${nisn}
      LIMIT 1
    `;

    if (existingNisn.length > 0) {
      return NextResponse.json(
        { message: "NISN sudah terdaftar." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Buat akun dan profil siswa sekaligus.
    const result = await sql`
      WITH new_user AS (
        INSERT INTO users (
          full_name,
          email,
          password_hash,
          role,
          school_id,
          is_active
        )
        VALUES (
          ${fullName},
          ${email},
          ${passwordHash},
          'student',
          ${schoolId},
          TRUE
        )
        RETURNING id
      ),
      new_profile AS (
        INSERT INTO student_profiles (
          user_id,
          nisn,
          class_name,
          major,
          phone
        )
        SELECT
          id,
          ${nisn},
          ${className},
          ${major},
          ${phone || null}
        FROM new_user
        RETURNING user_id
      )
      SELECT
        new_user.id
      FROM new_user
      INNER JOIN new_profile
        ON new_profile.user_id = new_user.id
    `;

    return NextResponse.json(
      {
        message: "Akun siswa berhasil dibuat.",
        studentId: Number(result[0].id),
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("CREATE STUDENT ERROR:", error);

    return NextResponse.json(
      { message: "Gagal membuat akun siswa." },
      { status: 500 }
    );
  }
}
