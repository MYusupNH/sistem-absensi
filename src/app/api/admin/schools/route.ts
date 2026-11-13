
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { sql } from "@/lib/db";
import { requireRole } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const admin = await requireRole("admin");

  if (!admin) {
    return NextResponse.json(
      { message: "Akses ditolak." },
      { status: 403 }
    );
  }

  try {
    const schools = await sql`
      SELECT
        s.id,
        s.school_name,
        s.npsn,
        s.school_code,
        s.address,
        s.phone,
        s.status,
        s.created_at,
        u.full_name,
        u.email,
        u.username
      FROM schools s
      LEFT JOIN users u
        ON u.school_id = s.id
        AND u.role = 'school'
      ORDER BY s.created_at DESC
    `;

    return NextResponse.json({ schools });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Gagal mengambil data sekolah." },
      { status: 500 }
    );
  }
}

// TAMBAH SEKOLAH MANUAL
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

    const schoolName = String(body.schoolName || "").trim();
    const npsn = String(body.npsn || "").trim();
    const address = String(body.address || "").trim();
    const phone = String(body.phone || "").trim();

    // Username tidak dibatasi format karakternya.
    const username = String(body.username || "").trim();

    const password = String(body.password || "");

    if (!schoolName || !npsn || !username || !password) {
      return NextResponse.json(
        {
          message:
            "Nama sekolah, NPSN, username, dan password wajib diisi.",
        },
        { status: 400 }
      );
    }

    if (npsn.length < 8 || npsn.length > 10 || !/^\d+$/.test(npsn)) {
      return NextResponse.json(
        { message: "NPSN harus terdiri dari 8 sampai 10 angka." },
        { status: 400 }
      );
    }

    if (username.length > 100) {
      return NextResponse.json(
        { message: "Username maksimal 100 karakter." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: "Password minimal 8 karakter." },
        { status: 400 }
      );
    }

    // Periksa NPSN.
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

    // Periksa username tanpa membedakan huruf besar dan kecil.
    const existingUsername = await sql`
      SELECT id
      FROM users
      WHERE LOWER(username) = LOWER(${username})
      LIMIT 1
    `;

    if (existingUsername.length > 0) {
      return NextResponse.json(
        { message: "Username sudah digunakan. Gunakan username lain." },
        { status: 409 }
      );
    }

    // Email internal dibuat otomatis.
    const internalEmail =
      `sekolah-${randomBytes(12).toString("hex")}@akun.stride.local`;

    const passwordHash = await bcrypt.hash(password, 12);

    const schoolCode =
      "SPK-" + randomBytes(4).toString("hex").toUpperCase();

    // Membuat sekolah dan akun login dalam satu query.
    const result = await sql`
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
          'ACTIVE'
        )
        RETURNING id, school_name, npsn
      ),
      new_user AS (
        INSERT INTO users (
          full_name,
          email,
          username,
          password_hash,
          role,
          school_id,
          is_active
        )
        SELECT
          ${schoolName},
          ${internalEmail},
          ${username},
          ${passwordHash},
          'school',
          new_school.id,
          TRUE
        FROM new_school
        RETURNING id, username
      )
      SELECT
        new_school.id AS school_id,
        new_school.school_name,
        new_school.npsn,
        new_user.username
      FROM new_school
      CROSS JOIN new_user
    `;

    return NextResponse.json(
      {
        message: "Sekolah dan akun login berhasil dibuat.",
        school: result[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE SCHOOL ERROR:", error);

    return NextResponse.json(
      {
        message:
          "Gagal membuat sekolah. Periksa kembali data atau coba lagi.",
      },
      { status: 500 }
    );
  }
}

// UPDATE STATUS SEKOLAH
export async function PATCH(request: NextRequest) {
  const admin = await requireRole("admin");

  if (!admin) {
    return NextResponse.json(
      { message: "Akses ditolak." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();

    const id = Number(body.id);
    const status = String(body.status || "");

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { message: "ID sekolah tidak valid." },
        { status: 400 }
      );
    }

    if (!["ACTIVE", "REJECTED"].includes(status)) {
      return NextResponse.json(
        { message: "Status tidak valid." },
        { status: 400 }
      );
    }

    const result = await sql`
      UPDATE schools
      SET
        status = ${status},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, school_name, status
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { message: "Sekolah tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message:
        status === "ACTIVE"
          ? "Sekolah berhasil diverifikasi."
          : "Pendaftaran sekolah ditolak.",
      school: result[0],
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Gagal memperbarui status sekolah." },
      { status: 500 }
    );
  }
}
