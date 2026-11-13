
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  pengajuanId: number;
  status: string;
};

export default function HapusPengajuanButton({
  pengajuanId,
  status,
}: Props) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const statusNormal = status.trim().toUpperCase();
  const bolehDihapus = ["MENUNGGU", "DITOLAK"].includes(statusNormal);

  if (!bolehDihapus) {
    return null;
  }

  async function handleHapus() {
    const yakin = window.confirm(
      `Apakah Anda yakin ingin menghapus pengajuan #${pengajuanId}?\n\nData pengajuan dan daftar siswa yang terhubung akan dihapus. Tindakan ini tidak dapat dibatalkan.`
    );

    if (!yakin) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/sekolah/pengajuan-pkl/${pengajuanId}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Gagal menghapus pengajuan."
        );
      }

      alert("Pengajuan PKL berhasil dihapus.");

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat menghapus pengajuan."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-5">
      <button
        type="button"
        onClick={handleHapus}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Menghapus...
          </>
        ) : (
          <>
            <span>🗑️</span>
            Hapus Pengajuan
          </>
        )}
      </button>

      {error && (
        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
