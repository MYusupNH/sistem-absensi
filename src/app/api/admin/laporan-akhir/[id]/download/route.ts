
import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireRole } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Hanya admin yang boleh mengunduh laporan.
    const user = await requireRole("admin");

    if (!user) {
      return NextResponse.json(
        { message: "Akses ditolak. Khusus admin." },
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

    // Ambil file laporan yang saat ini aktif.
    const rows = await sql`
      SELECT
        l.id AS laporan_id,
        r.cloudinary_public_id,
        r.original_filename,
        r.mime_type
      FROM laporan_akhir_pkl l
      INNER JOIN laporan_akhir_riwayat r
        ON r.id = l.current_file_id
      WHERE l.id = ${laporanId}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { message: "Laporan atau file PDF tidak ditemukan." },
        { status: 404 }
      );
    }

    const report = rows[0];

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      console.error("Konfigurasi Cloudinary belum lengkap.");

      return NextResponse.json(
        { message: "Konfigurasi penyimpanan file belum lengkap." },
        { status: 500 }
      );
    }

    const publicId = String(report.cloudinary_public_id || "");
    const originalFilename = String(
      report.original_filename || "laporan-akhir.pdf"
    );

    if (!publicId) {
      return NextResponse.json(
        { message: "Identitas file Cloudinary tidak ditemukan." },
        { status: 404 }
      );
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const expiresAt = timestamp + 60;

    // Parameter private_download_url untuk raw/authenticated.
    const params: Record<string, string> = {
      attachment: "true",
      expires_at: String(expiresAt),
      format: "pdf",
      public_id: publicId,
      timestamp: String(timestamp),
      type: "authenticated",
    };

    // Signature SHA-1 sesuai parameter yang dikirim.
    const signatureString =
      Object.keys(params)
        .sort()
        .map((key) => `${key}=${params[key]}`)
        .join("&") + apiSecret;

    const signature = createHash("sha1")
      .update(signatureString, "utf8")
      .digest("hex");

    const query = new URLSearchParams({
      ...params,
      api_key: apiKey,
      signature,
    });

    const downloadUrl =
      `https://api.cloudinary.com/v1_1/${cloudName}/raw/download?${query.toString()}`;

    // Ambil file dari Cloudinary melalui server.
    const cloudinaryResponse = await fetch(downloadUrl, {
      method: "GET",
      cache: "no-store",
    });

    if (!cloudinaryResponse.ok) {
      const errorText = await cloudinaryResponse.text();

      console.error(
        "CLOUDINARY DOWNLOAD ERROR:",
        cloudinaryResponse.status,
        errorText
      );

      return NextResponse.json(
        {
          message:
            "Gagal mengambil PDF dari Cloudinary. Periksa konfigurasi dan data file.",
        },
        { status: 502 }
      );
    }

    const fileBuffer = new Uint8Array(
      await cloudinaryResponse.arrayBuffer()
    );

    // Bersihkan nama file untuk header download.
    const safeFilename = originalFilename
      .replace(/[\r\n"]/g, "")
      .replace(/[\\/]/g, "_");

    const fallbackFilename = safeFilename.replace(
      /[^\x20-\x7E]/g,
      "_"
    );

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          `attachment; filename="${fallbackFilename}"; filename*=UTF-8''${encodeURIComponent(safeFilename)}`,
        "Content-Length": String(fileBuffer.byteLength),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("DOWNLOAD LAPORAN AKHIR:", error);

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan saat mengunduh laporan.",
      },
      { status: 500 }
    );
  }
}
