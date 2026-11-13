"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";

type ReportFile = {
  id: number;
  version_number: number;
  original_filename: string;
  file_size: number;
  uploaded_at: string;
};

type Revision = {
  id: number;
  aksi: string;
  komentar: string | null;
  created_at: string;
};

type ReportData = {
  report: {
    id: number;
    status: string;
    submitted_at: string | null;
    current_file: ReportFile | null;
  } | null;
  history: ReportFile[];
  revisions: Revision[];
};

type ApiFile = {
  id: number | string;
  version_number: number | string;
  original_filename: string;
  file_size: number | string;
  uploaded_at: string;
};

const statusInfo: Record<string, { label: string; color: string }> = {
  BELUM_UPLOAD: {
    label: "Belum Upload",
    color: "bg-slate-100 text-slate-600",
  },
  MENUNGGU_PEMERIKSAAN: {
    label: "Menunggu Pemeriksaan",
    color: "bg-amber-100 text-amber-700",
  },
  REVISI: {
    label: "Perlu Revisi",
    color: "bg-red-100 text-red-700",
  },
  DISETUJUI: {
    label: "Disetujui",
    color: "bg-emerald-100 text-emerald-700",
  },
};

function formatDate(value: string | null | undefined) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

function formatSize(bytes: number) {
  if (!bytes) return "0 KB";
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function normalizeFile(item: ApiFile): ReportFile {
  return {
    id: Number(item.id),
    version_number: Number(item.version_number),
    original_filename: item.original_filename,
    file_size: Number(item.file_size),
    uploaded_at: item.uploaded_at,
  };
}

export default function LaporanAkhirClient() {
  const [data, setData] = useState<ReportData>({
    report: null,
    history: [],
    revisions: [],
  });

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fileRef = useRef<HTMLInputElement>(null);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/siswa/laporan-akhir", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal mengambil data laporan.");
      }

      // API menggunakan nama laporan, riwayat, dan revisi.
      const laporan = result.laporan;

      const currentFile =
        laporan?.file_id != null
          ? normalizeFile({
              id: laporan.file_id,
              version_number: laporan.version_number,
              original_filename: laporan.original_filename,
              file_size: laporan.file_size,
              uploaded_at: laporan.uploaded_at,
            })
          : null;

      setData({
        report: laporan
          ? {
              id: Number(laporan.id),
              status: laporan.status,
              submitted_at: laporan.submitted_at,
              current_file: currentFile,
            }
          : null,

        history: Array.isArray(result.riwayat)
          ? result.riwayat.map((item: ApiFile) => normalizeFile(item))
          : [],

        revisions: Array.isArray(result.revisi)
          ? result.revisi.map((item: Revision) => ({
              ...item,
              id: Number(item.id),
            }))
          : [],
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal mengambil data laporan."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleFileChange(selectedFile: File | null) {
    setError("");
    setMessage("");

    if (!selectedFile) {
      setFile(null);
      return;
    }

    if (
      selectedFile.type !== "application/pdf" &&
      !selectedFile.name.toLowerCase().endsWith(".pdf")
    ) {
      setError("File harus menggunakan format PDF.");
      setFile(null);

      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("Ukuran file maksimal 10 MB.");
      setFile(null);

      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    setFile(selectedFile);
  }

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      setError("Silakan pilih file laporan PDF terlebih dahulu.");
      return;
    }

    setUploading(true);
    setError("");
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/siswa/laporan-akhir", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal mengunggah laporan.");
      }

      setMessage(result.message || "Laporan berhasil diunggah.");
      setFile(null);

      if (fileRef.current) {
        fileRef.current.value = "";
      }

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Terjadi kesalahan saat upload."
      );
    } finally {
      setUploading(false);
    }
  }

  const status = data.report?.status || "BELUM_UPLOAD";
  const info = statusInfo[status] || statusInfo.BELUM_UPLOAD;

  const bolehUpload =
    status === "BELUM_UPLOAD" || status === "REVISI";

  return (
    <main className="min-h-screen bg-[#f5f7fc] px-4 py-8 text-slate-800 sm:px-6">
      <div className="mx-auto max-w-4xl space-y-6">
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

              <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">
                Laporan Akhir PKL
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100/80">
                Unggah dan pantau pemeriksaan laporan akhir PKL kamu.
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
                  Laporan Akhir
                </span>
              </nav>
            </div>

            <Link
              href="/siswa"
              className="inline-flex shrink-0 items-center justify-center rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20"
            >
              ← Kembali
            </Link>
          </div>
        </section>

        {message && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
            {message}
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {/* STATUS LAPORAN */}
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold tracking-wider text-slate-400">
                STATUS LAPORAN
              </p>

              <h2 className="mt-2 text-lg font-black text-[#10234b]">
                Pemeriksaan Laporan Akhir
              </h2>
            </div>

            <span
              className={`rounded-full px-4 py-2 text-xs font-bold ${info.color}`}
            >
              {info.label}
            </span>
          </div>

          {loading ? (
            <p className="mt-6 text-sm text-slate-500">
              Memuat data laporan...
            </p>
          ) : (
            <div className="mt-6 rounded-2xl bg-slate-50 p-4">
              {data.report?.current_file ? (
                <>
                  <p className="text-xs font-bold text-slate-400">
                    FILE TERAKHIR DIUNGGAH
                  </p>

                  <p className="mt-2 break-all text-sm font-bold text-[#10234b]">
                    {data.report.current_file.original_filename}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Versi {data.report.current_file.version_number} ·{" "}
                    {formatSize(data.report.current_file.file_size)}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Diunggah:{" "}
                    {formatDate(data.report.current_file.uploaded_at)}
                  </p>
                </>
              ) : (
                <p className="text-sm text-slate-500">
                  Kamu belum mengunggah laporan akhir PKL.
                </p>
              )}
            </div>
          )}
        </section>

        {/* FORM UPLOAD */}
        {!loading && bolehUpload && (
          <section className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-2xl">
                📄
              </div>

              <div>
                <h2 className="font-black text-[#10234b]">
                  {status === "REVISI"
                    ? "Unggah Revisi Laporan"
                    : "Unggah Laporan Akhir"}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Dokumen laporan akhir Praktik Kerja Lapangan.
                </p>
              </div>
            </div>

            {status === "REVISI" && (
              <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                Laporan kamu perlu diperbaiki. Perhatikan catatan revisi
                dari guru pembimbing sebelum mengunggah ulang.
              </div>
            )}

            <form onSubmit={handleUpload} className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Pilih File Laporan (PDF)
                </label>

                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(event) =>
                    handleFileChange(event.target.files?.[0] || null)
                  }
                  className="block w-full cursor-pointer rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm file:mr-4 file:rounded-xl file:border-0 file:bg-blue-700 file:px-4 file:py-2 file:text-sm file:font-bold file:text-white"
                />

                <p className="mt-2 text-xs text-slate-400">
                  Format PDF, ukuran maksimal 10 MB.
                </p>
              </div>

              {file && (
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                  <div className="min-w-0">
                    <p className="break-all text-sm font-bold text-emerald-800">
                      {file.name}
                    </p>

                    <p className="mt-1 text-xs text-emerald-700">
                      {formatSize(file.size)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      if (fileRef.current) fileRef.current.value = "";
                    }}
                    className="shrink-0 rounded-lg px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50"
                  >
                    Hapus
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={!file || uploading}
                className="w-full rounded-xl bg-gradient-to-r from-blue-700 to-cyan-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-100 transition hover:from-blue-800 hover:to-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploading
                  ? "Mengunggah Laporan..."
                  : status === "REVISI"
                    ? "Kirim Ulang Laporan"
                    : "Upload Laporan Akhir"}
              </button>
            </form>
          </section>
        )}

        {!loading && status === "MENUNGGU_PEMERIKSAAN" && (
          <section className="rounded-3xl border border-amber-100 bg-amber-50 p-6">
            <h3 className="font-black text-amber-800">
              Laporan Sedang Diperiksa
            </h3>

            <p className="mt-2 text-sm leading-relaxed text-amber-700">
              Laporan kamu sudah dikirim dan sedang menunggu pemeriksaan
              guru pembimbing. Kamu belum dapat mengunggah ulang selama
              proses pemeriksaan berlangsung.
            </p>
          </section>
        )}

        {!loading && status === "DISETUJUI" && (
          <section className="rounded-3xl border border-emerald-100 bg-emerald-50 p-6">
            <h3 className="font-black text-emerald-800">
              Laporan Akhir Disetujui
            </h3>

            <p className="mt-2 text-sm leading-relaxed text-emerald-700">
              Selamat! Laporan akhir PKL kamu telah disetujui oleh guru
              pembimbing.
            </p>
          </section>
        )}

        {/* CATATAN PEMERIKSAAN */}
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <h2 className="text-lg font-black text-[#10234b]">
            Catatan Pemeriksaan
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Riwayat persetujuan dan revisi dari guru pembimbing.
          </p>

          <div className="mt-5 space-y-3">
            {loading ? (
              <p className="rounded-2xl bg-slate-50 p-5 text-center text-sm text-slate-500">
                Memuat catatan pemeriksaan...
              </p>
            ) : data.revisions.length > 0 ? (
              data.revisions.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        item.aksi === "DISETUJUI"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {item.aksi === "DISETUJUI"
                        ? "Disetujui"
                        : "Diminta Revisi"}
                    </span>

                    <span className="text-xs text-slate-400">
                      {formatDate(item.created_at)}
                    </span>
                  </div>

                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                    {item.komentar || "Tidak ada catatan tambahan."}
                  </p>
                </article>
              ))
            ) : (
              <p className="rounded-2xl bg-slate-50 p-5 text-center text-sm text-slate-500">
                Belum ada catatan pemeriksaan.
              </p>
            )}
          </div>
        </section>

        {/* RIWAYAT UPLOAD */}
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <h2 className="text-lg font-black text-[#10234b]">
            Riwayat Upload
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Daftar versi laporan akhir yang pernah kamu unggah.
          </p>

          <div className="mt-5 space-y-3">
            {loading ? (
              <p className="rounded-2xl bg-slate-50 p-5 text-center text-sm text-slate-500">
                Memuat riwayat upload...
              </p>
            ) : data.history.length > 0 ? (
              data.history.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 p-4"
                >
                  <div className="min-w-0">
                    <p className="break-all text-sm font-bold text-[#10234b]">
                      {item.original_filename}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Versi {item.version_number} ·{" "}
                      {formatSize(item.file_size)}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {formatDate(item.uploaded_at)}
                    </p>
                  </div>

                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                    PDF
                  </span>
                </div>
              ))
            ) : (
              <p className="rounded-2xl bg-slate-50 p-5 text-center text-sm text-slate-500">
                Belum ada riwayat upload.
              </p>
            )}
          </div>
        </section>

        <footer className="pb-5 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} STRIDE — Sistem Informasi Praktik
          Kerja Lapangan
        </footer>
      </div>
    </main>
  );
}