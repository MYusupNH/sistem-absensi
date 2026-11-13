
import { requireRole } from "@/lib/auth";
import { sql } from "@/lib/db";
import PrintButton from "./PrintButton";
import ReviewActions from "./ReviewActions";

export const dynamic = "force-dynamic";

type Report = {
  id: number;
  laporan_id: number | null;
  full_name: string;
  school_name: string | null;
  nisn: string | null;
  class_name: string | null;
  major: string | null;
  status: string;
  original_filename: string | null;
  file_url: string | null;
  version_number: number | null;
  uploaded_at: string | Date | null;
};

const statusLabel: Record<string, string> = {
  BELUM_UPLOAD: "Belum Upload",
  MENUNGGU_PEMERIKSAAN: "Menunggu Pemeriksaan",
  REVISI: "Perlu Revisi",
  DISETUJUI: "Disetujui",
};

export default async function AdminReportPage() {
  const user = await requireRole("admin");

  if (!user) {
    return (
      <main className="p-8 text-center">
        Akses ditolak.
      </main>
    );
  }

  const rows = (await sql`
    SELECT
      u.id,
      l.id AS laporan_id,
      u.full_name,
      s.school_name,
      sp.nisn,
      sp.class_name,
      sp.major,

      COALESCE(l.status, 'BELUM_UPLOAD') AS status,

      r.original_filename,
      r.file_url,
      r.version_number,
      r.uploaded_at

    FROM users u

    LEFT JOIN student_profiles sp
      ON sp.user_id = u.id

    LEFT JOIN schools s
      ON s.id = u.school_id

    LEFT JOIN laporan_akhir_pkl l
      ON l.student_user_id = u.id

    LEFT JOIN laporan_akhir_riwayat r
      ON r.id = l.current_file_id

    WHERE u.role = 'student'
      AND u.is_active = true

    ORDER BY
      s.school_name ASC,
      u.full_name ASC
  `) as Report[];

  const totalSiswa = rows.length;

  const totalUpload = rows.filter(
    (item) => item.status !== "BELUM_UPLOAD"
  ).length;

  const menunggu = rows.filter(
    (item) => item.status === "MENUNGGU_PEMERIKSAAN"
  ).length;

  const revisi = rows.filter(
    (item) => item.status === "REVISI"
  ).length;

  const disetujui = rows.filter(
    (item) => item.status === "DISETUJUI"
  ).length;

  const totalSekolah = new Set(
    rows.map((item) => item.school_name).filter(Boolean)
  ).size;

  return (
    <main className="min-h-screen bg-[#f4f7fc] p-5 text-slate-800 md:p-8">
      <div className="mx-auto max-w-7xl space-y-7">

        {/* HEADER */}
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-blue-600">
              MANAJEMEN LAPORAN AKHIR
            </p>

            <h1 className="mt-2 text-3xl font-extrabold">
              Laporan Akhir PKL
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Pemantauan pengumpulan dan pemeriksaan dokumen laporan akhir PKL seluruh siswa.
            </p>
          </div>

          <PrintButton />
        </header>

        {/* STATISTIK */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">

          <StatCard
            title="Total Siswa"
            value={totalSiswa}
            color="text-slate-800"
          />

          <StatCard
            title="Sudah Upload"
            value={totalUpload}
            color="text-blue-600"
          />

          <StatCard
            title="Menunggu Pemeriksaan"
            value={menunggu}
            color="text-amber-600"
          />

          <StatCard
            title="Perlu Revisi"
            value={revisi}
            color="text-rose-600"
          />

          <StatCard
            title="Disetujui"
            value={disetujui}
            color="text-emerald-600"
          />

        </section>

        {/* TABEL LAPORAN */}
        <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">

          <div className="flex flex-col justify-between gap-2 border-b border-slate-100 p-6 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold">
                Rekapitulasi Laporan Akhir Siswa
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {totalSiswa} siswa dari {totalSekolah} sekolah.
              </p>
            </div>
          </div>

          {rows.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-400">
              Belum ada data siswa.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1250px] text-left text-sm">

                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-4">No.</th>
                    <th className="px-5 py-4">Nama Siswa</th>
                    <th className="px-5 py-4">Sekolah</th>
                    <th className="px-5 py-4">NISN</th>
                    <th className="px-5 py-4">Kelas</th>
                    <th className="px-5 py-4">Dokumen PDF</th>
                    <th className="px-5 py-4">Versi</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Tanggal Upload</th>
                    <th className="px-5 py-4">Aksi Pemeriksaan</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {rows.map((item, index) => (
                    <tr
                      key={item.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4 text-slate-500">
                        {index + 1}
                      </td>

                      <td className="px-5 py-4 font-semibold">
                        {item.full_name}
                      </td>

                      <td className="px-5 py-4">
                        {item.school_name || "-"}
                      </td>

                      <td className="px-5 py-4">
                        {item.nisn || "-"}
                      </td>

                      <td className="px-5 py-4">
                        {item.class_name || "-"}
                      </td>

                      {/* DOWNLOAD PDF */}
                      <td className="px-5 py-4">
                        {item.file_url && item.laporan_id ? (
                          <a
                            href={`/api/admin/laporan-akhir/${item.laporan_id}/download`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-blue-600 hover:underline"
                          >
                            Lihat PDF
                          </a>
                        ) : (
                          <span className="text-slate-400">
                            Belum tersedia
                          </span>
                        )}
                      </td>

                      {/* VERSI */}
                      <td className="px-5 py-4">
                        {item.version_number
                          ? `Versi ${item.version_number}`
                          : "-"}
                      </td>

                      {/* STATUS */}
                      <td className="px-5 py-4">
                        <StatusBadge status={item.status} />
                      </td>

                      {/* TANGGAL UPLOAD */}
                      <td className="px-5 py-4 text-slate-500">
                        {item.uploaded_at
                          ? new Date(item.uploaded_at).toLocaleDateString(
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

                      {/* AKSI PEMERIKSAAN */}
                      <td className="px-5 py-4">
                        <ReviewActions
                          laporanId={item.laporan_id}
                          status={item.status}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          )}

          <div className="border-t border-slate-100 px-6 py-4 text-xs text-slate-400">
            Data laporan akhir dari seluruh sekolah yang terdaftar.
          </div>

        </section>

      </div>

      {/* PRINT STYLE */}
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
            font-size: 9px !important;
          }

          th, td {
            padding: 8px !important;
          }
        }
      `}</style>
    </main>
  );
}

/* KARTU STATISTIK */
function StatCard({
  title,
  value,
  color,
}: {
  title: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{title}</p>

      <p className={`mt-3 text-3xl font-extrabold ${color}`}>
        {value}
      </p>
    </div>
  );
}

/* BADGE STATUS */
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    BELUM_UPLOAD: "bg-slate-100 text-slate-600",
    MENUNGGU_PEMERIKSAAN: "bg-amber-100 text-amber-700",
    REVISI: "bg-rose-100 text-rose-700",
    DISETUJUI: "bg-emerald-100 text-emerald-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
        styles[status] || "bg-slate-100 text-slate-600"
      }`}
    >
      {statusLabel[status] || status}
    </span>
  );
}
