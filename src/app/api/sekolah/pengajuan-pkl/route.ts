
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

type ManualStudent = {
  fullName: string;
  email: string;
  nisn: string;
  className: string;
  major: string;
};

function validMonth(value: string) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: NextRequest) {
  let uploadedFilePath = "";

  try {
    const user = await requireRole("school");

    if (!user) {
      return NextResponse.json(
        { message: "Silakan login sebagai Guru/Sekolah." },
        { status: 401 }
      );
    }

    if (!user.schoolId) {
      return NextResponse.json(
        { message: "Akun sekolah tidak memiliki data sekolah." },
        { status: 403 }
      );
    }

    const formData = await request.formData();

    const lowonganId = Number(formData.get("lowonganId"));
    const studentsRaw = String(formData.get("students") || "[]");
    const bulanMulai = String(formData.get("bulanMulai") || "");
    const bulanSelesai = String(formData.get("bulanSelesai") || "");
    const namaGuru = String(
      formData.get("namaGuruPembimbing") || ""
    ).trim();
    const pesan = String(formData.get("pesan") || "").trim();
    const surat = formData.get("suratPengajuan");

    let students: ManualStudent[];

    try {
      const parsed = JSON.parse(studentsRaw);

      if (!Array.isArray(parsed)) {
        throw new Error("Format siswa tidak valid.");
      }

      students = parsed.map((item: Record<string, unknown>) => ({
        fullName: String(item.fullName || "").trim(),
        email: String(item.email || "").trim().toLowerCase(),
        nisn: String(item.nisn || "").trim(),
        className: String(item.className || "").trim(),
        major: String(item.major || "").trim(),
      }));
    } catch {
      return NextResponse.json(
        { message: "Format data siswa tidak valid." },
        { status: 400 }
      );
    }

    if (
      !Number.isSafeInteger(lowonganId) ||
      lowonganId <= 0
    ) {
      return NextResponse.json(
        { message: "Lowongan PKL tidak valid." },
        { status: 400 }
      );
    }

    if (students.length === 0) {
      return NextResponse.json(
        { message: "Masukkan minimal satu siswa." },
        { status: 400 }
      );
    }

    if (students.length > 200) {
      return NextResponse.json(
        { message: "Jumlah siswa melebihi batas pengajuan." },
        { status: 400 }
      );
    }

    for (let i = 0; i < students.length; i++) {
      const student = students[i];

      if (
        !student.fullName ||
        !student.email ||
        !student.nisn ||
        !student.className ||
        !student.major
      ) {
        return NextResponse.json(
          { message: `Data siswa ke-${i + 1} belum lengkap.` },
          { status: 400 }
        );
      }

      if (student.fullName.length > 150) {
        return NextResponse.json(
          { message: `Nama siswa ke-${i + 1} terlalu panjang.` },
          { status: 400 }
        );
      }

      if (!/^\d{10}$/.test(student.nisn)) {
        return NextResponse.json(
          { message: `NISN siswa ke-${i + 1} harus 10 angka.` },
          { status: 400 }
        );
      }

      if (!validEmail(student.email) || student.email.length > 254) {
        return NextResponse.json(
          { message: `Email siswa ke-${i + 1} tidak valid.` },
          { status: 400 }
        );
      }

      if (student.className.length > 50 || student.major.length > 100) {
        return NextResponse.json(
          { message: `Kelas atau jurusan siswa ke-${i + 1} terlalu panjang.` },
          { status: 400 }
        );
      }
    }

    const nisnList = students.map((student) => student.nisn);

    if (new Set(nisnList).size !== nisnList.length) {
      return NextResponse.json(
        { message: "Terdapat NISN yang sama dalam formulir." },
        { status: 400 }
      );
    }

    if (!namaGuru || namaGuru.length > 150) {
      return NextResponse.json(
        { message: "Nama guru pembimbing wajib diisi maksimal 150 karakter." },
        { status: 400 }
      );
    }

    if (
      !validMonth(bulanMulai) ||
      !validMonth(bulanSelesai) ||
      bulanSelesai < bulanMulai
    ) {
      return NextResponse.json(
        { message: "Periode PKL tidak valid." },
        { status: 400 }
      );
    }

    if (pesan.length > 2000) {
      return NextResponse.json(
        { message: "Keterangan maksimal 2000 karakter." },
        { status: 400 }
      );
    }

    if (
      !surat ||
      typeof surat === "string" ||
      typeof surat.arrayBuffer !== "function"
    ) {
      return NextResponse.json(
        { message: "Surat pengajuan PKL wajib diunggah." },
        { status: 400 }
      );
    }

    if (surat.size <= 0 || surat.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { message: "Ukuran surat harus lebih dari 0 dan maksimal 5 MB." },
        { status: 400 }
      );
    }

    if (!surat.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { message: "File surat harus berformat PDF." },
        { status: 400 }
      );
    }

    const fileBuffer = Buffer.from(await surat.arrayBuffer());

    if (fileBuffer.subarray(0, 5).toString() !== "%PDF-") {
      return NextResponse.json(
        { message: "Isi file bukan dokumen PDF yang valid." },
        { status: 400 }
      );
    }

    // Pastikan lowongan masih dibuka.
    const lowonganRows = await sql`
      SELECT id, kuota, status
      FROM lowongan_pkl
      WHERE id = ${lowonganId}
      LIMIT 1
    `;

    if (
      lowonganRows.length === 0 ||
      lowonganRows[0].status !== "DIBUKA"
    ) {
      return NextResponse.json(
        { message: "Lowongan sudah tidak tersedia atau ditutup." },
        { status: 404 }
      );
    }

    const kuota = Number(lowonganRows[0].kuota);

    // Cegah siswa yang sama diajukan lagi ke lowongan
    // yang sama ketika pengajuan sebelumnya masih aktif.
    const duplicateManual = await sql`
      SELECT s.nisn
      FROM detail_pengajuan_siswa_manual d
      INNER JOIN school_students s ON s.id = d.student_id
      INNER JOIN pengajuan_pkl p ON p.id = d.pengajuan_id
      WHERE s.school_id = ${user.schoolId}
        AND p.lowongan_id = ${lowonganId}
        AND p.status IN ('MENUNGGU', 'DISETUJUI')
        AND s.nisn = ANY(${nisnList}::varchar[])
    `;

    if (duplicateManual.length > 0) {
      return NextResponse.json(
        {
          message:
            "Ada siswa yang sudah diajukan ke lowongan ini dan pengajuannya masih menunggu atau diterima.",
        },
        { status: 409 }
      );
    }

    // Periksa juga data peserta dari sistem akun siswa lama.
    const duplicateOld = await sql`
      SELECT sp.nisn
      FROM detail_pengajuan_pkl d
      INNER JOIN pengajuan_pkl p ON p.id = d.pengajuan_id
      INNER JOIN users u ON u.id = d.student_user_id
      INNER JOIN student_profiles sp ON sp.user_id = u.id
      WHERE u.school_id = ${user.schoolId}
        AND p.lowongan_id = ${lowonganId}
        AND p.status IN ('MENUNGGU', 'DISETUJUI')
        AND sp.nisn = ANY(${nisnList}::varchar[])
    `;

    if (duplicateOld.length > 0) {
      return NextResponse.json(
        {
          message:
            "Ada siswa yang sudah terdaftar pada pengajuan aktif di lowongan ini.",
        },
        { status: 409 }
      );
    }

    // Hitung kuota dari peserta sistem lama dan sistem manual.
    const quotaRows = await sql`
      SELECT
        (
          SELECT COUNT(*)
          FROM detail_pengajuan_pkl d
          INNER JOIN pengajuan_pkl p ON p.id = d.pengajuan_id
          WHERE p.lowongan_id = ${lowonganId}
            AND p.status IN ('MENUNGGU', 'DISETUJUI')
        )::int
        +
        (
          SELECT COUNT(*)
          FROM detail_pengajuan_siswa_manual d
          INNER JOIN pengajuan_pkl p ON p.id = d.pengajuan_id
          WHERE p.lowongan_id = ${lowonganId}
            AND p.status IN ('MENUNGGU', 'DISETUJUI')
        )::int
        AS total
    `;

    const pesertaTerpakai = Number(quotaRows[0]?.total || 0);

    if (pesertaTerpakai + students.length > kuota) {
      return NextResponse.json(
        {
          message: `Kuota tidak mencukupi. Kuota ${kuota} siswa, sudah terpakai ${pesertaTerpakai} siswa.`,
        },
        { status: 400 }
      );
    }

    // Simpan file surat.
    const uploadDirectory = path.join(
      process.cwd(),
      "public",
      "uploads",
      "surat-pengajuan"
    );

    await mkdir(uploadDirectory, { recursive: true });

    const fileName = `${randomUUID()}.pdf`;
    uploadedFilePath = path.join(uploadDirectory, fileName);

    await writeFile(uploadedFilePath, fileBuffer);

    const fileUrl = `/uploads/surat-pengajuan/${fileName}`;

    const tanggalMulai = `${bulanMulai}-01`;
    const tanggalSelesai = `${bulanSelesai}-01`;

    // Satu pernyataan SQL untuk menyimpan pengajuan,
    // data induk siswa, dan relasi peserta.
    const result = await sql`
      WITH input_students AS (
        SELECT *
        FROM jsonb_to_recordset(${JSON.stringify(students)}::jsonb)
        AS x(
          "fullName" text,
          email text,
          nisn text,
          "className" text,
          major text
        )
      ),
      saved_students AS (
        INSERT INTO school_students (
          school_id,
          full_name,
          nisn,
          email,
          class_name,
          major
        )
        SELECT
          ${user.schoolId},
          "fullName",
          nisn,
          email,
          "className",
          major
        FROM input_students
        ON CONFLICT (school_id, nisn)
        DO UPDATE SET
          full_name = EXCLUDED.full_name,
          email = EXCLUDED.email,
          class_name = EXCLUDED.class_name,
          major = EXCLUDED.major,
          updated_at = NOW()
        RETURNING id
      ),
      new_application AS (
        INSERT INTO pengajuan_pkl (
          lowongan_id,
          school_id,
          diajukan_oleh,
          tanggal_mulai,
          tanggal_selesai,
          nama_guru_pembimbing,
          surat_pengajuan_url,
          surat_pengajuan_nama,
          pesan,
          status
        )
        VALUES (
          ${lowonganId},
          ${user.schoolId},
          ${user.id},
          ${tanggalMulai},
          ${tanggalSelesai},
          ${namaGuru},
          ${fileUrl},
          ${surat.name.slice(0, 255)},
          ${pesan || null},
          'MENUNGGU'
        )
        RETURNING id
      ),
      inserted_details AS (
        INSERT INTO detail_pengajuan_siswa_manual (
          pengajuan_id,
          student_id
        )
        SELECT
          new_application.id,
          saved_students.id
        FROM new_application
        CROSS JOIN saved_students
        RETURNING pengajuan_id
      )
      SELECT
        COUNT(*)::int AS total,
        MAX(pengajuan_id) AS pengajuan_id
      FROM inserted_details
    `;

    if (!result[0] || Number(result[0].total) !== students.length) {
      throw new Error("Data peserta pengajuan tidak berhasil disimpan.");
    }

    uploadedFilePath = "";

    return NextResponse.json(
      {
        message: `Pengajuan berhasil dikirim untuk ${students.length} siswa. Surat pengajuan berhasil diunggah.`,
        pengajuanId: Number(result[0].pengajuan_id),
      },
      { status: 201 }
    );
  } catch (error) {
    if (uploadedFilePath) {
      try {
        await unlink(uploadedFilePath);
      } catch {
        // Abaikan jika file tidak ditemukan.
      }
    }

    console.error("SIMPAN PENGAJUAN PKL ERROR:", error);

    return NextResponse.json(
      { message: "Terjadi kesalahan saat menyimpan pengajuan PKL." },
      { status: 500 }
    );
  }
}
