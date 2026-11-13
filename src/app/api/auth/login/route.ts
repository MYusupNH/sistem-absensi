
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sql } from "@/lib/db";
import { createSession, UserRole } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Bisa menggunakan email atau username.
    const identifier = String(
      body.email || body.username || ""
    ).trim().toLowerCase();

    const password = String(body.password || "");
    const role = String(body.role || "") as UserRole;

    if (!identifier || !password || !role) {
      return NextResponse.json(
        { message: "Username/email, password, dan jenis akun wajib diisi." },
        { status: 400 }
      );
    }

    if (!["admin", "school", "student"].includes(role)) {
      return NextResponse.json(
        { message: "Jenis akun tidak valid." },
        { status: 400 }
      );
    }

    const rows = await sql`
      SELECT
        id,
        full_name,
        email,
        username,
        password_hash,
        role,
        school_id,
        is_active
      FROM users
      WHERE (
        LOWER(email) = ${identifier}
        OR LOWER(username) = ${identifier}
      )
        AND role = ${role}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { message: "Username/email atau password salah." },
        { status: 401 }
      );
    }

    const user = rows[0];

    if (!user.is_active) {
      return NextResponse.json(
        { message: "Akun ini tidak aktif. Hubungi admin." },
        { status: 403 }
      );
    }

    const passwordValid = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordValid) {
      return NextResponse.json(
        { message: "Username/email atau password salah." },
        { status: 401 }
      );
    }

    await createSession({
      id: Number(user.id),
      fullName: user.full_name,
      email: user.email,
      role: user.role,
      schoolId: user.school_id
        ? Number(user.school_id)
        : null,
    });

    const destination = {
      admin: "/admin",
      school: "/sekolah",
      student: "/siswa",
    }[role];

    return NextResponse.json({
      message: "Login berhasil.",
      redirect: destination,
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return NextResponse.json(
      { message: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}
