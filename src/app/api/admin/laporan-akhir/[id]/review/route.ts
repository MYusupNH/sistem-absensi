
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole("admin");

    if (!user) {
      return NextResponse.json(
        { message: "Akses ditolak. Khusus Admin." },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const laporanId = Number(id);

    if (!Number.isSafeInteger(laporanId) || laporanId <= 0) {
      return NextResponse.json(
        { message: "ID laporan tidak valid." },
        { status: 400 }
      );
    }

    const body = await request.json();

    const aksi = body.aksi;
    const komentar =
      typeof body.komentar === "string"
        ? body.komentar.trim()
        : "";

    if (!["DISETUJUI", "DIMINTA_REVISI"].includes(aksi)) {
      return NextResponse.json(
        { message: "Aksi pemeriksaan tidak valid." },
        { status: 400 }
      );
    }

    if (aksi === "DIMINTA_REVISI" && !komentar) {
      return NextResponse.json(
        { message: "Komentar revisi wajib diisi." },
        { status: 400 }
      );
    }

    const laporan = await sql`
      SELECT id, status
      FROM laporan_akhir_pkl
      WHERE id = ${laporanId}
      LIMIT 1
    `;

    if (laporan.length === 0) {
      return NextResponse.json(
        { message: "Laporan akhir tidak ditemukan." },
        { status: 404 }
      );
    }

    if (laporan[0].status !== "MENUNGGU_PEMERIKSAAN") {
      return NextResponse.json(
        {
          message:
            "Laporan ini tidak sedang menunggu pemeriksaan. Muat ulang halaman."
        },
        { status: 409 }
      );
    }

    const statusBaru =
      aksi === "DISETUJUI" ? "DISETUJUI" : "REVISI";

    await sql`
      INSERT INTO laporan_akhir_revisi (
        laporan_id,
        reviewer_user_id,
        aksi,
        komentar
      )
      VALUES (
        ${laporanId},
        ${user.id},
        ${aksi},
        ${komentar || null}
      )
    `;

    await sql`
      UPDATE laporan_akhir_pkl
      SET
        status = ${statusBaru},
        reviewed_by = ${user.id},
        reviewed_at = NOW(),
        updated_at = NOW()
      WHERE id = ${laporanId}
    `;

    return NextResponse.json({
      success: true,
      message:
        aksi === "DISETUJUI"
          ? "Laporan berhasil disetujui."
          : "Permintaan revisi berhasil dikirim.",
      status: statusBaru,
    });
  } catch (error) {
    console.error("REVIEW LAPORAN ERROR:", error);

    return NextResponse.json(
      { message: "Terjadi kesalahan saat memeriksa laporan." },
      { status: 500 }
    );
  }
}
