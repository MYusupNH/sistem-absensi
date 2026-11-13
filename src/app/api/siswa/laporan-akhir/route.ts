import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { uploadPdf } from "@/lib/cloudinary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function GET() {
  try {
    const user = await requireRole("student");

    if (!user) {
      return NextResponse.json(
        { message: "Akses ditolak." },
        { status: 401 }
      );
    }

    const laporan = await sql`
      SELECT
        l.id,
        l.status,
        l.submitted_at,
        l.reviewed_at,
        r.id AS file_id,
        r.original_filename,
        r.file_url,
        r.file_size,
        r.version_number,
        r.uploaded_at
      FROM laporan_akhir_pkl l
      LEFT JOIN laporan_akhir_riwayat r
        ON r.id = l.current_file_id
      WHERE l.student_user_id = ${user.id}
      LIMIT 1
    `;

    const riwayat = await sql`
      SELECT
        id,
        version_number,
        original_filename,
        file_url,
        file_size,
        uploaded_at
      FROM laporan_akhir_riwayat
      WHERE laporan_id = (
        SELECT id
        FROM laporan_akhir_pkl
        WHERE student_user_id = ${user.id}
      )
      ORDER BY version_number DESC
    `;

    const revisi = await sql`
      SELECT
        r.id,
        r.aksi,
        r.komentar,
        r.created_at,
        u.full_name AS reviewer_name
      FROM laporan_akhir_revisi r
      JOIN users u ON u.id = r.reviewer_user_id
      WHERE r.laporan_id = (
        SELECT id
        FROM laporan_akhir_pkl
        WHERE student_user_id = ${user.id}
      )
      ORDER BY r.created_at DESC
    `;

    return NextResponse.json({
      laporan: laporan[0] || null,
      riwayat,
      revisi,
    });
  } catch (error) {
    console.error("GET LAPORAN AKHIR:", error);

    return NextResponse.json(
      { message: "Gagal mengambil data laporan akhir." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole("student");

    if (!user) {
      return NextResponse.json(
        { message: "Akses ditolak." },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { message: "Pilih file PDF terlebih dahulu." },
        { status: 400 }
      );
    }

    if (
      file.type !== "application/pdf" ||
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      return NextResponse.json(
        { message: "File harus berformat PDF." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE || file.size === 0) {
      return NextResponse.json(
        { message: "Ukuran PDF maksimal 10 MB." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    if (buffer.subarray(0, 5).toString() !== "%PDF-") {
      return NextResponse.json(
        { message: "Isi file bukan dokumen PDF yang valid." },
        { status: 400 }
      );
    }

    const existing = await sql`
      SELECT id, status
      FROM laporan_akhir_pkl
      WHERE student_user_id = ${user.id}
      LIMIT 1
    `;

    if (
      existing.length > 0 &&
      !["BELUM_UPLOAD", "REVISI"].includes(
        String(existing[0].status)
      )
    ) {
      return NextResponse.json(
        {
          message:
            "Laporan sedang diperiksa atau sudah disetujui. Upload ulang tidak diizinkan.",
        },
        { status: 400 }
      );
    }

    const uploaded = await uploadPdf(
      file,
      "siprak/laporan-akhir"
    );

    const laporan = await sql`
      INSERT INTO laporan_akhir_pkl (
        student_user_id,
        status,
        submitted_at,
        updated_at
      )
      VALUES (
        ${user.id},
        'MENUNGGU_PEMERIKSAAN',
        NOW(),
        NOW()
      )
      ON CONFLICT (student_user_id)
      DO UPDATE SET
        status = 'MENUNGGU_PEMERIKSAAN',
        submitted_at = NOW(),
        reviewed_by = NULL,
        reviewed_at = NULL,
        updated_at = NOW()
      RETURNING id
    `;

    const laporanId = laporan[0].id;

    const versions = await sql`
      SELECT COALESCE(MAX(version_number), 0) AS total
      FROM laporan_akhir_riwayat
      WHERE laporan_id = ${laporanId}
    `;

    const version = Number(versions[0].total) + 1;

    const saved = await sql`
      INSERT INTO laporan_akhir_riwayat (
        laporan_id,
        version_number,
        original_filename,
        cloudinary_public_id,
        file_url,
        file_size,
        mime_type,
        uploaded_by
      )
      VALUES (
        ${laporanId},
        ${version},
        ${file.name},
        ${uploaded.publicId},
        ${uploaded.url},
        ${uploaded.bytes},
        'application/pdf',
        ${user.id}
      )
      RETURNING id
    `;

    await sql`
      UPDATE laporan_akhir_pkl
      SET current_file_id = ${saved[0].id},
          updated_at = NOW()
      WHERE id = ${laporanId}
    `;

    return NextResponse.json({
      message: "Laporan akhir berhasil diunggah.",
      version,
    });
  } catch (error) {
    console.error("UPLOAD LAPORAN AKHIR:", error);

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Gagal mengunggah laporan akhir.",
      },
      { status: 500 }
    );
  }
}