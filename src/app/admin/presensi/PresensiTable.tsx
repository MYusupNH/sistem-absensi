
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

function formatTanggal(value: string | Date) {
  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
}

// Menampilkan jam saja, tanpa tanggal atau hari.
function formatJam(value: string | null) {
  if (!value) return "-";

  const jam = String(value).trim();

  // Format timestamp lengkap, misalnya 2026-11-13T08:15:32
  if (jam.includes("T")) {
    const date = new Date(jam);

    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZone: "Asia/Jakarta",
      });
    }
  }

  // Format jam biasa, misalnya 08:15:32 atau 08:15:32.123
  const match = jam.match(/(\d{2}:\d{2}(?::\d{2})?)/);

  return match ? match[1] : jam;
}

export default function PresensiTable({
  data,
}: {
  data: Presensi[];
}) {
  const router = useRouter();

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [selectedSelfie, setSelectedSelfie] = useState<Presensi | null>(null);

  async function hapusPresensi(item: Presensi) {
    const nama = item.full_name || "siswa ini";

    const yakin = window.confirm(
      `Apakah Anda yakin ingin menghapus presensi ${nama} tanggal ${formatTanggal(item.tanggal)}?\n\nData yang dihapus tidak dapat dikembalikan.`
    );

    if (!yakin) return;

    setDeletingId(item.id);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`/api/admin/presensi/${item.id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal menghapus presensi.");
      }

      setMessage(result.message || "Presensi berhasil dihapus.");

      if (selectedSelfie?.id === item.id) {
        setSelectedSelfie(null);
      }

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat menghapus presensi."
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      {message && (
        <div className="mx-6 mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {message}
        </div>
      )}

      {error && (
        <div className="mx-6 mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {data.length === 0 ? (
        <div className="px-6 py-20 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-3xl">
            🕒
          </div>

          <h3 className="mt-4 font-bold text-slate-700">
            Belum Ada Data Presensi
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            Data presensi siswa akan muncul setelah siswa melakukan absensi.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1350px] text-left text-sm">
            <thead className="bg-[#f7f9fd] text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4">No.</th>
                <th className="px-6 py-4">Nama Siswa</th>
                <th className="px-6 py-4">Kelas / Jurusan</th>
                <th className="px-6 py-4">Tanggal</th>
                <th className="px-6 py-4">Jam Masuk</th>
                <th className="px-6 py-4">Jam Pulang</th>
                <th className="px-6 py-4">Bukti Selfie</th>
                <th className="px-6 py-4">Jarak Presensi</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {data.map((item, index) => {
                const sudahKeluar = Boolean(item.jam_keluar);
                const sedangDihapus = deletingId === item.id;

                return (
                  <tr
                    key={item.id}
                    className="transition hover:bg-blue-50/40"
                  >
                    <td className="px-6 py-4 text-slate-500">
                      {index + 1}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 font-bold text-white">
                          {(item.full_name || "S")
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <p className="font-bold text-slate-800">
                            {item.full_name || "Nama tidak tersedia"}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            Peserta PKL
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-700">
                        {item.class_name || "-"}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {item.major || "-"}
                      </p>
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                      {formatTanggal(item.tanggal)}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-lg">
                          🕘
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Jam Masuk
                          </p>
                          <p className="mt-1 whitespace-nowrap font-extrabold text-blue-700">
                            {formatJam(item.jam_masuk)}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-lg">
                          🕔
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Jam Pulang
                          </p>
                          <p className="mt-1 whitespace-nowrap font-extrabold text-emerald-700">
                            {formatJam(item.jam_keluar)}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* BUKTI FOTO SELFIE */}
                    <td className="px-6 py-4">
                      {item.selfie_data ? (
                        <button
                          type="button"
                          onClick={() => setSelectedSelfie(item)}
                          className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-600 hover:text-white"
                        >
                          <span>📷</span>
                          Lihat Selfie
                        </button>
                      ) : (
                        <span className="inline-flex rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-500">
                          Tidak ada foto
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      {item.jarak_meter != null ? (
                        <span className="inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 font-semibold text-slate-600">
                          📍 {Math.round(Number(item.jarak_meter))} meter
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      {sudahKeluar ? (
                        <span className="inline-flex whitespace-nowrap rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                          ✓ Selesai
                        </span>
                      ) : item.jam_masuk ? (
                        <span className="inline-flex whitespace-nowrap rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">
                          ● Sedang PKL
                        </span>
                      ) : (
                        <span className="inline-flex whitespace-nowrap rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
                          Belum Masuk
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => hapusPresensi(item)}
                        disabled={deletingId !== null}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {sedangDihapus ? (
                          <>
                            <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            Menghapus...
                          </>
                        ) : (
                          <>
                            <span>🗑️</span>
                            Hapus
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {data.length > 0 && (
        <div className="border-t border-slate-100 px-6 py-4">
          <p className="text-xs text-slate-400">
            Menampilkan {data.length} catatan presensi siswa.
          </p>
        </div>
      )}

      {/* POP-UP FOTO SELFIE */}
      {selectedSelfie && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"
          onClick={() => setSelectedSelfie(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="selfie-title"
            className="relative max-h-[95vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  Bukti Kehadiran
                </p>
                <h2
                  id="selfie-title"
                  className="mt-1 text-xl font-extrabold text-slate-800"
                >
                  Foto Selfie Siswa
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedSelfie.full_name || "Nama siswa tidak tersedia"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedSelfie(null)}
                aria-label="Tutup foto"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg text-slate-600 transition hover:bg-red-50 hover:text-red-600"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
              {selectedSelfie.selfie_data && (
                <img
                  src={selectedSelfie.selfie_data}
                  alt={`Bukti selfie ${selectedSelfie.full_name || "siswa"}`}
                  className="mx-auto max-h-[65vh] w-full object-contain"
                />
              )}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Tanggal</p>
                <p className="mt-1 text-sm font-bold text-slate-800">
                  {formatTanggal(selectedSelfie.tanggal)}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Jam Masuk</p>
                <p className="mt-1 text-sm font-bold text-blue-700">
                  {formatJam(selectedSelfie.jam_masuk)}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedSelfie(null)}
              className="mt-5 w-full rounded-xl bg-[#0F2A5F] px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-800"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
