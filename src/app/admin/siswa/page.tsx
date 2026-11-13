import { redirect } from "next/navigation";
import Link from "next/link";
import { sql } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import StudentTable from "./StudentTable";

export const dynamic = "force-dynamic";

export default async function AdminStudentsPage() {
  const admin = await requireRole("admin");

  if (!admin) {
    redirect("/login");
  }

  const students = await sql`
    SELECT
      u.id,
      u.full_name,
      u.email,
      u.is_active,
      u.created_at,
      sp.nisn,
      sp.class_name,
      sp.major,
      sp.phone,
      s.school_name
    FROM users u
    LEFT JOIN student_profiles sp
      ON sp.user_id = u.id
    LEFT JOIN schools s
      ON s.id = u.school_id
    WHERE u.role = 'student'
    ORDER BY u.created_at DESC
  `;

  const studentData = students.map((student) => ({
    id: Number(student.id),
    fullName: student.full_name || "-",
    email: student.email || "-",
    nisn: student.nisn || "-",
    className: student.class_name || "-",
    major: student.major || "-",
    phone: student.phone || "-",
    schoolName: student.school_name || "Belum terhubung",
    isActive: Boolean(student.is_active),
    createdAt: student.created_at
      ? new Date(student.created_at).toISOString()
      : "",
  }));

  const totalStudents = studentData.length;

  const activeStudents = studentData.filter(
    (student) => student.isActive
  ).length;

  const inactiveStudents = totalStudents - activeStudents;

  return (
    <main className="min-h-screen bg-[#f4f7fc] px-5 py-8 md:px-10">
      <div className="mx-auto max-w-7xl">

        {/* KOTAK HEADER (navy, sama gaya dengan Data Sekolah) */}
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
                Data Siswa
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100/80">
                Kelola dan pantau seluruh data siswa yang terdaftar
                dalam platform STRIDE.
              </p>

              <nav
                aria-label="Breadcrumb"
                className="mt-4 flex items-center gap-2 text-xs text-blue-100/70"
              >
                <Link href="/admin" className="transition hover:text-white">
                  Dashboard
                </Link>
                <span>/</span>
                <span className="font-semibold text-cyan-300">Data Siswa</span>
              </nav>
            </div>

            <Link
              href="/admin/siswa/tambah"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-[#0A1F44] shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:bg-cyan-300"
            >
              <span className="text-lg leading-none">+</span>
              Tambah Siswa
            </Link>
          </div>
        </div>

        {/* STATISTIK */}
        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-3">

          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  Total Siswa
                </p>
                <h2 className="mt-2 text-3xl font-extrabold text-slate-800">
                  {totalStudents.toLocaleString("id-ID")}
                </h2>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl">
                🎓
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  Akun Aktif
                </p>
                <h2 className="mt-2 text-3xl font-extrabold text-emerald-600">
                  {activeStudents.toLocaleString("id-ID")}
                </h2>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-2xl">
                ✓
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  Akun Tidak Aktif
                </p>
                <h2 className="mt-2 text-3xl font-extrabold text-rose-600">
                  {inactiveStudents.toLocaleString("id-ID")}
                </h2>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-2xl">
                !
              </div>
            </div>
          </div>

        </div>

        {/* TABEL SISWA */}
        <StudentTable students={studentData} />

      </div>
    </main>
  );
}