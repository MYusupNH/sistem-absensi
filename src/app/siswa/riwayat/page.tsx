"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type Report = {
  id: number;
  tanggal: string;
  kegiatan: string;
  hasil: string | null;
  kendala: string | null;
  created_at: string;
};

function formatDate(value: string) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function RiwayatLaporanPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/siswa/aktivitas", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Gagal mengambil riwayat laporan.");
      }

      setReports(data.reports || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat mengambil riwayat."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const filteredReports = useMemo(() => {
    const search = keyword.toLowerCase().trim();

    return reports
      .filter((report) => {
        if (!search) return true;

        return (
          report.kegiatan?.toLowerCase().includes(search) ||
          report.hasil?.toLowerCase().includes(search) ||
          report.kendala?.toLowerCase().includes(search)
        );
      })
      .sort(
        (a, b) =>
          new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
      );
  }, [reports, keyword]);

  return (
    <div className="min-h-screen bg-[#f4f7fb]">
      {/* HEADER */}
      <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-xl sm:px-7">
        <div>
          <h1 className="text-sm font-black text-slate-900">
            Riwayat Laporan
          </h1>
          <p className="text-[11px] text-slate-400">
            Daftar laporan kegiatan PKL yang telah dikirim
          </p>
        </div>

        <button
          type="button"
          onClick={loadReports}
          disabled={loading}
          className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
        >
          ↻ Refresh
        </button>
      </header>

      <main className="mx-auto max-w-[1100px] space-y-6 p-4 sm:p-7">
        {/* KOTAK HEADER (navy) */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0A1F44] via-[#0F2A5F] to-[#1A4A8C] p-6 text-white shadow-xl shadow-blue-900/20 sm:p-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl"
          />

          <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-cyan-300">
                <span className="h-2 w-2 rounded-full bg-cyan-400" />
                STRIDE SISWA
              </p>

              <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">
                Riwayat Laporan PKL
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100/80">
                Lihat kembali seluruh laporan kegiatan yang telah kamu kirim
                selama menjalani Praktik Kerja Lapangan.
              </p>

              <nav
                aria-label="Breadcrumb"
                className="mt-4 flex items-center gap-2 text-xs text-blue-100/70"
              >
                <Link href="/siswa" className="transition hover:text-white">
                  Dashboard
                </Link>
                <span>/</span>
                <span className="font-semibold text-cyan-300">
                  Riwayat Laporan
                </span>
              </nav>
            </div>

            <Link
              href="/siswa/laporan"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-[#0A1F44] shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:bg-cyan-300"
            >
              <span className="text-lg leading-none">+</span>
              Buat Laporan
            </Link>
          </div>
        </section>

        {/* STATISTIK */}
        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold text-slate-400">
              TOTAL LAPORAN
            </p>
            <p className="mt-2 text-3xl font-black text-slate-900">
              {loading ? "..." : reports.length}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Laporan kegiatan tersimpan
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold text-slate-400">
              HASIL PENCARIAN
            </p>
            <p className="mt-2 text-3xl font-black text-blue-700">
              {loading ? "..." : filteredReports.length}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Laporan sesuai kata kunci
            </p>
          </div>
        </section>

        {/* PENCARIAN */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <label
            htmlFor="search-report"
            className="mb-2 block text-sm font-bold text-slate-700"
          >
            Cari Laporan
          </label>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id="search-report"
              type="search"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Cari berdasarkan kegiatan, hasil, atau kendala..."
              className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />

            <Link
              href="/siswa/laporan"
              className="rounded-xl bg-blue-700 px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-blue-800"
            >
              + Buat Laporan
            </Link>
          </div>
        </section>

        {/* ERROR */}
        {error && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            <span>{error}</span>
            <button
              type="button"
              onClick={loadReports}
              className="font-bold underline"
            >
              Coba lagi
            </button>
          </div>
        )}

        {/* DAFTAR LAPORAN */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-black text-slate-900">
              Daftar Laporan
            </h3>
            <span className="text-xs text-slate-400">
              {filteredReports.length} laporan
            </span>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              Memuat riwayat laporan...
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-3xl">
                📋
              </div>

              <h3 className="mt-5 font-black text-slate-900">
                {keyword
                  ? "Laporan Tidak Ditemukan"
                  : "Belum Ada Laporan"}
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                {keyword
                  ? "Tidak ada laporan yang cocok dengan kata kunci pencarian."
                  : "Kamu belum mengirim laporan kegiatan PKL. Silakan buat laporan pertamamu."}
              </p>

              {!keyword && (
                <Link
                  href="/siswa/laporan"
                  className="mt-5 inline-flex rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white hover:bg-blue-800"
                >
                  Buat Laporan
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReports.map((report, index) => (
                <article
                  key={report.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
                >
                  <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black text-blue-700">
                          LAPORAN #{index + 1}
                        </span>

                        <span className="text-xs font-semibold text-slate-400">
                          {formatDate(report.tanggal)}
                        </span>
                      </div>

                      <h4 className="mt-4 text-base font-black text-slate-900">
                        Kegiatan
                      </h4>

                      <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                        {report.kegiatan}
                      </p>

                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <div className="rounded-xl bg-emerald-50 p-4">
                          <p className="text-[10px] font-black tracking-wider text-emerald-700">
                            HASIL KEGIATAN
                          </p>
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                            {report.hasil || "Tidak ada hasil yang dicatat."}
                          </p>
                        </div>

                        <div className="rounded-xl bg-amber-50 p-4">
                          <p className="text-[10px] font-black tracking-wider text-amber-700">
                            KENDALA
                          </p>
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                            {report.kendala || "Tidak ada kendala yang dicatat."}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setSelectedReport(
                            selectedReport?.id === report.id ? null : report
                          )
                        }
                        className="mt-4 text-xs font-bold text-blue-700 hover:underline"
                      >
                        {selectedReport?.id === report.id
                          ? "Tutup detail"
                          : "Lihat detail"}
                      </button>

                      {selectedReport?.id === report.id && (
                        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
                          <p>
                            ID Laporan:{" "}
                            <span className="font-bold text-slate-700">
                              {report.id}
                            </span>
                          </p>
                          <p className="mt-1">
                            Waktu dibuat:{" "}
                            <span className="font-bold text-slate-700">
                              {formatDate(report.created_at)}
                            </span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} STRIDE — Sistem Informasi PKL
        </footer>
      </main>
    </div>
  );
}