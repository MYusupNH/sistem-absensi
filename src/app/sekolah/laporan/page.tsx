import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { sql } from "@/lib/db";
import PrintButton from "./PrintButton";

export const dynamic = "force-dynamic";

type Report = {
  id: number;
  full_name: string;
  nisn: string | null;
  class_name: string | null;
  major: string | null;
  total_hadir: number;
  total_pulang: number;
  belum_pulang: number;
  terakhir_absen: string | Date | null;
};

export default async function SchoolReportPage() {
  const user = await requireRole("school");

  if (!user) redirect("/login");
  if (!user.schoolId) redirect("/sekolah");

  const rows = (await sql`
    SELECT
      u.id,
      u.full_name,
      sp.nisn,
      sp.class_name,
      sp.major,
      COUNT(a.id)::int AS total_hadir,
      COUNT(a.jam_keluar)::int AS total_pulang,
      COUNT(a.id) FILTER (
        WHERE a.jam_masuk IS NOT NULL
          AND a.jam_keluar IS NULL
      )::int AS belum_pulang,
      MAX(a.tanggal) AS terakhir_absen
    FROM users u
    LEFT JOIN student_profiles sp
      ON sp.user_id = u.id
    LEFT JOIN absensi_pkl a
      ON a.student_user_id = u.id
    WHERE u.school_id = ${user.schoolId}
      AND u.role = 'student'
      AND u.is_active = true
    GROUP BY
      u.id,
      u.full_name,
      sp.nisn,
      sp.class_name,
      sp.major
    ORDER BY u.full_name ASC
  `) as Report[];

  const totalSiswa = rows.length;

  const totalHadir = rows.reduce(
    (sum, item) => sum + Number(item.total_hadir),
    0
  );

  const totalPulang = rows.reduce(
    (sum, item) => sum + Number(item.total_pulang),
    0
  );

  const belumPulang = rows.reduce(
    (sum, item) => sum + Number(item.belum_pulang),
    0
  );

  return (
    <main className="min-h-screen bg-[#f4f7fc] p-5 text-slate-800 md:p-8">
      <div className="mx-auto max-w-7xl space-y-7">

        {/* HEADER */}
        <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0b1f4d] via-[#0f2f6b] to-[#16478a] p-7 shadow-xl shadow-blue-900/20 md:p-8 print:hidden">

          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">

            <div>
              <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-300">
                <span className="h-2 w-2 rounded-full bg-cyan-400" />
                LAPORAN PKL
              </p>

              <h1 className="mt-3 text-3xl font-black text-white md:text-4xl">
                Laporan Kehadiran Siswa
              </h1>

              <p className="mt-2 text-sm text-blue-100/80">
                Rekap aktivitas kehadiran siswa PKL dari sekolah Anda.
              </p>

              {/* Breadcrumb */}
              <nav className="mt-5 flex items-center gap-2 text-xs text-blue-100/70">
                <a href="/sekolah" className="hover:text-white">
                  Dashboard
                </a>
                <span>/</span>
                <span className="font-bold text-cyan-300">
                  Laporan Kehadiran
                </span>
              </nav>
            </div>

            {/* Badge jumlah */}
            <div className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur">
              <span>📄</span>
              {totalSiswa} siswa
            </div>

          </div>
        </header>

        {/* STATISTIK */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total Siswa</p>
            <p className="mt-3 text-3xl font-extrabold text-slate-800">
              {totalSiswa}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total Kehadiran</p>
            <p className="mt-3 text-3xl font-extrabold text-blue-600">
              {totalHadir}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Sudah Absen Pulang</p>
            <p className="mt-3 text-3xl font-extrabold text-emerald-600">
              {totalPulang}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Belum Absen Pulang</p>
            <p className="mt-3 text-3xl font-extrabold text-amber-600">
              {belumPulang}
            </p>
          </div>

        </section>

        {/* TABEL LAPORAN */}
        <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">

          <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-6 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Rekap Kehadiran Per Siswa
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Akumulasi seluruh catatan absensi yang tersimpan.
              </p>
            </div>

            <PrintButton />
          </div>

          {rows.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-400">
              Belum ada data siswa aktif.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">

                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-4">No.</th>
                    <th className="px-5 py-4">Nama Siswa</th>
                    <th className="px-5 py-4">NISN</th>
                    <th className="px-5 py-4">Kelas</th>
                    <th className="px-5 py-4">Jurusan</th>
                    <th className="px-5 py-4">Total Hadir</th>
                    <th className="px-5 py-4">Sudah Pulang</th>
                    <th className="px-5 py-4">Terakhir Absen</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {rows.map((item, index) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4 text-slate-500">
                        {index + 1}
                      </td>

                      <td className="px-5 py-4 font-semibold text-slate-800">
                        {item.full_name}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {item.nisn || "-"}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {item.class_name || "-"}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {item.major || "-"}
                      </td>

                      <td className="px-5 py-4 font-bold text-blue-600">
                        {Number(item.total_hadir)}
                      </td>

                      <td className="px-5 py-4 font-bold text-emerald-600">
                        {Number(item.total_pulang)}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {item.terakhir_absen
                          ? new Date(item.terakhir_absen).toLocaleDateString(
                              "id-ID",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                timeZone: "Asia/Jakarta",
                              }
                            )
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          )}

          <div className="border-t border-slate-100 px-6 py-4 text-xs text-slate-400">
            Total {rows.length} siswa dalam laporan sekolah Anda.
          </div>

        </section>
      </div>

      <style>{`
        @media print {
          body {
            background: white !important;
          }

          main {
            padding: 0 !important;
          }

          button {
            display: none !important;
          }

          table {
            width: 100% !important;
          }
        }
      `}</style>
    </main>
  );
}