import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { sql } from "@/lib/db";
import RefreshStatus from "./RefreshStatus";
import HapusPengajuanButton from "./HapusPengajuanButton";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Pengajuan = {
  id: number;
  judul: string;
  nama_instansi: string;
  lokasi: string | null;
  status: string;
  catatan_mitra: string | null;
  tanggal_mulai: string | null;
  created_at: string;
  jumlah_siswa: number;
};

function statusStyle(status: string) {
  switch (status?.trim().toUpperCase()) {
    case "DISETUJUI":
      return "bg-emerald-100 text-emerald-700";

    case "DITOLAK":
      return "bg-red-100 text-red-700";

    default:
      return "bg-amber-100 text-amber-700";
  }
}

function statusLabel(status: string) {
  switch (status?.trim().toUpperCase()) {
    case "DISETUJUI":
      return "Disetujui";

    case "DITOLAK":
      return "Ditolak";

    default:
      return "Menunggu";
  }
}

function formatTanggal(value: string | null) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
}

export default async function StatusPengajuanPage() {
  const user = await requireRole("school");

  if (!user) {
    redirect("/login");
  }

  const result = await sql`
    SELECT
      p.id,
      l.judul,
      l.nama_instansi,
      l.lokasi,
      p.status,
      p.catatan_mitra,
      p.tanggal_mulai,
      p.created_at,
      COUNT(d.id)::int AS jumlah_siswa
    FROM pengajuan_pkl p
    INNER JOIN lowongan_pkl l
      ON l.id = p.lowongan_id
    LEFT JOIN detail_pengajuan_pkl d
      ON d.pengajuan_id = p.id
    WHERE p.school_id = ${user.schoolId}
    GROUP BY
      p.id,
      l.judul,
      l.nama_instansi,
      l.lokasi,
      p.status,
      p.catatan_mitra,
      p.tanggal_mulai,
      p.created_at
    ORDER BY p.created_at DESC
  `;

  const pengajuan = result as Pengajuan[];

  const total = pengajuan.length;

  const menunggu = pengajuan.filter(
    (item) =>
      !["DISETUJUI", "DITOLAK"].includes(
        item.status?.trim().toUpperCase()
      )
  ).length;

  const disetujui = pengajuan.filter(
    (item) =>
      item.status?.trim().toUpperCase() === "DISETUJUI"
  ).length;

  const ditolak = pengajuan.filter(
    (item) =>
      item.status?.trim().toUpperCase() === "DITOLAK"
  ).length;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-800 md:px-8">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-[#0b1f4d] via-[#0f2f6b] to-[#16478a] p-7 shadow-xl shadow-blue-900/20 md:p-8">

          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">

            <div>
              <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-300">
                <span className="h-2 w-2 rounded-full bg-cyan-400" />
                PORTAL SEKOLAH
              </p>

              <h1 className="mt-3 text-3xl font-black text-white md:text-4xl">
                Status Pengajuan PKL
              </h1>

              <p className="mt-2 text-sm text-blue-100/80">
                Pantau perkembangan pengajuan PKL dan keputusan dari mitra.
              </p>

              {/* Breadcrumb */}
              <nav className="mt-5 flex items-center gap-2 text-xs text-blue-100/70">
                <Link href="/sekolah" className="hover:text-white">
                  Dashboard
                </Link>
                <span>/</span>
                <span className="font-bold text-cyan-300">
                  Status Pengajuan
                </span>
              </nav>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Badge jumlah */}
              <div className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur">
                <span>📋</span>
                {total} pengajuan
              </div>

              <RefreshStatus />
            </div>

          </div>
        </div>

        {/* STATISTIK */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Total Pengajuan",
              value: total,
              color: "text-slate-900",
              icon: "📋",
            },
            {
              label: "Menunggu",
              value: menunggu,
              color: "text-amber-600",
              icon: "⏳",
            },
            {
              label: "Disetujui",
              value: disetujui,
              color: "text-emerald-600",
              icon: "✓",
            },
            {
              label: "Ditolak",
              value: ditolak,
              color: "text-red-600",
              icon: "✕",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">
                  {item.label}
                </p>

                <span className="text-xl">{item.icon}</span>
              </div>

              <p className={`mt-3 text-3xl font-black ${item.color}`}>
                {item.value}
              </p>
            </div>
          ))}
        </div>

        {/* RIWAYAT PENGAJUAN */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5">
            <h2 className="text-lg font-bold text-slate-900">
              Riwayat Pengajuan
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Daftar seluruh pengajuan PKL sekolah Anda.
            </p>
          </div>

          {pengajuan.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-3xl">
                📋
              </div>

              <h3 className="mt-5 text-lg font-bold text-slate-800">
                Belum Ada Pengajuan
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                Sekolah Anda belum mengirim pengajuan PKL. Silakan cari
                lowongan dan ajukan peserta didik terlebih dahulu.
              </p>

              <Link
                href="/lowongan-pkl"
                className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700"
              >
                Cari Lowongan PKL
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pengajuan.map((item) => {
                const status = item.status?.trim().toUpperCase();

                return (
                  <article
                    key={item.id}
                    className="p-6"
                  >
                    <div className="flex flex-col justify-between gap-4 md:flex-row">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyle(item.status)}`}
                          >
                            {statusLabel(item.status)}
                          </span>

                          <span className="text-xs text-slate-400">
                            Pengajuan #{item.id}
                          </span>
                        </div>

                        <h3 className="mt-3 text-lg font-bold text-slate-900">
                          {item.judul}
                        </h3>

                        <p className="mt-1 font-medium text-blue-700">
                          {item.nama_instansi}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
                          <span>
                            📍 {item.lokasi || "Lokasi tidak tersedia"}
                          </span>

                          <span>
                            👥 {item.jumlah_siswa} siswa diajukan
                          </span>

                          <span>
                            📅 {formatTanggal(item.created_at)}
                          </span>
                        </div>

                        {item.tanggal_mulai && (
                          <p className="mt-2 text-sm text-slate-500">
                            Tanggal mulai PKL:{" "}
                            {formatTanggal(item.tanggal_mulai)}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* TOMBOL HAPUS */}
                    <HapusPengajuanButton
                      pengajuanId={item.id}
                      status={item.status}
                    />

                    {/* CATATAN PENOLAKAN */}
                    {status === "DITOLAK" && (
                      <div className="mt-5 rounded-xl border border-red-100 bg-red-50 p-4">
                        <p className="text-sm font-bold text-red-700">
                          Catatan Penolakan
                        </p>

                        <p className="mt-1 text-sm text-red-600">
                          {item.catatan_mitra ||
                            "Tidak ada catatan penolakan dari Admin."}
                        </p>
                      </div>
                    )}

                    {/* INFORMASI DISETUJUI */}
                    {status === "DISETUJUI" && (
                      <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                        <p className="text-sm font-semibold text-emerald-700">
                          ✓ Pengajuan telah disetujui. Silakan pantau
                          pelaksanaan PKL peserta didik.
                        </p>
                      </div>
                    )}

                    {/* INFORMASI MENUNGGU */}
                    {status !== "DISETUJUI" && status !== "DITOLAK" && (
                      <div className="mt-5 rounded-xl border border-amber-100 bg-amber-50 p-4">
                        <p className="text-sm font-semibold text-amber-700">
                          Pengajuan sedang menunggu keputusan Admin.
                        </p>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <p className="mt-5 text-center text-xs text-slate-400">
          Klik tombol Perbarui Status untuk mengambil data pengajuan terbaru.
        </p>
      </div>
    </main>
  );
}