
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { sql } from "@/lib/db";
import bcrypt from "bcryptjs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function getAccountId(context: RouteContext) {
  const { id } = await context.params;
  const accountId = Number(id);

  if (!Number.isSafeInteger(accountId) || accountId <= 0) {
    return null;
  }

  return accountId;
}

// EDIT AKUN / AKTIFKAN / NONAKTIFKAN
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const admin = await requireRole("admin");
    if (!admin) {
      return NextResponse.json(
        { message: "Akses ditolak." },
        { status: 403 }
      );
    }

    const id = await getAccountId(context);
    if (!id) {
      return NextResponse.json(
        { message: "ID akun tidak valid." },
        { status: 400 }
      );
    }

    const body = await request.json();

    const fullName = String(body.full_name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const isActive = body.is_active;
    const newPassword = String(body.new_password || "").trim();

    if (!fullName || !email || typeof isActive !== "boolean") {
      return NextResponse.json(
        { message: "Nama, email, dan status akun wajib diisi." },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { message: "Format email tidak valid." },
        { status: 400 }
      );
    }

    if (newPassword && newPassword.length < 8) {
      return NextResponse.json(
        { message: "Password baru minimal 8 karakter." },
        { status: 400 }
      );
    }

    const existing = await sql`
      SELECT id
      FROM users
      WHERE email = ${email}
        AND id <> ${id}
      LIMIT 1
    `;

    if (existing.length > 0) {
      return NextResponse.json(
        { message: "Email sudah digunakan akun lain." },
        { status: 409 }
      );
    }

    const passwordHash = newPassword
      ? await bcrypt.hash(newPassword, 12)
      : null;

    const updated = await sql`
      UPDATE users
      SET
        full_name = ${fullName},
        email = ${email},
        is_active = ${isActive},
        password_hash = COALESCE(${passwordHash}, password_hash)
      WHERE id = ${id}
      RETURNING id, full_name, email, role, is_active
    `;

    if (updated.length === 0) {
      return NextResponse.json(
        { message: "Akun tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Akun berhasil diperbarui.",
      account: updated[0],
    });
  } catch (error) {
    console.error("PATCH MANAJEMEN AKUN:", error);

    return NextResponse.json(
      { message: "Terjadi kesalahan saat memperbarui akun." },
      { status: 500 }
    );
  }
}

// HAPUS PERMANEN
export async function DELETE(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const admin = await requireRole("admin");
    if (!admin) {
      return NextResponse.json(
        { message: "Akses ditolak." },
        { status: 403 }
      );
    }

    const id = await getAccountId(context);
    if (!id) {
      return NextResponse.json(
        { message: "ID akun tidak valid." },
        { status: 400 }
      );
    }

    // Admin tidak boleh menghapus akunnya sendiri.
    if (Number((admin as { id?: number }).id) === id) {
      return NextResponse.json(
        { message: "Anda tidak dapat menghapus akun sendiri." },
        { status: 400 }
      );
    }

    const account = await sql`
      SELECT id, role
      FROM users
      WHERE id = ${id}
      LIMIT 1
    `;

    if (account.length === 0) {
      return NextResponse.json(
        { message: "Akun tidak ditemukan." },
        { status: 404 }
      );
    }

    // Lindungi akun yang masih memiliki riwayat PKL.
    const [
      attendance,
      reports,
      applications,
      submittedApplications,
    ] = await Promise.all([
      sql`
        SELECT id FROM absensi_pkl
        WHERE student_user_id = ${id}
        LIMIT 1
      `,
      sql`
        SELECT id FROM laporan_pkl
        WHERE student_user_id = ${id}
        LIMIT 1
      `,
      sql`
        SELECT id FROM detail_pengajuan_pkl
        WHERE student_user_id = ${id}
        LIMIT 1
      `,
      sql`
        SELECT id FROM pengajuan_pkl
        WHERE diajukan_oleh = ${id}
        LIMIT 1
      `,
    ]);

    if (
      attendance.length ||
      reports.length ||
      applications.length ||
      submittedApplications.length
    ) {
      return NextResponse.json(
        {
          message:
            "Akun memiliki riwayat absensi, laporan, atau pengajuan PKL. Nonaktifkan akun saja agar riwayat tetap aman.",
        },
        { status: 409 }
      );
    }

    // Hapus profil siswa jika ada, kemudian akun pengguna.
    await sql`
      DELETE FROM student_profiles
      WHERE user_id = ${id}
    `;

    const deleted = await sql`
      DELETE FROM users
      WHERE id = ${id}
      RETURNING id
    `;

    if (deleted.length === 0) {
      return NextResponse.json(
        { message: "Akun gagal dihapus atau sudah tidak tersedia." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Akun berhasil dihapus permanen.",
    });
  } catch (error) {
    console.error("DELETE MANAJEMEN AKUN:", error);

    return NextResponse.json(
      {
        message:
          "Akun belum dapat dihapus. Periksa apakah masih ada data lain yang terhubung.",
      },
      { status: 500 }
    );
  }
}
