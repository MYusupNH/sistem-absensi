
"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";

type Report = {
  id: number;
  tanggal: string;
  kegiatan: string;
  hasil: string | null;
  kendala: string | null;
  created_at: string;
};

function getToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
  }).format(new Date());
}

function formatDate(value: string) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function LaporanSiswaPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [kegiatan, setKegiatan] = useState("");
  const [hasil, setHasil] = useState("");
  const [kendala, setKendala] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/siswa/aktivitas", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Gagal mengambil laporan.");
      }

      const reportList: Report[] = data.reports || [];
      setReports(reportList);

      const todayReport = reportList.find(
        (item) => item.tanggal?.slice(0, 10) === getToday()
      );

      if (todayReport) {
        setKegiatan(todayReport.kegiatan || "");
        setHasil(todayReport.hasil || "");
        setKendala(todayReport.kendala || "");
      } else {
        setKegiatan("");
        setHasil("");
        setKendala("");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat mengambil laporan."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const todayReport = reports.find(
    (item) => item.tanggal?.slice(0, 10) === getToday()
  );

  async function submitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (kegiatan.trim().length < 5) {
      setError("Kegiatan minimal harus terdiri dari 5 karakter.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const response = await fetch("/api/siswa/aktivitas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "laporan",
          kegiatan: kegiatan.trim(),
          hasil: hasil.trim(),
          kendala: kendala.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Gagal menyimpan laporan.");
      }

      setMessage(data.message || "Laporan kegiatan berhasil disimpan.");

      await loadReports();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat menyimpan laporan."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f7fb]">
      {/* HEADER */}
      <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-xl sm:px-7">
        <div>
          <h1 className="text-sm font-black text-slate-900">
            Laporan Kegiatan
          </h1>
          <p className="text-[11px] text-slate-400">
            Catatan aktivitas harian PKL
          </p>
        </div>

        <Link
          href="/siswa"
          className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
        >
          ← Dashboard
        </Link>
      </header>

      <main className="mx-auto max-w-[1100px] space-y-6 p-4 sm:p-7">
        {/* JUDUL */}
        <section>
          <p className="text-[10px] font-black tracking-[0.2em] text-blue-600">
            JURNAL HARIAN PKL
          </p>
          <h2 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
            Laporan Kegiatan PKL
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Catat pekerjaan, hasil yang diperoleh, dan kendala yang kamu
            temui selama melaksanakan kegiatan PKL.
          </p>
        </section>

        {/* NOTIFIKASI */}
        {error && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              className="font-black"
            >
              ×
            </button>
          </div>
        )}

        {message && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
            <span>{message}</span>
            <button
              type="button"
              onClick={() => setMessage("")}
              className="font-black"
            >
              ×
            </button>
          </div>
        )}

        {/* FORM */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Form Laporan Harian
                </h3>
                <p className="mt-1 text-xs text-slate-400">
                  Isi laporan kegiatan PKL kamu.
                </p>
              </div>

              <span className="rounded-full bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">
                {new Date().toLocaleDateString("id-ID", {
                  timeZone: "Asia/Jakarta",
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-sm text-slate-500">
              Memuat data laporan...
            </div>
          ) : (
            <form onSubmit={submitReport} className="space-y-6 p-5 sm:p-6">
              {todayReport && (
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
                  Kamu sudah memiliki laporan untuk hari ini. Jika disimpan
                  kembali, hasilnya mengikuti aturan penyimpanan pada API.
                </div>
              )}

              <div>
                <label
                  htmlFor="kegiatan"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Kegiatan yang Dilakukan
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <textarea
                  id="kegiatan"
                  value={kegiatan}
                  onChange={(event) => setKegiatan(event.target.value)}
                  required
                  minLength={5}
                  maxLength={5000}
                  rows={5}
                  placeholder="Tuliskan kegiatan yang kamu lakukan hari ini..."
                  className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />

                <p className="mt-2 text-right text-xs text-slate-400">
                  {kegiatan.length}/5000 karakter
                </p>
              </div>

              <div>
                <label
                  htmlFor="hasil"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Hasil yang Diperoleh
                </label>

                <textarea
                  id="hasil"
                  value={hasil}
                  onChange={(event) => setHasil(event.target.value)}
                  maxLength={3000}
                  rows={4}
                  placeholder="Tuliskan hasil atau pengetahuan yang diperoleh..."
                  className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />

                <p className="mt-2 text-right text-xs text-slate-400">
                  {hasil.length}/3000 karakter
                </p>
              </div>

              <div>
                <label
                  htmlFor="kendala"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Kendala yang Dihadapi
                </label>

                <textarea
                  id="kendala"
                  value={kendala}
                  onChange={(event) => setKendala(event.target.value)}
                  maxLength={3000}
                  rows={4}
                  placeholder="Tuliskan kendala yang kamu alami, atau isi Tidak ada..."
                  className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />

                <p className="mt-2 text-right text-xs text-slate-400">
                  {kendala.length}/3000 karakter
                </p>
              </div>

              <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={() => {
                    setKegiatan("");
                    setHasil("");
                    setKendala("");
                    setError("");
                    setMessage("");
                  }}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Kosongkan
                </button>

                <button
                  type="submit"
                  disabled={saving || loading}
                  className="rounded-xl bg-blue-700 px-6 py-3 text-sm font-black text-white shadow-lg shadow-blue-900/10 transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Menyimpan..." : "Simpan Laporan"}
                </button>
              </div>
            </form>
          )}
        </section>

        {/* PANDUAN */}
        <section className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
          <h3 className="font-black text-blue-900">
            Panduan Pengisian Laporan
          </h3>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-blue-800">
            <li>• Isi kegiatan sesuai pekerjaan yang benar-benar dilakukan.</li>
            <li>• Jelaskan hasil pekerjaan atau hal baru yang dipelajari.</li>
            <li>• Tuliskan kendala jika ada, agar pembimbing dapat mengetahuinya.</li>
            <li>• Gunakan bahasa yang jelas dan mudah dipahami.</li>
          </ul>
        </section>

        <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} STRIDE — Sistem Informasi PKL
        </footer>
      </main>
    </div>
  );
}
