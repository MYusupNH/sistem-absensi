import Link from "next/link";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

type Lowongan = {
  id: number;
  judul: string;
  nama_instansi: string;
  lokasi: string;
  deskripsi: string;
  persyaratan: string | null;
  jurusan: string | null;
  kuota: number;
  tanggal_mulai: string | Date | null;
  tanggal_selesai: string | Date | null;
};

function formatTanggal(value: string | Date | null) {
  if (!value) return "Belum ditentukan";

  const date =
    value instanceof Date
      ? value
      : new Date(`${String(value).slice(0, 10)}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "Belum ditentukan";
  }

  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function LowonganPKLPage() {
  let lowongan: Lowongan[] = [];
  let errorDatabase = false;

  try {
    const result = await sql`
      SELECT
        id,
        judul,
        nama_instansi,
        lokasi,
        deskripsi,
        persyaratan,
        jurusan,
        kuota,
        tanggal_mulai,
        tanggal_selesai
      FROM lowongan_pkl
      WHERE status = 'DIBUKA'
      ORDER BY created_at DESC
    `;

    lowongan = result as unknown as Lowongan[];
  } catch (error) {
    console.error("GAGAL MEMUAT LOWONGAN PKL:", error);
    errorDatabase = true;
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#020b20] text-white">

      {/* NAVBAR */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#06142f]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">

          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 text-2xl font-black shadow-lg shadow-blue-500/30">
              S
            </div>

            <div>
              <h1 className="text-xl font-extrabold tracking-wide">
                STRIDE<span className="text-cyan-400">.</span>
              </h1>
              <p className="text-[9px] tracking-[2px] text-blue-200/70">
                INFORMASI PKL DIGITAL
              </p>
            </div>
          </Link>

          {/* SEMUA MENU NAVBAR */}
          <nav className="hidden items-center gap-8 md:flex">
            <Link
              href="/"
              className="text-sm font-semibold text-blue-100 transition hover:text-cyan-400"
            >
              Beranda
            </Link>

            <Link
              href="/lowongan-pkl"
              className="text-sm font-bold text-cyan-400 transition hover:text-white"
            >
              Lowongan PKL
            </Link>

            <Link
              href="/fitur"
              className="text-sm font-semibold text-blue-100 transition hover:text-cyan-400"
            >
              Fitur
            </Link>

            <Link
              href="/tentang"
              className="text-sm font-semibold text-blue-100 transition hover:text-cyan-400"
            >
              Tentang
            </Link>
          </nav>

          <Link
            href="/login"
            className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-500/10 transition hover:-translate-y-0.5 hover:brightness-110"
          >
            Masuk
          </Link>
        </div>

        {/* NAVBAR MOBILE */}
        <div className="border-t border-white/5 px-5 py-3 md:hidden">
          <nav className="flex items-center justify-center gap-5 overflow-x-auto whitespace-nowrap">
            <Link
              href="/"
              className="text-xs font-semibold text-blue-100 hover:text-cyan-400"
            >
              Beranda
            </Link>

            <Link
              href="/lowongan-pkl"
              className="text-xs font-bold text-cyan-400"
            >
              Lowongan PKL
            </Link>

            <Link
              href="/fitur"
              className="text-xs font-semibold text-blue-100 hover:text-cyan-400"
            >
              Fitur
            </Link>

            <Link
              href="/tentang"
              className="text-xs font-semibold text-blue-100 hover:text-cyan-400"
            >
              Tentang
            </Link>
          </nav>
        </div>
      </header>


      {/* DAFTAR LOWONGAN */}
      <section
        id="daftar-lowongan"
        className="bg-gradient-to-b from-[#06132e] to-[#081b40] px-6 py-24 lg:px-10"
      >
        <div className="mx-auto max-w-7xl">

          <div className="mb-12 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-5 py-2 text-xs font-bold uppercase tracking-widest text-cyan-300">
                Informasi Kesempatan PKL
              </span>

              <h2 className="mt-7 text-3xl font-black md:text-5xl">
                Daftar Lowongan
                <span className="block bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
                  Praktik Kerja Lapangan
                </span>
              </h2>

              <p className="mt-5 max-w-2xl leading-8 text-blue-100/60">
                Pilih kesempatan PKL yang sesuai dengan jurusan,
                minat, dan kebutuhan sekolah.
              </p>
            </div>

            <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-3 text-sm font-semibold text-cyan-300">
              {lowongan.length} Lowongan Tersedia
            </div>
          </div>

          {errorDatabase ? (
            <div className="rounded-3xl border border-red-400/20 bg-red-400/10 px-6 py-16 text-center">
              <div className="text-4xl">⚠️</div>
              <h3 className="mt-5 text-xl font-bold">
                Gagal Memuat Lowongan
              </h3>
              <p className="mt-3 text-sm text-blue-100/60">
                Terjadi kendala saat mengambil data lowongan.
                Silakan coba beberapa saat lagi.
              </p>
            </div>
          ) : lowongan.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] px-6 py-20 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-500/15 text-4xl">
                📭
              </div>

              <h3 className="mt-6 text-xl font-bold">
                Belum Ada Lowongan PKL
              </h3>

              <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-blue-100/50">
                Saat ini belum ada lowongan yang tersedia.
                Silakan kunjungi kembali halaman ini untuk
                melihat informasi terbaru.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {lowongan.map((item) => (
                <article
                  key={item.id}
                  className="group flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-blue-900/60 to-[#07152e] shadow-xl transition duration-300 hover:-translate-y-2 hover:border-cyan-400/50"
                >
                  <div className="h-1.5 bg-gradient-to-r from-blue-500 to-cyan-400" />

                  <div className="flex flex-1 flex-col p-7">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 text-2xl shadow-lg">
                        🏢
                      </div>

                      <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-bold tracking-wider text-emerald-300">
                        ● SEDANG DIBUKA
                      </span>
                    </div>

                    <h3 className="mt-6 text-xl font-extrabold leading-snug text-white transition group-hover:text-cyan-300">
                      {item.judul}
                    </h3>

                    <p className="mt-2 text-sm font-semibold text-cyan-300">
                      {item.nama_instansi}
                    </p>

                    <div className="mt-5 space-y-3 border-t border-white/10 pt-5 text-sm text-blue-100/70">
                      <div className="flex items-center gap-3">
                        <span>📍</span>
                        <span>{item.lokasi}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span>👨‍🎓</span>
                        <span>Kuota {item.kuota} siswa</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span>📅</span>
                        <span>{formatTanggal(item.tanggal_mulai)}</span>
                      </div>
                    </div>

                    <p className="mt-5 line-clamp-3 text-sm leading-7 text-blue-100/60">
                      {item.deskripsi}
                    </p>

                    {item.jurusan && (
                      <div className="mt-5">
                        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-blue-200/50">
                          Jurusan yang Dibutuhkan
                        </p>
                        <p className="text-sm text-cyan-200">
                          {item.jurusan}
                        </p>
                      </div>
                    )}

                    {item.persyaratan && (
                      <div className="mt-4">
                        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-blue-200/50">
                          Persyaratan
                        </p>
                        <p className="line-clamp-2 text-sm leading-6 text-blue-100/60">
                          {item.persyaratan}
                        </p>
                      </div>
                    )}

                    <div className="mt-auto pt-7">
                      <div className="mb-4 border-t border-white/10 pt-4 text-xs text-blue-100/50">
                        Periode: {formatTanggal(item.tanggal_mulai)}
                        {" - "}
                        {formatTanggal(item.tanggal_selesai)}
                      </div>

                      <Link
                        href="/login"
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-3.5 text-sm font-bold text-white shadow-lg transition hover:brightness-110"
                      >
                        Masuk untuk Mengajukan →
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>


      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-[#030a19] px-6 py-9 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">

          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 text-xl font-black">
              S
            </div>

            <div>
              <h3 className="font-extrabold">
                STRIDE
              </h3>
              <p className="text-[10px] text-blue-200/50">
                SISTEM INFORMASI PRAKTIK KERJA LAPANGAN
              </p>
            </div>
          </Link>

          <p className="text-center text-xs text-blue-100/40">
            © {new Date().getFullYear()} STRIDE. All Rights Reserved.
          </p>

          <Link
            href="/login"
            className="text-sm font-bold text-cyan-400 transition hover:text-white"
          >
            Login Sistem →
          </Link>
        </div>
      </footer>
    </main>
  );
}