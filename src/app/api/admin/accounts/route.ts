
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
    const role = String(body.role || "");

    const schoolId =
      body.schoolId === "" || body.schoolId == null
        ? null
        : Number(body.schoolId);

    const nisn = String(body.nisn || "").trim();
    const className = String(body.className || "").trim();
    const major = String(body.major || "").trim();
    const phone = String(body.phone || "").trim();

    // Validasi umum
    if (!fullName || !email || !password || !role) {
      return NextResponse.json(
        { message: "Nama, email, password, dan jenis akun wajib diisi." },
        { status: 400 }
      );
    }

    if (!["admin", "school", "student"].includes(role)) {
      return NextResponse.json(
        { message: "Jenis akun tidak valid." },
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

    // Sekolah dan siswa harus terhubung ke sekolah aktif.
    if (role === "school" || role === "student") {
      if (
        schoolId === null ||
        !Number.isSafeInteger(schoolId) ||
        schoolId <= 0
      ) {
        return NextResponse.json(
          { message: "Silakan pilih sekolah." },
          { status: 400 }
        );
      }

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
    }

    // Satu sekolah hanya memiliki satu akun login sekolah.
    if (role === "school") {
      const existingSchoolAccount = await sql`
        SELECT id
        FROM users
        WHERE school_id = ${schoolId}
          AND role = 'school'
        LIMIT 1
      `;

      if (existingSchoolAccount.length > 0) {
        return NextResponse.json(
          {
            message:
              "Sekolah tersebut sudah memiliki akun login. Gunakan fitur edit akun untuk mengubahnya.",
          },
          { status: 409 }
        );
      }
    }

    // Validasi khusus siswa.
    if (role === "student") {
      if (!nisn || !className || !major) {
        return NextResponse.json(
          {
            message:
              "NISN, kelas, dan jurusan wajib diisi untuk akun siswa.",
          },
          { status: 400 }
        );
      }

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
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // ADMIN
    if (role === "admin") {
      const result = await sql`
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
          'admin',
          NULL,
          TRUE
        )
        RETURNING id
      `;

      return NextResponse.json(
        {
          message: "Akun admin berhasil dibuat.",
          accountId: Number(result[0].id),
        },
        { status: 201 }
      );
    }

    // GURU / SEKOLAH
    if (role === "school") {
      const result = await sql`
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
          'school',
          ${schoolId},
          TRUE
        )
        RETURNING id
      `;

      return NextResponse.json(
        {
          message: "Akun sekolah berhasil dibuat.",
          accountId: Number(result[0].id),
        },
        { status: 201 }
      );
    }

    // SISWA: buat akun dan profil sekaligus.
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
      SELECT new_user.id
      FROM new_user
      INNER JOIN new_profile
        ON new_profile.user_id = new_user.id
    `;

    return NextResponse.json(
      {
        message: "Akun dan profil siswa berhasil dibuat.",
        accountId: Number(result[0].id),
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("CREATE ACCOUNT ERROR:", error);

    return NextResponse.json(
      { message: "Gagal membuat akun. Periksa kembali data yang dimasukkan." },
      { status: 500 }
    );
  }
}
