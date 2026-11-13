import Link from "next/link";
import { sql } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type School = {
  id: number;
  school_name: string;
  npsn: string | null;
  address: string | null;
  phone: string | null;
  created_at: string;
};

export default async function DataSekolahPage() {
  const user = await requireRole("admin");

  if (!user) redirect("/login");

  const schools = (await sql`
    SELECT
      id,
      school_name,
      npsn,
      address,
      phone,
      created_at
    FROM schools
    WHERE status = 'ACTIVE'
    ORDER BY created_at DESC
  `) as School[];

  return (
    <main className="min-h-screen bg-[#f4f7fc]">

      <section className="mx-auto max-w-7xl px-5 py-8 md:px-10">

        {/* KOTAK HEADER (navy) */}
        <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-[#0A1F44] via-[#0F2A5F] to-[#1A4A8C] p-6 text-white shadow-xl shadow-blue-900/20 md:p-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl"
          />

          <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-cyan-300">
                <span className="h-2 w-2 rounded-full bg-cyan-400" />
                STRIDE ADMINISTRATOR
              </p>

              <h1 className="mt-3 text-3xl font-extrabold md:text-4xl">
                Data Sekolah
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100/80">
                Kelola dan pantau informasi sekolah yang telah terdaftar
                serta terverifikasi dalam sistem STRIDE.
              </p>

              <nav
                aria-label="Breadcrumb"
                className="mt-4 flex items-center gap-2 text-xs text-blue-100/70"
              >
                <Link href="/admin" className="transition hover:text-white">
                  Dashboard
                </Link>
                <span>/</span>
                <span className="font-semibold text-cyan-300">Data Sekolah</span>
              </nav>
            </div>

            <Link
              href="/admin/sekolah/tambah"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-[#0A1F44] shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:bg-cyan-300"
            >
              <span className="text-lg leading-none">+</span>
              Tambah Sekolah
            </Link>
          </div>
        </div>

        {/* STATISTIK */}
        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2">

          {/* TOTAL SEKOLAH */}
          <div className="group rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Sekolah Aktif
                </p>

                <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-800">
                  {schools.length}
                </h2>

                <p className="mt-2 text-xs text-slate-400">
                  Sekolah yang telah terverifikasi
                </p>
              </div>

              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-100 text-3xl transition group-hover:scale-110">
                🏫
              </div>
            </div>

            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full w-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400" />
            </div>
          </div>

          {/* STATUS */}
          <div className="group rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Status Data
                </p>

                <h2 className="mt-3 text-2xl font-extrabold text-emerald-600">
                  Terverifikasi
                </h2>

                <p className="mt-2 text-xs text-slate-400">
                  Data sekolah dengan status ACTIVE
                </p>
              </div>

              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-3xl transition group-hover:scale-110">
                ✓
              </div>
            </div>

            <div className="mt-5 flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />

              <span className="text-xs font-semibold text-emerald-600">
                Sistem data sekolah aktif
              </span>
            </div>
          </div>

        </div>

        {/* TABEL SEKOLAH */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm">

          {/* TABLE HEADER */}
          <div className="flex flex-col justify-between gap-4 border-b border-slate-100 px-6 py-6 sm:flex-row sm:items-center">

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-xl">
                📋
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  Daftar Sekolah
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Informasi sekolah yang telah terdaftar dan aktif.
                </p>
              </div>
            </div>

            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {schools.length} Sekolah Aktif
            </span>

          </div>

          {/* EMPTY STATE */}
          {schools.length === 0 ? (
            <div className="px-6 py-20 text-center">

              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-50 text-4xl">
                🏫
              </div>

              <h3 className="mt-5 text-lg font-bold text-slate-700">
                Belum Ada Data Sekolah
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-400">
                Sekolah yang telah mendaftar dan mendapatkan verifikasi
                Admin akan ditampilkan di halaman ini.
              </p>

              <Link
                href="/admin/sekolah/tambah"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-800"
              >
                + Tambah Sekolah Pertama
              </Link>

            </div>
          ) : (

            /* TABLE CONTENT */
            <div className="overflow-x-auto">

              <table className="w-full min-w-[750px] text-left text-sm">

                <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-5">No.</th>
                    <th className="px-6 py-5">Nama Sekolah</th>
                    <th className="px-6 py-5">NPSN</th>
                    <th className="px-6 py-5">Telepon</th>
                    <th className="px-6 py-5">Tanggal Daftar</th>
                    <th className="px-6 py-5">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">

                  {schools.map((school, index) => (
                    <tr
                      key={school.id}
                      className="group transition-colors hover:bg-blue-50/40"
                    >

                      {/* NOMOR */}
                      <td className="px-6 py-5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-500 transition group-hover:bg-blue-100 group-hover:text-blue-700">
                          {index + 1}
                        </span>
                      </td>

                      {/* NAMA SEKOLAH */}
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 text-xl">
                            🏫
                          </div>

                          <div className="min-w-0">
                            <p className="font-bold text-slate-800">
                              {school.school_name}
                            </p>

                            <p className="mt-1 max-w-[230px] truncate text-xs text-slate-400">
                              {school.address || "Alamat belum diisi"}
                            </p>
                          </div>

                        </div>
                      </td>

                      {/* NPSN */}
                      <td className="px-6 py-5">
                        <span className="rounded-lg bg-blue-50 px-3 py-2 font-mono text-xs font-semibold text-blue-700">
                          {school.npsn || "-"}
                        </span>
                      </td>

                      {/* TELEPON */}
                      <td className="px-6 py-5 text-slate-600">
                        {school.phone || "-"}
                      </td>

                      {/* TANGGAL */}
                      <td className="whitespace-nowrap px-6 py-5 text-slate-600">
                        {new Date(school.created_at).toLocaleDateString(
                          "id-ID",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            timeZone: "Asia/Jakarta",
                          }
                        )}
                      </td>

                      {/* STATUS */}
                      <td className="px-6 py-5">
                        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Aktif
                        </span>
                      </td>

                    </tr>
                  ))}

                </tbody>
              </table>

            </div>
          )}

        </div>

        {/* FOOTER */}
        <footer className="mt-8 border-t border-slate-200 py-6 text-center">
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()}{" "}
            <span className="font-bold text-blue-700">STRIDE</span>
            {" "}— Sistem Informasi Praktik Kerja Lapangan
          </p>
        </footer>

      </section>
    </main>
  );
}