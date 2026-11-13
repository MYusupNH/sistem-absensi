
"use client";

import { useCallback, useEffect, useState } from "react";

type Item = {
  id: number;
  tanggal: string;
  jenis: "IZIN" | "SAKIT";
  alasan: string;
  bukti_url: string | null;
  status: "MENUNGGU" | "DISETUJUI" | "DITOLAK";
  catatan_guru: string | null;
  full_name: string;
  nisn: string | null;
  class_name: string | null;
  major: string | null;
};

function formatTanggal(value: string) {
  const [year, month, day] = String(value).slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day, 12).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function KetidakhadiranTable() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [catatan, setCatatan] = useState<Record<number, string>>({});
  const [filter, setFilter] = useState("MENUNGGU");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    try {
      const response = await fetch("/api/sekolah/ketidakhadiran", {
        cache: "no-store",
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal mengambil data.");
      }

      setItems(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function periksa(id: number, status: "DISETUJUI" | "DITOLAK") {
    setProcessingId(id);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/sekolah/ketidakhadiran", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          status,
          catatan_guru: catatan[id] || "",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal memproses pengajuan.");
      }

      setMessage(result.message);
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Terjadi kesalahan."
      );
    } finally {
      setProcessingId(null);
    }
  }

  const menunggu = items.filter((item) => item.status === "MENUNGGU").length;
  const disetujui = items.filter((item) => item.status === "DISETUJUI").length;
  const ditolak = items.filter((item) => item.status === "DITOLAK").length;

  const filtered = items.filter(
    (item) => filter === "SEMUA" || item.status === filter
  );

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Menunggu Pemeriksaan", value: menunggu, color: "text-amber-600" },
          { label: "Disetujui", value: disetujui, color: "text-emerald-600" },
          { label: "Ditolak", value: ditolak, color: "text-red-600" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{stat.label}</p>
            <p className={`mt-2 text-3xl font-black ${stat.color}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </section>

      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
          <div>
            <h2 className="font-bold text-slate-800">Daftar Pengajuan</h2>
            <p className="mt-1 text-xs text-slate-500">
              Hanya pengajuan siswa dari sekolah Anda.
            </p>
          </div>

          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="MENUNGGU">Menunggu</option>
            <option value="DISETUJUI">Disetujui</option>
            <option value="DITOLAK">Ditolak</option>
            <option value="SEMUA">Semua Status</option>
          </select>
        </div>

        {loading ? (
          <p className="p-8 text-center text-sm text-slate-400">
            Memuat pengajuan...
          </p>
        ) : filtered.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-400">
            Tidak ada pengajuan pada kategori ini.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((item) => (
              <article key={item.id} className="space-y-4 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-800">
                      {item.full_name}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      NISN: {item.nisn || "-"} · Kelas: {item.class_name || "-"}
                      {item.major ? ` · ${item.major}` : ""}
                    </p>
                  </div>

                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                    item.status === "DISETUJUI"
                      ? "bg-emerald-100 text-emerald-700"
                      : item.status === "DITOLAK"
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                  }`}>
                    {item.status}
                  </span>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-bold text-slate-500">
                    {item.jenis === "SAKIT" ? "PENGAJUAN SAKIT" : "PENGAJUAN IZIN"}
                    {" · "}
                    {formatTanggal(item.tanggal)}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {item.alasan}
                  </p>
                  {item.bukti_url && (
                    <a
                      href={item.bukti_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-block text-sm font-bold text-blue-700 underline"
                    >
                      Lihat bukti pengajuan
                    </a>
                  )}
                </div>

                {item.status === "MENUNGGU" ? (
                  <div className="space-y-3">
                    <textarea
                      rows={2}
                      value={catatan[item.id] || ""}
                      onChange={(event) =>
                        setCatatan((previous) => ({
                          ...previous,
                          [item.id]: event.target.value,
                        }))
                      }
                      placeholder="Catatan guru (opsional)..."
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        disabled={processingId === item.id}
                        onClick={() => periksa(item.id, "DISETUJUI")}
                        className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {processingId === item.id ? "Memproses..." : "Setujui"}
                      </button>
                      <button
                        type="button"
                        disabled={processingId === item.id}
                        onClick={() => periksa(item.id, "DITOLAK")}
                        className="rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        Tolak
                      </button>
                    </div>
                  </div>
                ) : item.catatan_guru ? (
                  <p className="text-xs text-slate-500">
                    Catatan guru: {item.catatan_guru}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
