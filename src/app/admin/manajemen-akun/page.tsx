import { redirect } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { sql } from "@/lib/db";
import ManajemenAkunTable from "./ManajemenAkunTable";

export const dynamic = "force-dynamic";

type Account = {
  id: number;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
  school_name: string | null;
  created_at: string | Date;
};

export default async function ManajemenAkunPage() {
  const user = await requireRole("admin");

  if (!user) redirect("/login");

  const result = await sql`
    SELECT
      u.id,
      u.full_name,
      u.email,
      u.role,
      u.is_active,
      s.school_name,
      u.created_at
    FROM users u
    LEFT JOIN schools s ON s.id = u.school_id
    ORDER BY u.created_at DESC
  `;

  const accounts = result as Account[];

  const total = accounts.length;
  const active = accounts.filter((a) => a.is_active).length;
  const inactive = total - active;
  const admins = accounts.filter((a) => a.role === "admin").length;
  const schools = accounts.filter((a) => a.role === "school").length;
  const students = accounts.filter((a) => a.role === "student").length;

  const statistics = [
    {
      title: "Total Akun",
      value: total,
      icon: "👥",
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Akun Aktif",
      value: active,
      icon: "✓",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      title: "Akun Nonaktif",
      value: inactive,
      icon: "⊘",
      color: "text-red-600",
      bg: "bg-red-50",
    },
    {
      title: "Admin",
      value: admins,
      icon: "🛡",
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  const accountTypes = [
    {
      label: "Guru / Sekolah",
      value: schools,
      color: "bg-blue-500",
    },
    {
      label: "Siswa",
      value: students,
      color: "bg-cyan-500",
    },
    {
      label: "Admin",
      value: admins,
      color: "bg-purple-500",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-7">

        {/* KOTAK HEADER (navy) */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0A1F44] via-[#0F2A5F] to-[#1A4A8C] p-6 text-white shadow-xl shadow-blue-900/20 md:p-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl"
          />

          <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-cyan-300">
                <span className="h-2 w-2 rounded-full bg-cyan-400" />
                STRIDE ADMINISTRATOR
              </p>

              <h1 className="mt-3 text-3xl font-extrabold md:text-4xl">
                Manajemen Akun
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100/80">
                Kelola seluruh akun pengguna dalam sistem STRIDE.
              </p>

              <nav
                aria-label="Breadcrumb"
                className="mt-4 flex items-center gap-2 text-xs text-blue-100/70"
              >
                <Link href="/admin" className="transition hover:text-white">
                  Dashboard
                </Link>
                <span>/</span>
                <span className="font-semibold text-cyan-300">
                  Manajemen Akun
                </span>
              </nav>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-blue-50 backdrop-blur">
                <span className="mr-2 text-lg">👥</span>
                {total} akun terdaftar
              </div>

              <Link
                href="/admin/manajemen-akun/tambah"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-[#0A1F44] shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:bg-cyan-300"
              >
                <span className="text-lg leading-none">+</span>
                Tambah Akun
              </Link>
            </div>
          </div>
        </div>

        {/* STATISTIK */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {statistics.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">
                  {item.title}
                </p>

                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.bg} ${item.color}`}
                >
                  {item.icon}
                </div>
              </div>

              <p className="mt-3 text-3xl font-extrabold text-slate-800">
                {item.value.toLocaleString("id-ID")}
              </p>
            </div>
          ))}
        </div>

        {/* RINGKASAN */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-bold text-slate-800">
              Jenis Akun
            </h2>

            <div className="mt-5 space-y-5">
              {accountTypes.map((item) => (
                <div key={item.label}>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-slate-600">
                      {item.label}
                    </span>

                    <span className="font-bold text-slate-800">
                      {item.value}
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${item.color}`}
                      style={{
                        width: `${
                          total ? (item.value / total) * 100 : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-bold text-slate-800">
              Informasi Manajemen Akun
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Admin dapat membuat dan mengelola akun pengguna
              melalui halaman ini.
            </p>

            <div className="mt-4 space-y-3 text-sm">
              <p className="flex items-center gap-2 text-blue-700">
                <span>✏️</span> Edit informasi dan password akun
              </p>

              <p className="flex items-center gap-2 text-amber-700">
                <span>⏸</span> Aktifkan atau nonaktifkan akun
              </p>

              <p className="flex items-center gap-2 text-red-700">
                <span>🗑</span> Hapus akun secara permanen
              </p>
            </div>
          </div>
        </div>

        {/* TABEL AKUN */}
        <ManajemenAkunTable accounts={accounts} />

      </div>
    </main>
  );
}