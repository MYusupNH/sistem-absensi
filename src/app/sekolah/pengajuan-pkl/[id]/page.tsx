import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { sql } from "@/lib/db";
import PengajuanForm from "./PengajuanForm";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

type Student = {
  id: number;
  fullName: string;
  email: string;
  nisn: string;
  className: string;
  major: string;
};

export default async function DetailPengajuanPage({ params }: Props) {
  const user = await requireRole("school");

  if (!user) redirect("/login");

  const { id } = await params;
  const lowonganId = Number(id);

  if (!Number.isInteger(lowonganId) || lowonganId <= 0) {
    notFound();
  }

  const lowonganData = await sql`
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
      status
    FROM lowongan_pkl
    WHERE id = ${lowonganId}
    LIMIT 1
  `;

  if (lowonganData.length === 0) {
    notFound();
  }

  const lowongan = lowonganData[0];

  if (lowongan.status !== "DIBUKA") {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-3xl rounded-2xl border border-amber-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-extrabold text-slate-900">
            Lowongan Tidak Tersedia
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Lowongan PKL ini sudah ditutup dan tidak menerima pengajuan baru.
          </p>

          <Link
            href="/sekolah/pengajuan-pkl"
            className="mt-5 inline-block rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white"
          >
            Kembali ke Lowongan
          </Link>
        </div>
      </main>
    );
  }

  const studentData = await sql`
    SELECT
      u.id,
      u.full_name,
      u.email,
      COALESCE(sp.nisn, '-') AS nisn,
      COALESCE(sp.class_name, '-') AS class_name,
      COALESCE(sp.major, '-') AS major
    FROM users u
    LEFT JOIN student_profiles sp ON sp.user_id = u.id
    WHERE
      u.school_id = ${user.schoolId}
      AND u.role = 'student'
      AND u.is_active = true
    ORDER BY u.full_name ASC
  `;

  const students: Student[] = studentData.map((student) => ({
    id: Number(student.id),
    fullName: student.full_name,
    email: student.email,
    nisn: student.nisn,
    className: student.class_name,
    major: student.major,
  }));

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/sekolah/pengajuan-pkl"
          className="inline-flex items-center gap-2 text-sm font-bold text-blue-700 hover:text-cyan-600"
        >
          ← Kembali ke Daftar Lowongan
        </Link>

        <div className="mt-5 overflow-hidden rounded-3xl bg-gradient-to-r from-[#07152f] via-blue-900 to-cyan-700 p-7 text-white shadow-xl">
          <p className="text-xs font-bold tracking-[0.2em] text-cyan-200">
            FORMULIR PENGAJUAN PKL
          </p>

          <h1 className="mt-3 text-2xl font-extrabold sm:text-3xl">
            {lowongan.judul}
          </h1>

          <p className="mt-2 text-blue-100">
            {lowongan.nama_instansi}
          </p>

          <div className="mt-5 flex flex-wrap gap-3 text-sm">
            <span className="rounded-full bg-white/10 px-4 py-2">
              📍 {lowongan.lokasi || "Lokasi belum tersedia"}
            </span>

            <span className="rounded-full bg-white/10 px-4 py-2">
              👥 Kuota {lowongan.kuota} siswa
            </span>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-extrabold text-slate-900">
            Informasi Lowongan
          </h2>

          <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">
            {lowongan.deskripsi || "Tidak ada deskripsi."}
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Jurusan</p>
              <p className="mt-1 font-bold text-slate-800">
                {lowongan.jurusan || "Semua jurusan"}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Kuota</p>
              <p className="mt-1 font-bold text-slate-800">
                {lowongan.kuota} peserta
              </p>
            </div>
          </div>

          {lowongan.persyaratan && (
            <div className="mt-5">
              <h3 className="font-bold text-slate-800">Persyaratan</h3>
              <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-600">
                {lowongan.persyaratan}
              </p>
            </div>
          )}
        </div>

        <div className="mt-6">
          <PengajuanForm
            lowonganId={lowonganId}
            kuota={Number(lowongan.kuota)}
            students={students}
          />
        </div>
      </div>
    </main>
  );
}