import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { sql } from "@/lib/db";
import PengajuanAdminActions from "./PengajuanAdminActions";

export const dynamic = "force-dynamic";

type Pengajuan = {
  id: number;
  status: string;
  created_at: string | Date;
  tanggal_mulai: string | Date | null;
  tanggal_selesai: string | Date | null;
  nama_guru_pembimbing: string | null;
  surat_pengajuan_url: string | null;
  surat_pengajuan_nama: string | null;
  pesan: string | null;
  nama_sekolah: string;
  nama_lowongan: string;
  nama_instansi: string;
  lokasi: string | null;
  nama_siswa: string[];
};

function formatTanggal(value: string | Date | null) {
  if (!value) return "-";

  const date = new Date(value);

  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatBulan(value: string | Date | null) {
  if (!value) return "-";

  const date = new Date(value);

  return date.toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function AdminPengajuanPKLPage() {
  const user = await requireRole("admin");

  if (!user) redirect("/login");

  const data = (await sql`
    SELECT
      p.id,
      p.status,
      p.created_at,
      p.tanggal_mulai,
      p.tanggal_selesai,
      p.nama_guru_pembimbing,
      p.surat_pengajuan_url,
      p.surat_pengajuan_nama,
      p.pesan,
      s.school_name AS nama_sekolah,
      l.judul AS nama_lowongan,
      l.nama_instansi,
      l.lokasi,
      COALESCE(
        ARRAY_AGG(DISTINCT u.full_name)
        FILTER (WHERE u.full_name IS NOT NULL),
        ARRAY[]::text[]
      ) AS nama_siswa
    FROM pengajuan_pkl p
    LEFT JOIN schools s ON s.id = p.school_id
    LEFT JOIN lowongan_pkl l ON l.id = p.lowongan_id
    LEFT JOIN detail_pengajuan_pkl d ON d.pengajuan_id = p.id
    LEFT JOIN users u ON u.id = d.student_user_id
    GROUP BY
      p.id,
      p.status,
      p.created_at,
      p.tanggal_mulai,
      p.tanggal_selesai,
      p.nama_guru_pembimbing,
      p.surat_pengajuan_url,
      p.surat_pengajuan_nama,
      p.pesan,
      s.school_name,
      l.judul,
      l.nama_instansi,
      l.lokasi
    ORDER BY p.created_at DESC
  `) as Pengajuan[];

  const menunggu = data.filter((item) => item.status === "MENUNGGU").length;
  const disetujui = data.filter((item) => item.status === "DISETUJUI").length;
  const ditolak = data.filter((item) => item.status === "DITOLAK").length;

  return (
    <main className="min-h-screen bg-slate-50 p-4 text-slate-800 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-[#07152f] via-blue-900 to-cyan-700 p-6 text-white shadow-xl sm:p-8">
          <p className="text-xs font-bold tracking-[0.25em] text-cyan-200">
            SISTEM INFORMASI PKL
          </p>

          <h1 className="mt-3 text-2xl font-extrabold sm:text-3xl">
            Pengajuan PKL
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
            Kelola pengajuan peserta Praktik Kerja Lapangan dari sekolah.
            Periksa data siswa, periode PKL, dan surat pengajuan sebelum
            memberikan keputusan.
          </p>

          <Link
            href="/admin"
            className="mt-5 inline-flex rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            Kembali ke Dashboard
          </Link>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total Pengajuan</p>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">
              {data.length}
            </p>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <p className="text-sm text-amber-700">Menunggu</p>
            <p className="mt-2 text-3xl font-extrabold text-amber-800">
              {menunggu}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-sm text-emerald-700">Disetujui</p>
            <p className="mt-2 text-3xl font-extrabold text-emerald-800">
              {disetujui}
            </p>
          </div>

          <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
            <p className="text-sm text-red-700">Ditolak</p>
            <p className="mt-2 text-3xl font-extrabold text-red-800">
              {ditolak}
            </p>
          </div>
        </div>

        <section className="mt-7">
          <div className="mb-4">
            <h2 className="text-xl font-extrabold text-slate-900">
              Daftar Pengajuan dari Sekolah
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Periksa setiap pengajuan sebelum menyetujui atau menolaknya.
            </p>
          </div>

          {data.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <div className="text-4xl">📋</div>
              <h3 className="mt-3 font-bold text-slate-800">
                Belum ada pengajuan PKL
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Pengajuan dari sekolah akan tampil di halaman ini.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {data.map((item) => (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
                    <div>
                      <p className="text-xs font-bold tracking-wider text-blue-600">
                        PENGAJUAN #{item.id}
                      </p>
                      <h3 className="mt-1 text-lg font-extrabold text-slate-900">
                        {item.nama_sekolah || "Sekolah tidak diketahui"}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Dikirim {formatTanggal(item.created_at)}
                      </p>
                    </div>

                    <span
                      className={`w-fit rounded-full px-4 py-2 text-xs font-extrabold ${
                        item.status === "MENUNGGU"
                          ? "bg-amber-100 text-amber-800"
                          : item.status === "DISETUJUI"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="grid gap-5 p-5 lg:grid-cols-2">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Informasi Pengajuan
                      </p>

                      <div className="mt-3 space-y-3 text-sm">
                        <div>
                          <p className="text-slate-500">Lowongan PKL</p>
                          <p className="font-bold text-slate-800">
                            {item.nama_lowongan || "-"}
                          </p>
                        </div>

                        <div>
                          <p className="text-slate-500">Instansi Tujuan</p>
                          <p className="font-semibold text-slate-800">
                            {item.nama_instansi || "-"}
                          </p>
                          <p className="text-slate-500">{item.lokasi || ""}</p>
                        </div>

                        <div>
                          <p className="text-slate-500">Guru Pembimbing</p>
                          <p className="font-semibold text-slate-800">
                            {item.nama_guru_pembimbing || "-"}
                          </p>
                        </div>

                        <div>
                          <p className="text-slate-500">Periode PKL</p>
                          <p className="font-semibold text-slate-800">
                            {formatBulan(item.tanggal_mulai)} –{" "}
                            {formatBulan(item.tanggal_selesai)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Peserta yang Diajukan ({item.nama_siswa?.length || 0})
                      </p>

                      <div className="mt-3 max-h-48 space-y-2 overflow-y-auto">
                        {item.nama_siswa?.length ? (
                          item.nama_siswa.map((nama, index) => (
                            <div
                              key={`${item.id}-${index}`}
                              className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700"
                            >
                              {index + 1}. {nama}
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-slate-400">
                            Data siswa tidak tersedia.
                          </p>
                        )}
                      </div>

                      <div className="mt-4">
                        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                          Surat Pengajuan
                        </p>

                        {item.surat_pengajuan_url ? (
                          <a
                            href={item.surat_pengajuan_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700 hover:bg-blue-100"
                          >
                            <span>📄</span>
                            {item.surat_pengajuan_nama || "Lihat Surat PDF"}
                          </a>
                        ) : (
                          <p className="text-sm text-red-500">
                            Surat belum tersedia.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {item.pesan && (
                    <div className="mx-5 mb-5 rounded-xl bg-slate-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Pesan dari Sekolah
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                        {item.pesan}
                      </p>
                    </div>
                  )}

                  <PengajuanAdminActions
                    id={item.id}
                    status={item.status}
                  />
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}