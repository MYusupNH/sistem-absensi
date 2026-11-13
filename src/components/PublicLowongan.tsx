
"use client";

import { useEffect, useState } from "react";

type Lowongan = {
  id: number;
  judul: string;
  nama_instansi: string;
  lokasi: string;
  deskripsi: string;
  persyaratan: string | null;
  jurusan: string | null;
  kuota: number;
  tanggal_mulai: string | null;
  tanggal_selesai: string | null;
};

export default function PublicLowongan() {
  const [data, setData] = useState<Lowongan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Lowongan | null>(null);

  useEffect(() => {
    async function loadLowongan() {
      try {
        const response = await fetch("/api/lowongan-pkl", {
          cache: "no-store",
        });

        const result = await response.json();

        if (response.ok && result.success) {
          setData(result.data || []);
        }
      } catch (error) {
        console.error("Gagal memuat lowongan:", error);
      } finally {
        setLoading(false);
      }
    }

    loadLowongan();
  }, []);

  const filteredData = data.filter((item) => {
    const keyword = search.toLowerCase();

    return (
      item.judul.toLowerCase().includes(keyword) ||
      item.nama_instansi.toLowerCase().includes(keyword) ||
      item.lokasi.toLowerCase().includes(keyword) ||
      (item.jurusan || "").toLowerCase().includes(keyword)
    );
  });

  function formatTanggal(value: string | null) {
    if (!value) return "Belum ditentukan";

    return new Date(value).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
  }

  return (
    <section
      id="lowongan-pkl"
      className="relative overflow-hidden bg-gradient-to-b from-[#071a3d] via-[#0b2450] to-[#f4f8ff] px-5 py-20 md:px-10"
    >
      <div className="pointer-events-none absolute -right-32 top-10 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-32 top-1/2 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl">
        {/* HEADING */}
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-xs font-bold tracking-widest text-cyan-200">
            PELUANG PRAKTIK KERJA LAPANGAN
          </span>

          <h2 className="mt-5 text-3xl font-extrabold leading-tight text-white md:text-4xl">
            Temukan Tempat PKL
            <span className="block text-cyan-300">
              Sesuai Jurusanmu
            </span>
          </h2>

          <p className="mt-4 text-sm leading-7 text-blue-100/80 md:text-base">
            Jelajahi informasi lowongan PKL dari perusahaan dan instansi.
            Sekolah dapat memilih peluang yang sesuai dengan kebutuhan
            dan kompetensi siswanya.
          </p>
        </div>

        {/* SEARCH */}
        <div className="mx-auto mt-10 max-w-2xl">
          <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white p-2 shadow-2xl shadow-blue-950/20">
            <span className="pl-3 text-xl">⌕</span>

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari posisi, perusahaan, lokasi, atau jurusan..."
              className="min-w-0 flex-1 bg-transparent px-1 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />

            {search && (
              <button
                onClick={() => setSearch("")}
                className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100"
              >
                Hapus
              </button>
            )}
          </div>
        </div>

        {/* JUMLAH */}
        <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold text-white">
              Lowongan Tersedia
            </h3>
            <p className="mt-1 text-sm text-blue-100/70">
              Pilihan kesempatan PKL yang sedang dibuka.
            </p>
          </div>

          <span className="rounded-full border border-cyan-200/20 bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-100">
            {loading ? "Memuat..." : `${filteredData.length} lowongan`}
          </span>
        </div>

        {/* LIST */}
        {loading ? (
          <div className="mt-7 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-72 animate-pulse rounded-2xl bg-white/10"
              />
            ))}
          </div>
        ) : filteredData.length === 0 ? (
          <div className="mt-7 rounded-3xl border border-white/15 bg-white/10 px-6 py-16 text-center backdrop-blur-sm">
            <div className="text-5xl">🔎</div>
            <h3 className="mt-5 text-xl font-bold text-white">
              {search
                ? "Lowongan tidak ditemukan"
                : "Belum Ada Lowongan PKL"}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-blue-100/70">
              {search
                ? "Coba gunakan kata kunci lain untuk mencari lowongan."
                : "Lowongan PKL yang dibuka oleh perusahaan atau instansi akan muncul di halaman ini."}
            </p>
          </div>
        ) : (
          <div className="mt-7 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredData.map((item) => (
              <article
                key={item.id}
                className="group flex flex-col rounded-2xl border border-white/70 bg-white p-6 shadow-xl shadow-blue-950/10 transition duration-300 hover:-translate-y-1 hover:shadow-2xl"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-700 to-cyan-500 text-2xl text-white shadow-lg">
                    💼
                  </div>

                  <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700">
                    ● DIBUKA
                  </span>
                </div>

                <h3 className="mt-5 text-lg font-extrabold leading-snug text-slate-800">
                  {item.judul}
                </h3>

                <p className="mt-2 text-sm font-semibold text-blue-700">
                  {item.nama_instansi}
                </p>

                <div className="mt-4 space-y-3 border-y border-slate-100 py-4 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <span>📍</span>
                    <span>{item.lokasi}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span>👨‍🎓</span>
                    <span>Kuota {item.kuota} siswa</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span>🎓</span>
                    <span className="line-clamp-1">
                      {item.jurusan || "Semua jurusan"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span>📅</span>
                    <span className="text-xs">
                      {formatTanggal(item.tanggal_mulai)}
                      {" – "}
                      {formatTanggal(item.tanggal_selesai)}
                    </span>
                  </div>
                </div>

                <p className="mt-4 line-clamp-3 flex-1 text-sm leading-6 text-slate-500">
                  {item.deskripsi}
                </p>

                <button
                  onClick={() => setSelected(item)}
                  className="mt-5 w-full rounded-xl bg-gradient-to-r from-blue-700 to-cyan-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-900/10 transition hover:brightness-110"
                >
                  Lihat Detail Lowongan →
                </button>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      {selected && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="my-auto max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="bg-gradient-to-r from-[#071a3d] to-[#15549a] p-7 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-bold text-emerald-200">
                    LOWONGAN DIBUKA
                  </span>

                  <h3 className="mt-4 text-2xl font-extrabold">
                    {selected.judul}
                  </h3>

                  <p className="mt-2 text-sm text-blue-100">
                    {selected.nama_instansi}
                  </p>
                </div>

                <button
                  onClick={() => setSelected(null)}
                  className="text-3xl text-white/80 hover:text-white"
                  aria-label="Tutup detail"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="space-y-6 p-7">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-400">Lokasi</p>
                  <p className="mt-1 font-bold text-slate-800">
                    {selected.lokasi}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-400">Kuota</p>
                  <p className="mt-1 font-bold text-slate-800">
                    {selected.kuota} siswa
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-400">Tanggal Mulai</p>
                  <p className="mt-1 font-bold text-slate-800">
                    {formatTanggal(selected.tanggal_mulai)}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-400">Tanggal Selesai</p>
                  <p className="mt-1 font-bold text-slate-800">
                    {formatTanggal(selected.tanggal_selesai)}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800">
                  Deskripsi Lowongan
                </h4>
                <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-600">
                  {selected.deskripsi}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-800">
                  Jurusan yang Dibutuhkan
                </h4>
                <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-600">
                  {selected.jurusan || "Semua jurusan"}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-800">
                  Persyaratan
                </h4>
                <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-600">
                  {selected.persyaratan || "Tidak ada persyaratan khusus yang dicantumkan."}
                </p>
              </div>

              <div className="rounded-xl bg-blue-50 p-4 text-sm leading-6 text-blue-800">
                Pengajuan peserta PKL dilakukan oleh pihak sekolah melalui
                akun sekolah STRIDE. Siswa tidak mengajukan secara individu
                melalui halaman ini.
              </div>

              <button
                onClick={() => setSelected(null)}
                className="w-full rounded-xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
