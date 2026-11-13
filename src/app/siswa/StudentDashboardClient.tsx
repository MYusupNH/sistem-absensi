
"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Attendance = {
  jam_masuk: string | null;
  jam_keluar: string | null;
};

type Report = {
  id: number;
  tanggal?: string;
};

type PklLocation = {
  id: number;
  judul: string;
  nama_instansi: string;
  lokasi: string;
  latitude: number | null;
  longitude: number | null;
  radius_absensi: number;
};

type Props = {
  fullName: string;
  email: string;
};

function formatTime(value: string | null | undefined) {
  if (!value) return "--:--";

  const match = String(value).match(/^(\d{1,2}):(\d{2})/);

  if (match) {
    return `${match[1].padStart(2, "0")}:${match[2]}`;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "--:--";

  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

export default function StudentDashboardClient({
  fullName,
}: Props) {
  const [attendance, setAttendance] = useState<Attendance | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [pklLocation, setPklLocation] = useState<PklLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    try {
      setError("");

      const response = await fetch("/api/siswa/aktivitas", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Gagal mengambil data dashboard.");
      }

      setAttendance(data.attendance || null);
      setReports(data.reports || []);
      setPklLocation(data.pklLocation || null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat mengambil data."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const firstName = fullName.split(" ")[0] || "Siswa";

  const sudahMasuk = Boolean(attendance?.jam_masuk);
  const sudahKeluar = Boolean(attendance?.jam_keluar);

  const todayLabel = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date());

  const statusHariIni = loading
    ? "Memuat..."
    : sudahKeluar
      ? "Selesai"
      : sudahMasuk
        ? "Sedang PKL"
        : "Belum Hadir";

  return (
    <div className="min-h-screen bg-[#f4f7fb]">
      {/* HEADER */}
      <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-xl sm:px-7">
        <div>
          <p className="text-sm font-black text-slate-900">
            Dashboard Siswa
          </p>
          <p className="text-[11px] text-slate-400">
            Sistem Informasi Praktik Kerja Lapangan
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-xs font-bold text-slate-800">{fullName}</p>
            <p className="text-[10px] text-slate-400">Peserta PKL</p>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-black text-blue-700">
            {firstName.charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] space-y-7 p-4 sm:p-7 lg:p-8">
        {/* ERROR */}
        {error && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
            <p>{error}</p>
            <button
              type="button"
              onClick={loadData}
              className="shrink-0 font-bold underline"
            >
              Coba lagi
            </button>
          </div>
        )}

        {/* WELCOME */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#102344] via-[#174b88] to-[#087e9f] p-6 text-white shadow-xl shadow-blue-950/10 sm:p-9">
          <div className="absolute -right-10 -top-24 h-72 w-72 rounded-full border-[35px] border-white/[0.06]" />
          <div className="absolute -bottom-32 right-52 h-64 w-64 rounded-full bg-cyan-300/10 blur-3xl" />

          <div className="relative max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-black tracking-[0.15em] text-cyan-100">
              <span className="h-2 w-2 rounded-full bg-emerald-300" />
              STUDENT PORTAL
            </span>

            <h1 className="mt-5 text-2xl font-black leading-tight sm:text-4xl">
              Selamat Datang, {firstName}!
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-7 text-blue-100">
              Selamat beraktivitas! Pantau kehadiran dan perkembangan
              kegiatan Praktik Kerja Lapangan melalui dashboard siswa STRIDE.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <span className="rounded-lg border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold">
                📅 {todayLabel}
              </span>

              <span className="rounded-lg border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold">
                🎓 Peserta Praktik Kerja Lapangan
              </span>
            </div>
          </div>
        </section>

        {/* SUMMARY */}
        <section>
          <div className="mb-5">
            <p className="text-[10px] font-black tracking-[0.2em] text-blue-600">
              RINGKASAN AKTIVITAS
            </p>
            <h2 className="mt-1 text-xl font-black text-slate-900">
              Aktivitas Hari Ini
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Informasi kehadiran dan laporan kegiatan PKL kamu.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {/* MASUK */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500">
                    Absensi Masuk
                  </p>
                  <p className="mt-4 text-2xl font-black text-slate-900">
                    {loading ? "..." : formatTime(attendance?.jam_masuk)}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-2xl text-emerald-600">
                  ↘
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-400">
                {sudahMasuk
                  ? "Absensi masuk berhasil dicatat"
                  : "Belum melakukan absensi masuk"}
              </p>
            </div>

            {/* KELUAR */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500">
                    Absensi Keluar
                  </p>
                  <p className="mt-4 text-2xl font-black text-slate-900">
                    {loading ? "..." : formatTime(attendance?.jam_keluar)}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-2xl text-blue-600">
                  ↗
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-400">
                {sudahKeluar
                  ? "Absensi keluar berhasil dicatat"
                  : "Menunggu absensi keluar"}
              </p>
            </div>

            {/* LAPORAN */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500">
                    Laporan Tersimpan
                  </p>
                  <p className="mt-4 text-2xl font-black text-slate-900">
                    {loading ? "..." : reports.length}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-2xl text-violet-600">
                  ▤
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-400">
                Total laporan kegiatan tersimpan
              </p>
            </div>

            {/* STATUS */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500">
                    Status Hari Ini
                  </p>
                  <p className="mt-4 text-xl font-black text-slate-900">
                    {statusHariIni}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-2xl text-orange-600">
                  ◷
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-400">
                Status kehadiran hari ini
              </p>
            </div>
          </div>
        </section>

        {/* LOCATION */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-cyan-50 text-2xl">
                📍
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-black tracking-[0.2em] text-blue-600">
                  INFORMASI PENEMPATAN
                </p>

                <h2 className="mt-2 text-lg font-black text-slate-900">
                  {loading
                    ? "Memuat lokasi..."
                    : pklLocation?.nama_instansi || "Belum Ada Penempatan"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {pklLocation?.judul || "Informasi tempat PKL"}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  {pklLocation?.lokasi || "Belum ada alamat lokasi PKL."}
                </p>
              </div>
            </div>

            <Link
              href="/siswa/lokasi"
              className="inline-flex shrink-0 items-center justify-center rounded-xl border border-blue-200 px-5 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-50"
            >
              Detail Lokasi →
            </Link>
          </div>
        </section>

      
        {/* FOOTER */}
        <footer className="border-t border-slate-200 py-6 text-center">
          <p className="text-xs font-semibold text-slate-400">
            © {new Date().getFullYear()} STRIDE
          </p>
          <p className="mt-1 text-[10px] text-slate-400">
            Sistem Informasi Praktik Kerja Lapangan
          </p>
        </footer>
      </div>
    </div>
  );
}
