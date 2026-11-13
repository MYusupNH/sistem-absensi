
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireRole("admin");

    if (!admin) {
      return NextResponse.json(
        { message: "Akses ditolak. Silakan login sebagai admin." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const presensiId = Number(id);

    if (!Number.isSafeInteger(presensiId) || presensiId <= 0) {
      return NextResponse.json(
        { message: "ID presensi tidak valid." },
        { status: 400 }
      );
    }

    const deleted = await sql`
      DELETE FROM absensi_pkl
      WHERE id = ${presensiId}
      RETURNING id
    `;

    if (deleted.length === 0) {
      return NextResponse.json(
        { message: "Data presensi tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Data presensi berhasil dihapus.",
    });
  } catch (error) {
    console.error("DELETE PRESENSI ERROR:", error);

    return NextResponse.json(
      { message: "Terjadi kesalahan saat menghapus data presensi." },
      { status: 500 }
    );
  }
}
