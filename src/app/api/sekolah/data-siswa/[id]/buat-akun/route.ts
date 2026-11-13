
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function validatePassword(password: string) {
  if (password.length < 8) {
    return "Password minimal 8 karakter.";
  }

  if (Buffer.byteLength(password, "utf8") > 72) {
    return "Password maksimal 72 byte.";
  }

  return null;
}

async function getStudent(studentId: number, schoolId: number) {
  const rows = await sql`
    SELECT id, full_name, nisn, class_name, major
    FROM school_students
    WHERE id = ${studentId}
      AND school_id = ${schoolId}
    LIMIT 1
  `;

  return rows[0] || null;
}

// MEMBUAT AKUN BARU ATAU MENGAKTIFKAN KEMBALI AKUN LAMA
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const user = await requireRole("school");

    if (!user?.schoolId) {
      return NextResponse.json(
        { message: "Akses sekolah tidak valid." },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const studentId = Number(id);

    if (!Number.isInteger(studentId) || studentId <= 0) {
      return NextResponse.json(
        { message: "ID siswa tidak valid." },
        { status: 400 }
      );
    }

    const body = await request.json();

    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { message: "Masukkan alamat email yang valid." },
        { status: 400 }
      );
    }

    const passwordError = validatePassword(password);

    if (passwordError) {
      return NextResponse.json(
        { message: passwordError },
        { status: 400 }
      );
    }

    const student = await getStudent(studentId, Number(user.schoolId));

    if (!student) {
      return NextResponse.json(
        { message: "Data siswa tidak ditemukan." },
        { status: 404 }
      );
    }

    // Cari akun berdasarkan NISN, termasuk akun yang sudah nonaktif.
    const existingRows = await sql`
      SELECT
        u.id,
        u.email,
        u.is_active
      FROM student_profiles sp
      INNER JOIN users u ON u.id = sp.user_id
      WHERE sp.nisn = ${student.nisn}
        AND u.school_id = ${user.schoolId}
        AND u.role = 'student'
      LIMIT 1
    `;

    const existingAccount = existingRows[0] || null;

    if (existingAccount?.is_active) {
      return NextResponse.json(
        { message: "Siswa ini sudah memiliki akun aktif." },
        { status: 409 }
      );
    }

    const existingUserId = existingAccount
      ? Number(existingAccount.id)
      : null;

    // Pastikan email tidak digunakan akun lain.
    const existingEmail = await sql`
      SELECT id
      FROM users
      WHERE LOWER(email) = ${email}
        AND (
          ${existingUserId}::int IS NULL
          OR id <> ${existingUserId}
        )
      LIMIT 1
    `;

    if (existingEmail.length > 0) {
      return NextResponse.json(
        { message: "Email tersebut sudah digunakan akun lain." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    if (existingAccount) {
      // Aktifkan kembali akun lama.
      // ID user dan profil tetap sama sehingga riwayat tidak terputus.
      await sql`
        UPDATE users
        SET
          full_name = ${student.full_name},
          email = ${email},
          password_hash = ${passwordHash},
          is_active = TRUE
        WHERE id = ${existingUserId}
          AND school_id = ${user.schoolId}
          AND role = 'student'
      `;

      await sql`
        UPDATE student_profiles
        SET
          class_name = ${student.class_name},
          major = ${student.major}
        WHERE user_id = ${existingUserId}
      `;
    } else {
      // Buat akun dan profil baru jika belum pernah memiliki akun.
      await sql`
        WITH new_user AS (
          INSERT INTO users (
            full_name,
            email,
            password_hash,
            role,
            school_id,
            is_active,
            created_at
          )
          VALUES (
            ${student.full_name},
            ${email},
            ${passwordHash},
            'student',
            ${user.schoolId},
            TRUE,
            NOW()
          )
          RETURNING id
        )
        INSERT INTO student_profiles (
          user_id,
          nisn,
          class_name,
          major,
          created_at
        )
        SELECT
          id,
          ${student.nisn},
          ${student.class_name},
          ${student.major},
          NOW()
        FROM new_user
      `;
    }

    return NextResponse.json({
      success: true,
      message: existingAccount
        ? "Akun siswa berhasil diaktifkan kembali."
        : "Akun siswa berhasil dibuat.",
      credentials: {
        email,
        password,
      },
    });
  } catch (error: unknown) {
    console.error("BUAT AKUN SISWA ERROR:", error);

    const dbError = error as { code?: string };

    if (dbError.code === "23505") {
      return NextResponse.json(
        { message: "NISN atau email sudah terdaftar." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: "Terjadi kesalahan saat membuat akun siswa." },
      { status: 500 }
    );
  }
}

// MENGATUR ULANG PASSWORD AKUN AKTIF
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const user = await requireRole("school");

    if (!user?.schoolId) {
      return NextResponse.json(
        { message: "Akses sekolah tidak valid." },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const studentId = Number(id);

    if (!Number.isInteger(studentId) || studentId <= 0) {
      return NextResponse.json(
        { message: "ID siswa tidak valid." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const password = String(body.password || "");

    const passwordError = validatePassword(password);

    if (passwordError) {
      return NextResponse.json(
        { message: passwordError },
        { status: 400 }
      );
    }

    const student = await getStudent(studentId, Number(user.schoolId));

    if (!student) {
      return NextResponse.json(
        { message: "Data siswa tidak ditemukan." },
        { status: 404 }
      );
    }

    const accounts = await sql`
      SELECT u.id, u.email
      FROM student_profiles sp
      INNER JOIN users u ON u.id = sp.user_id
      WHERE sp.nisn = ${student.nisn}
        AND u.school_id = ${user.schoolId}
        AND u.role = 'student'
        AND u.is_active = TRUE
      LIMIT 1
    `;

    if (accounts.length === 0) {
      return NextResponse.json(
        { message: "Akun siswa tidak ditemukan atau sudah nonaktif." },
        { status: 404 }
      );
    }

    const account = accounts[0];
    const passwordHash = await bcrypt.hash(password, 12);

    await sql`
      UPDATE users
      SET password_hash = ${passwordHash}
      WHERE id = ${account.id}
        AND school_id = ${user.schoolId}
        AND role = 'student'
        AND is_active = TRUE
    `;

    return NextResponse.json({
      success: true,
      message: "Password siswa berhasil diperbarui.",
      credentials: {
        email: account.email,
        password,
      },
    });
  } catch (error) {
    console.error("RESET PASSWORD SISWA ERROR:", error);

    return NextResponse.json(
      { message: "Terjadi kesalahan saat mengatur ulang password." },
      { status: 500 }
    );
  }
}
