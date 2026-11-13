
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { sql } from "@/lib/db";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const user = await requireRole("school");

    if (!user || !user.schoolId) {
      return NextResponse.json(
        {
          message: "Silakan login sebagai pihak sekolah.",
        },
        {
          status: 401,
        }
      );
    }

    const { id } = await context.params;
    const pengajuanId = Number(id);

    if (!Number.isInteger(pengajuanId) || pengajuanId <= 0) {
      return NextResponse.json(
        {
          message: "ID pengajuan tidak valid.",
        },
        {
          status: 400,
        }
      );
    }

    // Hapus hanya pengajuan milik sekolah yang sedang login.
    // Status yang diperbolehkan hanya MENUNGGU dan DITOLAK.
    // Data detail siswa dihapus terlebih dahulu.
    const result = await sql`
      WITH target AS MATERIALIZED (
        SELECT id
        FROM pengajuan_pkl
        WHERE id = ${pengajuanId}
          AND school_id = ${user.schoolId}
          AND UPPER(TRIM(status)) IN ('MENUNGGU', 'DITOLAK')
        FOR UPDATE
      ),
      deleted_details AS (
        DELETE FROM detail_pengajuan_pkl AS d
        USING target AS t
        WHERE d.pengajuan_id = t.id
        RETURNING d.id
      ),
      deleted_application AS (
        DELETE FROM pengajuan_pkl AS p
        USING target AS t
        WHERE p.id = t.id
          AND (SELECT COUNT(*) FROM deleted_details) >= 0
        RETURNING p.id
      )
      SELECT id
      FROM deleted_application
    `;

    if (result.length === 0) {
      return NextResponse.json(
        {
          message:
            "Pengajuan tidak ditemukan, bukan milik sekolah Anda, atau statusnya tidak dapat dihapus.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Pengajuan PKL berhasil dihapus.",
      },
      {
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error("HAPUS PENGAJUAN PKL ERROR:", error);

    const dbError = error as {
      code?: string;
    };

    if (dbError.code === "23503") {
      return NextResponse.json(
        {
          message:
            "Pengajuan tidak dapat dihapus karena masih terhubung dengan data lain.",
        },
        {
          status: 409,
        }
      );
    }

    return NextResponse.json(
      {
        message: "Terjadi kesalahan saat menghapus pengajuan PKL.",
      },
      {
        status: 500,
      }
    );
  }
}
