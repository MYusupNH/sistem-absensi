import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireRole } from "@/lib/auth";

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireRole("admin");

    if (!user) {
      return NextResponse.json(
        { message: "Akses hanya untuk Admin." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const id = Number(body.id);
    const status = String(body.status || "");
    const catatan = String(body.catatan || "").trim();

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { message: "ID pengajuan tidak valid." },
        { status: 400 }
      );
    }

    if (!["DISETUJUI", "DITOLAK"].includes(status)) {
      return NextResponse.json(
        { message: "Status pengajuan tidak valid." },
        { status: 400 }
      );
    }

    if (status === "DITOLAK" && !catatan) {
      return NextResponse.json(
        { message: "Alasan penolakan wajib diisi." },
        { status: 400 }
      );
    }

    const updated = await sql`
      UPDATE pengajuan_pkl
      SET
        status = ${status},
        catatan_mitra = ${status === "DITOLAK" ? catatan : null},
        updated_at = NOW()
      WHERE id = ${id}
        AND status = 'MENUNGGU'
      RETURNING id
    `;

    if (updated.length === 0) {
      return NextResponse.json(
        {
          message:
            "Pengajuan tidak ditemukan atau sudah pernah diproses.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message:
        status === "DISETUJUI"
          ? "Pengajuan berhasil disetujui."
          : "Pengajuan berhasil ditolak.",
    });
  } catch (error) {
    console.error("ADMIN UPDATE PENGAJUAN:", error);

    return NextResponse.json(
      { message: "Terjadi kesalahan saat memproses pengajuan." },
      { status: 500 }
    );
  }
}