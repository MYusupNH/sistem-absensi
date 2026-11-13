import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import KetidakhadiranTable from "./KetidakhadiranTable";

export const dynamic = "force-dynamic";

export default async function SchoolKetidakhadiranPage() {
  const user = await requireRole("school");

  if (!user) redirect("/login");
  if (!user.schoolId) redirect("/sekolah");

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-5 md:p-8">
      {/* HEADER */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0b1f4d] via-[#0f2f6b] to-[#16478a] p-7 shadow-xl shadow-blue-900/20 md:p-8">

        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">

          <div>
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-300">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              PEMANTAUAN SISWA
            </p>

            <h1 className="mt-3 text-3xl font-black text-white md:text-4xl">
              Ketidakhadiran Siswa
            </h1>

            <p className="mt-2 text-sm text-blue-100/80">
              Periksa pengajuan izin dan sakit siswa PKL dari sekolah Anda.
            </p>

            {/* Breadcrumb */}
            <nav className="mt-5 flex items-center gap-2 text-xs text-blue-100/70">
              <a href="/sekolah" className="hover:text-white">
                Dashboard
              </a>
              <span>/</span>
              <span className="font-bold text-cyan-300">
                Ketidakhadiran
              </span>
            </nav>
          </div>

          {/* Badge */}
          <div className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur">
            <span>📝</span>
            Izin &amp; Sakit
          </div>

        </div>
      </header>

      <KetidakhadiranTable />
    </div>
  );
}