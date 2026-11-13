
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sql } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
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

    // Validasi seluruh data wajib
   if (
  !fullName ||
  !email ||
  !password ||
  !nisn ||
  !className ||
  !major ||
  !phone ||
  !Number.isInteger(schoolId) ||
  schoolId <= 0
) {
  return NextResponse.json(
    { message: "Semua data wajib harus diisi." },
    { status: 400 }
  );
}

    if (password.length < 8) {
      return NextResponse.json(
        { message: "Password minimal 8 karakter." },
        { status: 400 }
      );
    }

    // Pastikan sekolah tersedia dan aktif
    const schoolRows = await sql`
      SELECT id, school_name
      FROM schools
      WHERE id = ${schoolId}
        AND status = 'ACTIVE'
      LIMIT 1
    `;

    if (schoolRows.length === 0) {
      return NextResponse.json(
        { message: "Sekolah tidak ditemukan atau belum diverifikasi." },
        { status: 404 }
      );
    }

    // Periksa email
    const existingEmail = await sql`
      SELECT id
      FROM users
      WHERE email = ${email}
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
      SELECT id
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

    const userRows = await sql`
      INSERT INTO users (
        full_name,
        email,
        password_hash,
        role,
        school_id
      )
      VALUES (
        ${fullName},
        ${email},
        ${passwordHash},
        'student',
        ${schoolId}
      )
      RETURNING id
    `;

    await sql`
      INSERT INTO student_profiles (
        user_id,
        nisn,
        class_name,
        major,
        phone
      )
      VALUES (
        ${Number(userRows[0].id)},
        ${nisn},
        ${className},
        ${major},
        ${phone || null}
      )
    `;

    return NextResponse.json(
      {
        message: "Pendaftaran siswa berhasil. Silakan login.",
        schoolName: schoolRows[0].school_name,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("REGISTER STUDENT ERROR:", error);

    return NextResponse.json(
      { message: "Pendaftaran siswa gagal. Periksa kembali data." },
      { status: 500 }
    );
  }
}
