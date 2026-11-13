
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

type Lowongan = {
  id: number;
  judul: string;
  nama_instansi: string;
  lokasi: string | null;
  deskripsi: string | null;
  persyaratan: string | null;
  jurusan: string | null;
  kuota: number;
  tanggal_mulai: string | null;
  tanggal_selesai: string | null;
  status: string;
};

export default async function PengajuanPKLPage() {
  const user = await requireRole("school");

  if (!user) redirect("/login");

  let lowongan: Lowongan[] = [];

  try {
    const rows = await sql`
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
        tanggal_selesai,
        status
      FROM lowongan_pkl
      WHERE status = 'DIBUKA'
      ORDER BY created_at DESC
    `;

    lowongan = rows as unknown as Lowongan[];
  } catch (error) {
    console.error("PENGAJUAN PKL ERROR:", error);
  }

  return (
    <div className="min-h-screen p-5 text-slate-800 md:p-8">
      <div className="mx-auto max-w-7xl space-y-7">

        {/* HEADER */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold text-blue-600">
              PORTAL GURU / SEKOLAH
            </p>
            <h1 className="mt-2 text-3xl font-extrabold text-slate-900">
              Pengajuan PKL
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Cari tempat PKL dan ajukan beberapa siswa sekaligus ke instansi tujuan.
            </p>
          </div>

          <Link
            href="/sekolah/status-pengajuan"
            className="inline-flex items-center justify-center rounded-xl bg-[#07152f] px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-900"
          >
            Lihat Status Pengajuan →
          </Link>
        </div>

        {/* HERO */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#07152f] via-blue-900 to-cyan-700 p-7 text-white md:p-9">
          <div className="relative z-10 max-w-2xl">
            <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold">
              INFORMASI LOWONGAN PKL
            </span>

            <h2 className="mt-5 text-2xl font-extrabold leading-tight md:text-3xl">
              Temukan Tempat PKL
              <br />
              Terbaik untuk Siswa Anda
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-7 text-blue-100">
              Pilih lowongan yang tersedia, tentukan siswa yang akan diajukan,
              kemudian kirim permohonan PKL kepada perusahaan atau instansi.
            </p>
          </div>

          <div className="pointer-events-none absolute -right-10 -top-20 h-72 w-72 rounded-full border-[35px] border-white/10" />
          <div className="pointer-events-none absolute -bottom-32 right-40 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
        </div>

        {/* STATISTIK */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Lowongan tersedia</p>
              <span className="rounded-xl bg-blue-50 p-3 text-xl">▤</span>
            </div>
            <h3 className="mt-3 text-3xl font-extrabold text-slate-900">
              {lowongan.length}
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Lowongan yang sedang dibuka
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Akun sekolah</p>
              <span className="rounded-xl bg-cyan-50 p-3 text-xl">⌂</span>
            </div>
            <h3 className="mt-3 text-lg font-bold text-slate-900">
              {user.fullName}
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Pengajuan dilakukan atas nama sekolah
            </p>
          </div>
        </div>

        {/* DAFTAR LOWONGAN */}
        <div>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">
                Daftar Lowongan PKL
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Pilih perusahaan atau instansi tujuan.
              </p>
            </div>
          </div>

          {lowongan.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-3xl">
                ▤
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-800">
                Belum Ada Lowongan PKL
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Saat ini belum ada perusahaan atau instansi yang membuka
                lowongan PKL. Silakan periksa kembali nanti.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              {lowongan.map((item) => (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="h-2 bg-gradient-to-r from-blue-600 to-cyan-400" />

                  <div className="p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-extrabold text-slate-900">
                          {item.judul}
                        </h3>
                        <p className="mt-1 text-sm font-semibold text-blue-600">
                          {item.nama_instansi}
                        </p>
                      </div>

                      <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                        Dibuka
                      </span>
                    </div>

                    <div className="mt-5 space-y-3 text-sm text-slate-600">
                      <p>
                        <span className="mr-2">📍</span>
                        {item.lokasi || "Lokasi belum dicantumkan"}
                      </p>

                      <p>
                        <span className="mr-2">👥</span>
                        Kuota: {item.kuota} peserta
                      </p>

                      <p>
                        <span className="mr-2">🎓</span>
                        Jurusan: {item.jurusan || "Semua jurusan"}
                      </p>
                    </div>

                    {item.deskripsi && (
                      <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-500">
                        {item.deskripsi}
                      </p>
                    )}

                    {item.persyaratan && (
                      <div className="mt-4 rounded-xl bg-slate-50 p-4">
                        <p className="text-xs font-bold text-slate-700">
                          Persyaratan
                        </p>
                        <p className="mt-2 whitespace-pre-line text-xs leading-6 text-slate-500">
                          {item.persyaratan}
                        </p>
                      </div>
                    )}

                    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
                      <p className="text-xs text-slate-400">
                        Program Praktik Kerja Lapangan
                      </p>

                      <Link
                        href={`/sekolah/pengajuan-pkl/${item.id}`}
                        className="rounded-xl bg-gradient-to-r from-blue-700 to-cyan-600 px-5 py-3 text-sm font-bold text-white shadow-md transition hover:shadow-lg"
                      >
                        Ajukan Siswa →
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
