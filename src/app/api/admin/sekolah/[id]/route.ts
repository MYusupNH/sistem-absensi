
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireRole("admin");

  if (!user) {
    return NextResponse.json(
      { message: "Akses ditolak. Silakan login sebagai admin." },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;
    const schoolId = Number(id);

    if (!Number.isInteger(schoolId) || schoolId <= 0) {
      return NextResponse.json(
        { message: "ID sekolah tidak valid." },
        { status: 400 }
      );
    }

    const result = await sql`
      UPDATE schools
      SET status = 'INACTIVE'
      WHERE id = ${schoolId}
        AND status = 'ACTIVE'
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json(
        {
          message: "Data sekolah tidak ditemukan atau sudah dinonaktifkan."
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Data sekolah berhasil dihapus."
    });

  } catch (error) {
    console.error("DELETE SEKOLAH ERROR:", error);

    return NextResponse.json(
      {
        message: "Terjadi kesalahan saat menghapus data sekolah."
      },
      { status: 500 }
    );
  }
}
