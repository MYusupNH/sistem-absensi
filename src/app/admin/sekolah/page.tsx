
import Link from "next/link";
import { sql } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { redirect } from "next/navigation";
import SekolahList from "./SekolahList";

export const dynamic = "force-dynamic";

type School = {
  id: number;
  school_name: string;
  npsn: string | null;
  address: string | null;
  phone: string | null;
  created_at: string;
  status: string | null;
};

export default async function DataSekolahPage() {
  const user = await requireRole("admin");

  if (!user) redirect("/login");

  // Hanya mengambil sekolah yang tidak berstatus INACTIVE
  const schools = (await sql`
    SELECT
      id,
      school_name,
      npsn,
      address,
      phone,
      created_at,
      status
    FROM schools
    WHERE status IS NULL
       OR UPPER(TRIM(status)) <> 'INACTIVE'
    ORDER BY created_at DESC
  `) as School[];

  return (
    <main className="min-h-screen bg-[#f4f7fc]">
      <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-5 sm:py-8 md:px-10">

        {/* HEADER */}
        <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-[#0A1F44] via-[#0F2A5F] to-[#1A4A8C] p-5 text-white shadow-xl shadow-blue-900/20 sm:mb-8 sm:rounded-3xl sm:p-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl"
          />

          <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-cyan-300 sm:text-xs">
                <span className="h-2 w-2 rounded-full bg-cyan-400" />
                STRIDE ADMINISTRATOR
              </p>

              <h1 className="mt-3 text-2xl font-extrabold sm:text-3xl md:text-4xl">
                Data Sekolah
              </h1>

              <p className="mt-2 max-w-xl text-xs leading-6 text-blue-100/80 sm:text-sm">
                Kelola dan pantau informasi seluruh sekolah yang telah
                terdaftar dalam sistem STRIDE.
              </p>

              <nav
                aria-label="Breadcrumb"
                className="mt-4 flex flex-wrap items-center gap-2 text-xs text-blue-100/70"
              >
                <Link href="/admin" className="transition hover:text-white">
                  Dashboard
                </Link>

                <span>/</span>

                <span className="font-semibold text-cyan-300">
                  Data Sekolah
                </span>
              </nav>
            </div>

            <Link
              href="/admin/sekolah/tambah"
              className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-[#0A1F44] shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:bg-cyan-300 sm:w-auto"
            >
              <span className="text-lg leading-none">+</span>
              Tambah Sekolah
            </Link>
          </div>
        </div>

        {/* TOTAL SEKOLAH */}
        <div className="mb-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:mb-8 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Total Sekolah
              </p>

              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-800 sm:text-4xl">
                {schools.length}
              </h2>

              <p className="mt-2 text-xs text-slate-400">
                Jumlah sekolah yang terdaftar dalam sistem
              </p>
            </div>

            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-100 text-3xl sm:h-16 sm:w-16">
              🏫
            </div>
          </div>

          <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400" />
          </div>
        </div>

        {/* DAFTAR SEKOLAH */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-100 px-4 py-5 sm:flex-row sm:items-center sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xl">
                📋
              </div>

              <div>
                <h2 className="text-base font-bold text-slate-800 sm:text-lg">
                  Daftar Sekolah
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Informasi sekolah yang telah terdaftar.
                </p>
              </div>
            </div>

            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700">
              {schools.length} Sekolah
            </span>
          </div>

          <SekolahList schools={schools} />
        </div>

        {/* FOOTER */}
        <footer className="mt-8 border-t border-slate-200 py-6 text-center">
          <p className="text-xs leading-6 text-slate-400">
            © {new Date().getFullYear()}{" "}
            <span className="font-bold text-blue-700">STRIDE</span>
            {" "}— Sistem Informasi Praktik Kerja Lapangan
          </p>
        </footer>

      </section>
    </main>
  );
}
