
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  id: number;
  status: string | null;
};

export default function ValidasiButton({ id, status }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const sudahValid = status === "TERVALIDASI";

  async function handleValidasi() {
    const statusBaru = sudahValid ? "BELUM" : "TERVALIDASI";

    const konfirmasi = window.confirm(
      sudahValid
        ? "Batalkan validasi laporan ini?"
        : "Apakah Anda yakin ingin memvalidasi laporan ini?"
    );

    if (!konfirmasi) return;

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `/api/admin/logbook/${id}/validasi`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: statusBaru }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Validasi gagal.");
      }

      setMessage(result.message);
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-w-[150px]">
      {sudahValid ? (
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
            <span>✓</span>
            Tervalidasi
          </span>

          <button
            type="button"
            onClick={handleValidasi}
            disabled={loading}
            className="block rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Memproses..." : "Batalkan Validasi"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleValidasi}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <span className="animate-spin">⏳</span>
              Memproses...
            </>
          ) : (
            <>
              <span>✓</span>
              Validasi
            </>
          )}
        </button>
      )}

      {message && (
        <p className="mt-2 max-w-[180px] text-xs text-slate-500">
          {message}
        </p>
      )}
    </div>
  );
}
