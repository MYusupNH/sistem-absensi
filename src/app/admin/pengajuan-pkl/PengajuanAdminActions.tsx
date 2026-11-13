"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  id: number;
  status: string;
};

export default function PengajuanAdminActions({ id, status }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function updateStatus(statusBaru: "DISETUJUI" | "DITOLAK") {
    setError("");

    let catatan = "";

    if (statusBaru === "DITOLAK") {
      const alasan = window.prompt("Masukkan alasan penolakan pengajuan:");

      if (alasan === null) return;

      if (!alasan.trim()) {
        setError("Alasan penolakan wajib diisi.");
        return;
      }

      catatan = alasan.trim();
    } else {
      const konfirmasi = window.confirm(
        "Apakah kamu yakin ingin menyetujui pengajuan ini?"
      );

      if (!konfirmasi) return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/admin/pengajuan-pkl", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          status: statusBaru,
          catatan,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || "Gagal memperbarui pengajuan.");
        return;
      }

      router.refresh();
    } catch {
      setError("Tidak dapat menghubungi server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border-t border-slate-100 bg-slate-50 p-5">
      {error && (
        <p className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {status === "MENUNGGU" ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={loading}
            onClick={() => updateStatus("DITOLAK")}
            className="rounded-xl border border-red-200 bg-white px-5 py-3 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            Tolak Pengajuan
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => updateStatus("DISETUJUI")}
            className="rounded-xl bg-gradient-to-r from-blue-700 to-cyan-600 px-5 py-3 text-sm font-bold text-white shadow-md hover:brightness-110 disabled:opacity-50"
          >
            {loading ? "Memproses..." : "Setujui Pengajuan"}
          </button>
        </div>
      ) : (
        <p className="text-right text-sm font-semibold text-slate-500">
          Pengajuan ini sudah diproses.
        </p>
      )}
    </div>
  );
}