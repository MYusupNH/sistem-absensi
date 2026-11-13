import Link from "next/link";
import { sql } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import BuatAkunSiswaButton from "./BuatAkunSiswaButton";

export const dynamic = "force-dynamic";

type StudentRow = {
  id: number;
  full_name: string;
  nisn: string;
  email: string;
  class_name: string;
  major: string;
  nama_instansi: string | null;
  judul_lowongan: string | null;
  account_exists: boolean;
};

export default async function DataSiswaPage() {
  const user = await requireRole("school");

  if (!user?.schoolId) {
    return (
      <main className="p-6">
        <p className="text-red-600">
          Akun sekolah tidak memiliki data sekolah.
        </p>
      </main>
    );
  }

  const students = await sql`
    SELECT
      s.id,
      s.full_name,
      s.nisn,
      s.email,
      s.class_name,
      s.major,
      latest.nama_instansi,
      latest.judul_lowongan,
      EXISTS (
        SELECT 1
        FROM student_profiles sp
        INNER JOIN users u ON u.id = sp.user_id
        WHERE sp.nisn = s.nisn
          AND u.school_id = s.school_id
          AND u.role = 'student'
          AND u.is_active = TRUE
      ) AS account_exists
    FROM school_students s
    LEFT JOIN LATERAL (
      SELECT
        l.nama_instansi,
        l.judul AS judul_lowongan
      FROM detail_pengajuan_siswa_manual d
      INNER JOIN pengajuan_pkl p ON p.id = d.pengajuan_id
      INNER JOIN lowongan_pkl l ON l.id = p.lowongan_id
      WHERE d.student_id = s.id
      ORDER BY p.created_at DESC, p.id DESC
      LIMIT 1
    ) latest ON true
    WHERE s.school_id = ${user.schoolId}
    ORDER BY s.created_at DESC
  ` as StudentRow[];

  return (
    <main className="min-h-screen bg-slate-50 p-5 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0b1f4d] via-[#0f2f6b] to-[#16478a] p-7 shadow-xl shadow-blue-900/20 md:p-8">

          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">

            <div>
              <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-300">
                <span className="h-2 w-2 rounded-full bg-cyan-400" />
                PORTAL GURU & SEKOLAH
              </p>

              <h1 className="mt-3 text-3xl font-black text-white md:text-4xl">
                Data Siswa PKL
              </h1>

              <p className="mt-2 text-sm text-blue-100/80">
                Daftar seluruh siswa yang pernah diajukan oleh sekolah.
              </p>

              {/* Breadcrumb */}
              <nav className="mt-5 flex items-center gap-2 text-xs text-blue-100/70">
                <Link href="/sekolah" className="hover:text-white">
                  Dashboard
                </Link>
                <span>/</span>
                <span className="font-bold text-cyan-300">
                  Data Siswa
                </span>
              </nav>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Badge jumlah */}
              <div className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur">
                <span>👥</span>
                {students.length} siswa
              </div>

              <Link
                href="/sekolah/pengajuan-pkl"
                className="rounded-xl bg-white px-5 py-3 text-center text-sm font-bold text-blue-800 transition hover:bg-blue-50"
              >
                + Buat Pengajuan
              </Link>
            </div>

          </div>
        </div>

        {/* Statistik */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Total Siswa Terdaftar
            </p>

            <p className="mt-2 text-3xl font-extrabold text-slate-900">
              {students.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Data Siswa
            </p>

            <p className="mt-2 text-sm font-semibold text-emerald-600">
              Tersimpan dalam database sekolah
            </p>
          </div>
        </div>

        {/* Tabel Data Siswa */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-100 p-5">
            <h2 className="font-extrabold text-slate-900">
              Daftar Siswa
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Setiap siswa ditampilkan satu kali berdasarkan NISN dalam sekolah ini.
            </p>
          </div>

          {students.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="text-4xl">♟</div>

              <h3 className="mt-4 font-bold text-slate-800">
                Belum Ada Data Siswa
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Siswa akan otomatis muncul setelah sekolah mengirim pengajuan PKL.
              </p>

              <Link
                href="/sekolah/pengajuan-pkl"
                className="mt-5 inline-block rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white"
              >
                Ajukan Siswa PKL
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-4">No.</th>
                    <th className="px-5 py-4">Identitas Siswa</th>
                    <th className="px-5 py-4">Kelas / Jurusan</th>
                    <th className="px-5 py-4">Instansi Tujuan</th>
                    <th className="px-5 py-4">Akun Siswa</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {students.map((student, index) => (
                    <tr
                      key={student.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4 text-slate-500">
                        {index + 1}
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-800">
                          {student.full_name}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          NISN: {student.nisn}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {student.email}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-800">
                          {student.class_name}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {student.major}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-800">
                          {student.nama_instansi || "-"}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {student.judul_lowongan || "Belum ada pengajuan"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <BuatAkunSiswaButton
                          studentId={Number(student.id)}
                          accountExists={student.account_exists}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="border-t border-slate-100 px-5 py-4 text-xs text-slate-500">
            Menampilkan {students.length} siswa.
          </div>
        </div>
      </div>
    </main>
  );
}