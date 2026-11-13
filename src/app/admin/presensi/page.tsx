import { redirect } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { sql } from "@/lib/db";
import PresensiTable from "./PresensiTable";

export const dynamic = "force-dynamic";

type Presensi = {
  id: number;
  full_name: string | null;
  class_name: string | null;
  major: string | null;
  tanggal: string | Date;
  jam_masuk: string | null;
  jam_keluar: string | null;
  latitude: number | null;
  longitude: number | null;
  jarak_meter: number | null;
  selfie_data: string | null;
};

export default async function PresensiAdminPage() {
  const user = await requireRole("admin");

  if (!user) redirect("/login");

const data = (await sql`
  SELECT
    a.id,
    u.full_name,
    sp.class_name,
    sp.major,
    a.tanggal,
    a.jam_masuk,
    a.jam_keluar,
    a.latitude,
    a.longitude,
    a.jarak_meter,
    a.selfie_data
  FROM absensi_pkl a
  LEFT JOIN users u
    ON u.id = a.student_user_id
  LEFT JOIN student_profiles sp
    ON sp.user_id = u.id
  ORDER BY a.tanggal DESC, a.jam_masuk DESC NULLS LAST
`) as Presensi[];

  const totalPresensi = data.length;
  const sudahMasuk = data.filter((item) => item.jam_masuk).length;
  const sudahPulang = data.filter((item) => item.jam_keluar).length;
  const belumPulang = data.filter(
    (item) => item.jam_masuk && !item.jam_keluar
  ).length;

  return (
    <main className="min-h-screen bg-[#f4f7fc] p-5 md:p-8">
      <div className="mx-auto max-w-7xl space-y-7">

        {/* KOTAK HEADER (navy) */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0A1F44] via-[#0F2A5F] to-[#1A4A8C] p-6 text-white shadow-xl shadow-blue-900/20 md:p-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl"
          />

          <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-cyan-300">
                <span className="h-2 w-2 rounded-full bg-cyan-400" />
                STRIDE ADMINISTRATOR
              </p>

              <h1 className="mt-3 text-3xl font-extrabold md:text-4xl">
                Presensi Siswa
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100/80">
                Pantau aktivitas kehadiran dan kepulangan siswa selama
                melaksanakan Praktik Kerja Lapangan.
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
                  Presensi Siswa
                </span>
              </nav>
            </div>

            <div className="shrink-0 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-blue-50 backdrop-blur">
              <span className="mr-2 text-lg">📋</span>
              {totalPresensi.toLocaleString("id-ID")} catatan presensi
            </div>
          </div>
        </div>

        {/* STATISTIK */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          {/* TOTAL */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Presensi</p>
                <p className="mt-3 text-3xl font-extrabold text-slate-800">
                  {totalPresensi.toLocaleString("id-ID")}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Seluruh catatan presensi
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl">
                📋
              </div>
            </div>
          </div>

          {/* SUDAH MASUK */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Sudah Absen Masuk</p>
                <p className="mt-3 text-3xl font-extrabold text-blue-600">
                  {sudahMasuk.toLocaleString("id-ID")}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Memiliki jam masuk
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl">
                🕘
              </div>
            </div>
          </div>

          {/* SUDAH PULANG */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Sudah Absen Pulang</p>
                <p className="mt-3 text-3xl font-extrabold text-emerald-600">
                  {sudahPulang.toLocaleString("id-ID")}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Memiliki jam keluar
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-2xl">
                🕔
              </div>
            </div>
          </div>

          {/* BELUM PULANG */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Belum Absen Pulang</p>
                <p className="mt-3 text-3xl font-extrabold text-amber-500">
                  {belumPulang.toLocaleString("id-ID")}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Sudah masuk, belum keluar
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-2xl">
                ⏳
              </div>
            </div>
          </div>

        </div>

        {/* TABEL PRESENSI */}
        <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">

          <div className="flex flex-col gap-2 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Riwayat Presensi Siswa
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Informasi waktu masuk dan pulang siswa yang tercatat di sistem.
              </p>
            </div>

            <span className="w-fit rounded-full bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700">
              {totalPresensi} Data
            </span>
          </div>

          {/* KOMPONEN TABEL + HAPUS */}
          <PresensiTable data={data} />

        </section>

      </div>
    </main>
  );
}