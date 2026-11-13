
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole("admin");

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Tidak memiliki akses." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const logbookId = Number(id);

    if (!Number.isInteger(logbookId) || logbookId <= 0) {
      return NextResponse.json(
        { success: false, message: "ID logbook tidak valid." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const status = body.status;

    if (!["BELUM", "TERVALIDASI"].includes(status)) {
      return NextResponse.json(
        { success: false, message: "Status validasi tidak valid." },
        { status: 400 }
      );
    }

    const result = await sql`
      UPDATE laporan_pkl
      SET
        status_validasi = ${status},
        validated_at = ${
          status === "TERVALIDASI" ? new Date().toISOString() : null
        }
      WHERE id = ${logbookId}
      RETURNING id, status_validasi, validated_at
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, message: "Logbook tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        status === "TERVALIDASI"
          ? "Logbook berhasil divalidasi."
          : "Validasi logbook berhasil dibatalkan.",
      data: result[0],
    });
  } catch (error) {
    console.error("Gagal memvalidasi logbook:", error);

    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan saat memvalidasi logbook." },
      { status: 500 }
    );
  }
}
