
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  laporanId: number | null;
  status: string;
};

export default function ReviewActions({
  laporanId,
  status,
}: Props) {
  const router = useRouter();

  const [showRevision, setShowRevision] = useState(false);
  const [komentar, setKomentar] = useState("");
  const [loading, setLoading] = useState(false);

  async function submitReview(aksi: "DISETUJUI" | "DIMINTA_REVISI") {
    if (!laporanId || loading) return;

    if (aksi === "DISETUJUI") {
      const yakin = window.confirm(
        "Apakah Anda yakin ingin menyetujui laporan ini?"
      );

      if (!yakin) return;
    }

    if (aksi === "DIMINTA_REVISI" && !komentar.trim()) {
      window.alert("Komentar revisi wajib diisi.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `/api/admin/laporan-akhir/${laporanId}/review`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            aksi,
            komentar: aksi === "DIMINTA_REVISI" ? komentar : "",
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Pemeriksaan gagal.");
      }

      window.alert(result.message);

      setShowRevision(false);
      setKomentar("");

      router.refresh();
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan."
      );
    } finally {
      setLoading(false);
    }
  }

  if (!laporanId || status !== "MENUNGGU_PEMERIKSAAN") {
    return (
      <span className="text-xs text-slate-400">
        Tidak ada aksi
      </span>
    );
  }

  return (
    <div className="flex min-w-[180px] flex-col gap-2">
      <button
        type="button"
        disabled={loading}
        onClick={() => submitReview("DISETUJUI")}
        className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Memproses..." : "✓ ACC / Setujui"}
      </button>

      <button
        type="button"
        disabled={loading}
        onClick={() => setShowRevision(!showRevision)}
        className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-100 disabled:opacity-50"
      >
        Minta Revisi
      </button>

      {showRevision && (
        <div className="space-y-2 rounded-lg border border-rose-200 bg-rose-50 p-3">
          <label className="block text-xs font-bold text-slate-700">
            Catatan Revisi
          </label>

          <textarea
            value={komentar}
            onChange={(event) => setKomentar(event.target.value)}
            rows={4}
            placeholder="Contoh: Mohon perbaiki bagian kesimpulan dan lengkapi daftar pustaka."
            className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-700 outline-none focus:border-rose-400"
          />

          <button
            type="button"
            disabled={loading || !komentar.trim()}
            onClick={() => submitReview("DIMINTA_REVISI")}
            className="w-full rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50"
          >
            {loading ? "Mengirim..." : "Kirim Catatan Revisi"}
          </button>
        </div>
      )}
    </div>
  );
}
