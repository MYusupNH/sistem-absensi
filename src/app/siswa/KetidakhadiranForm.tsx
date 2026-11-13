
"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

type Pengajuan = {
  id: number;
  tanggal: string;
  jenis: "IZIN" | "SAKIT";
  alasan: string;
  status: "MENUNGGU" | "DISETUJUI" | "DITOLAK";
  catatan_guru: string | null;
};

function tanggalHariIni() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
  }).format(new Date());
}

function formatTanggal(value: string) {
  const dateOnly = String(value).slice(0, 10);
  const [year, month, day] = dateOnly.split("-").map(Number);

  return new Date(year, month - 1, day, 12).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function KetidakhadiranForm() {
  const [tanggal, setTanggal] = useState(tanggalHariIni());
  const [jenis, setJenis] = useState<"IZIN" | "SAKIT">("IZIN");
  const [alasan, setAlasan] = useState("");
  const [data, setData] = useState<Pengajuan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    try {
      const response = await fetch("/api/siswa/ketidakhadiran", {
        cache: "no-store",
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal mengambil riwayat.");
      }

      setData(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/siswa/ketidakhadiran", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tanggal, jenis, alasan }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Pengajuan gagal dikirim.");
      }

      setMessage(result.message);
      setAlasan("");
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Terjadi kesalahan."
      );
    } finally {
      setSaving(false);
    }
  }

  function statusStyle(status: string) {
    if (status === "DISETUJUI") {
      return "bg-emerald-100 text-emerald-700";
    }
    if (status === "DITOLAK") {
      return "bg-red-100 text-red-700";
    }
    return "bg-amber-100 text-amber-700";
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="mb-6">
        <span className="rounded-full bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-700">
          IZIN DAN KETIDAKHADIRAN
        </span>
        <h3 className="mt-4 text-xl font-black text-[#10234b]">
          Pengajuan Izin / Sakit
        </h3>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          Jika tidak dapat mengikuti PKL, kirim pengajuan agar guru sekolah
          dapat memeriksa ketidakhadiranmu.
        </p>
      </div>

      {message && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">
            Tanggal tidak hadir
          </label>
          <input
            type="date"
            required
            max={tanggalHariIni()}
            value={tanggal}
            onChange={(event) => setTanggal(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">
            Jenis ketidakhadiran
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setJenis("IZIN")}
              className={`rounded-xl border p-4 text-left transition ${
                jenis === "IZIN"
                  ? "border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-100"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span className="block text-sm font-bold">Izin</span>
              <span className="mt-1 block text-xs">Keperluan pribadi</span>
            </button>

            <button
              type="button"
              onClick={() => setJenis("SAKIT")}
              className={`rounded-xl border p-4 text-left transition ${
                jenis === "SAKIT"
                  ? "border-orange-500 bg-orange-50 text-orange-700 ring-2 ring-orange-100"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span className="block text-sm font-bold">Sakit</span>
              <span className="mt-1 block text-xs">Kondisi kesehatan</span>
            </button>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">
            Alasan ketidakhadiran
          </label>
          <textarea
            required
            minLength={5}
            maxLength={2000}
            rows={4}
            value={alasan}
            onChange={(event) => setAlasan(event.target.value)}
            placeholder="Jelaskan alasan kamu tidak dapat mengikuti kegiatan PKL..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-blue-700 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-blue-800 disabled:opacity-50"
        >
          {saving ? "Mengirim Pengajuan..." : "Kirim Pengajuan"}
        </button>

        <p className="text-xs leading-5 text-slate-400">
          Pengajuan akan berstatus Menunggu sampai diperiksa oleh guru sekolah.
          Pengajuan yang disetujui akan dicatat sebagai izin atau sakit.
        </p>
      </form>

      <div className="mt-8 border-t border-slate-100 pt-6">
        <h4 className="font-bold text-[#10234b]">Riwayat Pengajuan</h4>

        {loading ? (
          <p className="mt-4 text-sm text-slate-400">Memuat riwayat...</p>
        ) : data.length === 0 ? (
          <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
            Belum ada pengajuan izin atau sakit.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {data.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-slate-100 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      {item.jenis === "SAKIT" ? "Sakit" : "Izin"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatTanggal(item.tanggal)}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyle(item.status)}`}
                  >
                    {item.status === "MENUNGGU"
                      ? "Menunggu"
                      : item.status === "DISETUJUI"
                        ? "Disetujui"
                        : "Ditolak"}
                  </span>
                </div>

                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {item.alasan}
                </p>

                {item.catatan_guru && (
                  <p className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                    <strong>Catatan guru:</strong> {item.catatan_guru}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
