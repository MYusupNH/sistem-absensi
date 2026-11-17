
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { sql } from "@/lib/db";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

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

// ========================================
// EDIT AKUN / AKTIFKAN / NONAKTIFKAN
// ========================================

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

// ========================================
// HAPUS AKUN DAN RIWAYAT TERKAIT
// ========================================

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

    // Admin tidak boleh menghapus akun sendiri.
    if (Number((admin as { id?: number }).id) === id) {
      return NextResponse.json(
        { message: "Anda tidak dapat menghapus akun sendiri." },
        { status: 400 }
      );
    }

    // Pastikan akun tersedia.
    const account = await sql`
      SELECT id
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

    // Hapus seluruh data dalam satu transaksi.
    // Jika ada query gagal, seluruh transaksi dibatalkan.
    const results = await sql.transaction([
      // 1. Hapus detail pengajuan yang menggunakan
      // akun sebagai siswa.
      sql`
        DELETE FROM detail_pengajuan_pkl
        WHERE student_user_id = ${id}
      `,

      // 2. Hapus pengajuan yang dibuat oleh akun.
      // Detail terkait akan ikut terhapus melalui CASCADE.
      sql`
        DELETE FROM pengajuan_pkl
        WHERE diajukan_oleh = ${id}
      `,

      // 3. Hapus akun.
      // Data yang memiliki relasi ON DELETE CASCADE
      // akan ikut terhapus oleh database.
      sql`
        DELETE FROM users
        WHERE id = ${id}
        RETURNING id
      `,
    ]);

    const deleted = results[2] as Array<{ id: number }>;

    if (!deleted || deleted.length === 0) {
      return NextResponse.json(
        { message: "Akun tidak ditemukan atau sudah dihapus." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Akun dan riwayat terkait berhasil dihapus permanen.",
    });
  } catch (error) {
    console.error("DELETE MANAJEMEN AKUN:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "Gagal menghapus akun dan riwayat terkait. Seluruh perubahan telah dibatalkan.",
      },
      { status: 500 }
    );
  }
}
