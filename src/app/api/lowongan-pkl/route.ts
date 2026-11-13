
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await sql`
      SELECT
        id,
        judul,
        nama_instansi,
        lokasi,
        deskripsi,
        persyaratan,
        jurusan,
        kuota,
        tanggal_mulai,
        tanggal_selesai,
        status,
        created_at
      FROM lowongan_pkl
      WHERE status = 'DIBUKA'
      ORDER BY created_at DESC
    `;

    return NextResponse.json(
      { success: true, data },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("PUBLIC LOWONGAN ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Gagal mengambil lowongan PKL." },
      { status: 500 }
    );
  }
}
