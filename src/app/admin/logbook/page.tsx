import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { sql } from "@/lib/db";
import ValidasiButton from "./ValidasiButton";

export const dynamic = "force-dynamic";

type Logbook = {
  id: number;
  tanggal: string;
  kegiatan: string;
  hasil: string | null;
  kendala: string | null;
  created_at: string;
  full_name: string;
  nisn: string | null;
  class_name: string | null;
  major: string | null;
  school_name: string | null;
  status_validasi: string | null;
  validated_at: string | null;
};

function formatTanggal(value: string) {
  const date = new Date(value);

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
}

function formatWaktu(value: string) {
  return new Date(value).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
}

export default async function AdminLogbookPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    tanggal?: string;
    status?: string;
  }>;
}) {
  const user = await requireRole("admin");

  if (!user) redirect("/login");

  const params = await searchParams;

  const q = (params.q || "").trim();
  const tanggal = (params.tanggal || "").trim();
  const status = (params.status || "").trim();

  let logbooks: Logbook[] = [];
  let errorMessage = "";

  try {
    const result = await sql`
      SELECT
        lp.id,
        lp.tanggal,
        lp.kegiatan,
        lp.hasil,
        lp.kendala,
        lp.created_at,
        lp.status_validasi,
        lp.validated_at,
        u.full_name,
        sp.nisn,
        sp.class_name,
        sp.major,
        s.school_name
      FROM laporan_pkl lp
      JOIN users u
        ON u.id = lp.student_user_id
      LEFT JOIN student_profiles sp
        ON sp.user_id = u.id
      LEFT JOIN schools s
        ON s.id = u.school_id
      WHERE
        (
          ${q} = ''
          OR u.full_name ILIKE ${"%" + q + "%"}
          OR COALESCE(s.school_name, '') ILIKE ${"%" + q + "%"}
          OR lp.kegiatan ILIKE ${"%" + q + "%"}
        )
        AND (
          ${tanggal} = ''
          OR lp.tanggal::text = ${tanggal}
        )
        AND (
          ${status} = ''
          OR COALESCE(lp.status_validasi, 'BELUM') = ${status}
        )
      ORDER BY lp.tanggal DESC, lp.created_at DESC
    `;

    logbooks = result as Logbook[];
  } catch (error) {
    console.error("Gagal mengambil logbook siswa:", error);
    errorMessage =
      "Data logbook gagal dimuat. Periksa koneksi database dan struktur tabel.";
  }

  const totalLogbook = logbooks.length;

  const totalSiswa = new Set(
    logbooks.map((item) => item.full_name)
  ).size;

  const totalKendala = logbooks.filter(
    (item) => item.kendala && item.kendala.trim() !== ""
  ).length;

  const totalTervalidasi = logbooks.filter(
    (item) => item.status_validasi === "TERVALIDASI"
  ).length;

  const totalBelumValidasi = totalLogbook - totalTervalidasi;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto max-w-7xl space-y-7">

        {/* KOTAK HEADER (navy) */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0A1F44] via-[#0F2A5F] to-[#1A4A8C] p-6 text-white shadow-xl shadow-blue-900/20 md:p-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl"
          />

          <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-cyan-300">
                <span className="h-2 w-2 rounded-full bg-cyan-400" />
                STRIDE ADMINISTRATOR
              </p>

              <h1 className="mt-3 text-3xl font-extrabold md:text-4xl">
                Logbook Siswa
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100/80">
                Monitoring dan validasi laporan kegiatan harian peserta PKL.
              </p>

              <nav
                aria-label="Breadcrumb"
                className="mt-4 flex items-center gap-2 text-xs text-blue-100/70"
              >
                <Link href="/admin" className="transition hover:text-white">
                  Dashboard
                </Link>
                <span>/</span>
                <span className="font-semibold text-cyan-300">
                  Logbook Siswa
                </span>
              </nav>
            </div>

            <div className="shrink-0 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-blue-50 backdrop-blur">
              <span className="mr-2 text-lg">📖</span>
              {totalLogbook} laporan
            </div>
          </div>
        </div>

        {/* ERROR */}
        {errorMessage && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {/* STATISTIK */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Logbook
                </p>
                <h2 className="mt-2 text-3xl font-extrabold text-slate-800">
                  {totalLogbook}
                </h2>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl">
                📚
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-400">
              Jumlah laporan sesuai filter
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Siswa Melapor
                </p>
                <h2 className="mt-2 text-3xl font-extrabold text-slate-800">
                  {totalSiswa}
                </h2>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-50 text-2xl">
                👨‍🎓
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-400">
              Siswa yang memiliki laporan
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Belum Divalidasi
                </p>
                <h2 className="mt-2 text-3xl font-extrabold text-orange-600">
                  {totalBelumValidasi}
                </h2>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-2xl">
                ⏳
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-400">
              Menunggu pemeriksaan admin
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Tervalidasi
                </p>
                <h2 className="mt-2 text-3xl font-extrabold text-emerald-600">
                  {totalTervalidasi}
                </h2>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-2xl">
                ✓
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-400">
              Laporan sudah diperiksa
            </p>
          </div>
        </div>

        {/* FILTER */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="font-bold text-slate-800">
              Pencarian Logbook
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Cari berdasarkan nama siswa, sekolah, kegiatan, atau status validasi.
            </p>
          </div>

          <form
            action="/admin/logbook"
            method="GET"
            className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px_190px_auto_auto]"
          >
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Cari nama siswa, sekolah, kegiatan..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />

            <input
              type="date"
              name="tanggal"
              defaultValue={tanggal}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />

            <select
              name="status"
              defaultValue={status}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Semua Status</option>
              <option value="BELUM">Belum Divalidasi</option>
              <option value="TERVALIDASI">Tervalidasi</option>
            </select>

            <button
              type="submit"
              className="rounded-xl bg-blue-700 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-800"
            >
              🔍 Cari Data
            </button>

            <Link
              href="/admin/logbook"
              className="rounded-xl border border-slate-200 px-6 py-3 text-center text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Reset
            </Link>
          </form>
        </div>

        {/* TABEL LOGBOOK */}
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">

          <div className="flex flex-col justify-between gap-2 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-bold text-slate-800">
                Daftar Laporan Kegiatan Siswa
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Periksa laporan siswa dan lakukan validasi setelah laporan sesuai.
              </p>
            </div>

            <span className="w-fit rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
              {totalLogbook} Laporan
            </span>
          </div>

          {logbooks.length === 0 ? (
            <div className="px-6 py-20 text-center">
              <div className="mb-4 text-5xl">📭</div>
              <h3 className="font-bold text-slate-700">
                Belum Ada Logbook Siswa
              </h3>
              <p className="mt-2 text-sm text-slate-400">
                Laporan kegiatan siswa akan muncul di halaman ini setelah dikirim.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1250px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-4">No.</th>
                    <th className="px-5 py-4">Siswa</th>
                    <th className="px-5 py-4">Sekolah</th>
                    <th className="px-5 py-4">Tanggal</th>
                    <th className="px-5 py-4">Kegiatan</th>
                    <th className="px-5 py-4">Hasil</th>
                    <th className="px-5 py-4">Kendala</th>
                    <th className="px-5 py-4">Validasi</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {logbooks.map((item, index) => (
                    <tr
                      key={item.id}
                      className="transition hover:bg-blue-50/40"
                    >
                      <td className="px-5 py-5 text-slate-400">
                        {index + 1}
                      </td>

                      <td className="px-5 py-5">
                        <p className="font-bold text-slate-800">
                          {item.full_name}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          NISN: {item.nisn || "-"}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {item.class_name || "-"} · {item.major || "-"}
                        </p>
                      </td>

                      <td className="px-5 py-5">
                        <span className="font-medium text-slate-700">
                          {item.school_name || "-"}
                        </span>
                      </td>

                      <td className="px-5 py-5 whitespace-nowrap text-slate-600">
                        {formatTanggal(item.tanggal)}
                      </td>

                      <td className="max-w-[240px] px-5 py-5">
                        <p className="line-clamp-3 leading-6 text-slate-700">
                          {item.kegiatan}
                        </p>
                      </td>

                      <td className="max-w-[200px] px-5 py-5">
                        <p className="line-clamp-3 leading-6 text-slate-600">
                          {item.hasil || "-"}
                        </p>
                      </td>

                      <td className="max-w-[200px] px-5 py-5">
                        {item.kendala ? (
                          <p className="line-clamp-3 leading-6 text-orange-600">
                            {item.kendala}
                          </p>
                        ) : (
                          <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                            Tidak ada
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-5">
                        <div className="space-y-2">
                          <ValidasiButton
                            id={item.id}
                            status={item.status_validasi}
                          />

                          {item.validated_at && (
                            <p className="whitespace-nowrap text-[11px] text-slate-400">
                              Divalidasi:
                              <br />
                              {formatWaktu(item.validated_at)}
                            </p>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="text-center text-xs text-slate-400">
          STRIDE — Sistem Informasi Praktik Kerja Lapangan
        </div>
      </div>
    </main>
  );
}