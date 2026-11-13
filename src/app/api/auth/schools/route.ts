import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const schools = await sql`
      SELECT id, school_name
      FROM schools
      WHERE status = 'ACTIVE'
      ORDER BY school_name ASC
    `;

    return NextResponse.json({ schools });
  } catch (error) {
    console.error("GET SCHOOLS ERROR:", error);

    return NextResponse.json(
      { message: "Gagal mengambil daftar sekolah." },
      { status: 500 }
    );
  }
}