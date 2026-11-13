import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { sql } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Data sekolah
    const schoolName = String(body.schoolName || "").trim();
    const npsn = String(body.npsn || "").trim();
    const address = String(body.address || "").trim();
    const phone = String(body.phone || "").trim();

    // Data guru / penanggung jawab
    const fullName = String(body.fullName || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (
      !schoolName ||
      !npsn ||
      !fullName ||
      !email ||
      !password
    ) {
      return NextResponse.json(
        { message: "Lengkapi semua data yang wajib diisi." },
        { status: 400 }
      );
    }

    if (!/^\d{8,10}$/.test(npsn)) {
      return NextResponse.json(
        { message: "NPSN harus terdiri dari 8 sampai 10 angka." },
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
      WHERE email = ${email}
      LIMIT 1
    `;

    if (existingEmail.length > 0) {
      return NextResponse.json(
        { message: "Email sudah digunakan. Gunakan email lain." },
        { status: 409 }
      );
    }

    // Periksa NPSN
    const existingNpsn = await sql`
      SELECT id
      FROM schools
      WHERE npsn = ${npsn}
      LIMIT 1
    `;

    if (existingNpsn.length > 0) {
      return NextResponse.json(
        { message: "NPSN sekolah sudah terdaftar." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Kode internal dibuat otomatis oleh sistem.
    // Guru tidak perlu mengetahui atau memasukkannya.
    const schoolCode =
      "SPK-" + randomBytes(4).toString("hex").toUpperCase();

    // Membuat sekolah dan akun Guru dalam satu query.
    // Jika salah satu proses gagal, keduanya tidak tersimpan sebagian.
    await sql`
      WITH new_school AS (
        INSERT INTO schools (
          school_name,
          npsn,
          school_code,
          address,
          phone,
          status
        )
        VALUES (
          ${schoolName},
          ${npsn},
          ${schoolCode},
          ${address || null},
          ${phone || null},
          'PENDING'
        )
        RETURNING id
      ),
      new_user AS (
        INSERT INTO users (
          full_name,
          email,
          password_hash,
          role,
          school_id
        )
        SELECT
          ${fullName},
          ${email},
          ${passwordHash},
          'school',
          new_school.id
        FROM new_school
        RETURNING id
      )
      SELECT new_user.id
      FROM new_user
    `;

    return NextResponse.json(
      {
        message:
          "Pendaftaran berhasil. Akun Guru dan sekolah Anda sedang menunggu verifikasi Admin.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("REGISTER SCHOOL ERROR:", error);

    return NextResponse.json(
      {
        message:
          "Pendaftaran gagal. Periksa kembali data atau coba beberapa saat lagi.",
      },
      { status: 500 }
    );
  }
}