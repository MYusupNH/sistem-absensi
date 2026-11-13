import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

type Attendance = {
  id: number | null;
  full_name: string;
  nisn: string | null;
  class_name: string | null;
  major: string | null;
  tanggal: string | Date | null;
  jam_masuk: string | Date | null;
  jam_keluar: string | Date | null;
  jarak_meter: number | null;
};

function formatTanggal(value: string | Date | null) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
}

function formatJam(value: string | Date | null) {
  if (!value) return "-";

  if (value instanceof Date) {
    return value.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Jakarta",
    });
  }

  const jam = String(value);

  if (jam.includes("T")) {
    const date = new Date(jam);

    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Asia/Jakarta",
      });
    }
  }

  return jam.substring(0, 5);
}

export default async function SchoolAttendancePage() {
  const user = await requireRole("school");

  if (!user) redirect("/login");
  if (!user.schoolId) redirect("/sekolah");

  const data = (await sql`
    SELECT
      a.id,
      u.full_name,
      sp.nisn,
      sp.class_name,
      sp.major,
      a.tanggal,
      a.jam_masuk,
      a.jam_keluar,
      a.jarak_meter
    FROM users u
    LEFT JOIN student_profiles sp
      ON sp.user_id = u.id
    LEFT JOIN absensi_pkl a
      ON a.student_user_id = u.id
    WHERE u.school_id = ${user.schoolId}
      AND u.role = 'student'
      AND u.is_active = true
    ORDER BY
      a.tanggal DESC NULLS LAST,
      a.jam_masuk DESC NULLS LAST,
      u.full_name ASC
  `) as Attendance[];

  const totalSiswa = new Set(
    data.map((item) => item.full_name)
  ).size;

  const totalHadir = data.filter(
    (item) => item.id !== null
  ).length;

  const belumPulang = data.filter(
    (item) => item.id !== null && item.jam_masuk && !item.jam_keluar
  ).length;

  return (
    <main className="min-h-screen bg-[#f4f7fc] p-5 md:p-8">
      <div className="mx-auto max-w-7xl space-y-7">

        {/* HEADER */}
        <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0b1f4d] via-[#0f2f6b] to-[#16478a] p-7 shadow-xl shadow-blue-900/20 md:p-8">

          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">

            <div>
              <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-300">
                <span className="h-2 w-2 rounded-full bg-cyan-400" />
                PEMANTAUAN PKL
              </p>

              <h1 className="mt-3 text-3xl font-black text-white md:text-4xl">
                Absensi Siswa
              </h1>

              <p className="mt-2 text-sm text-blue-100/80">
                Pantau catatan kehadiran dan kepulangan seluruh siswa PKL
                dari sekolah Anda.
              </p>

              {/* Breadcrumb */}
              <nav className="mt-5 flex items-center gap-2 text-xs text-blue-100/70">
                <a href="/sekolah" className="hover:text-white">
                  Dashboard
                </a>
                <span>/</span>
                <span className="font-bold text-cyan-300">
                  Absensi Siswa
                </span>
              </nav>
            </div>

            {/* Badge jumlah */}
            <div className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur">
              <span>🕒</span>
              {totalSiswa} siswa
            </div>

          </div>
        </header>

        {/* STATISTIK */}
        <section className="grid gap-4 sm:grid-cols-3">

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Total Siswa
            </p>

            <p className="mt-3 text-3xl font-extrabold text-slate-800">
              {totalSiswa}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Total Catatan Absensi
            </p>

            <p className="mt-3 text-3xl font-extrabold text-blue-600">
              {totalHadir}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Belum Absen Pulang
            </p>

            <p className="mt-3 text-3xl font-extrabold text-amber-500">
              {belumPulang}
            </p>
          </div>

        </section>

        {/* TABEL ABSENSI */}
        <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">

          <div className="border-b border-slate-100 px-6 py-5">
            <h2 className="text-lg font-bold text-slate-800">
              Riwayat Kehadiran Siswa
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Data absensi masuk dan pulang yang dikirim melalui akun siswa.
            </p>
          </div>

          {data.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-400">
              Belum ada siswa aktif atau data absensi.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px] text-left text-sm">

                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Siswa</th>
                    <th className="px-5 py-4">NISN</th>
                    <th className="px-5 py-4">Kelas / Jurusan</th>
                    <th className="px-5 py-4">Tanggal</th>
                    <th className="px-5 py-4">Jam Masuk</th>
                    <th className="px-5 py-4">Jam Pulang</th>
                    <th className="px-5 py-4">Jarak GPS</th>
                    <th className="px-5 py-4">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {data.map((item, index) => {
                    const status = !item.id
                      ? "BELUM ABSEN"
                      : !item.jam_keluar
                      ? "BELUM PULANG"
                      : "SELESAI";

                    return (
                      <tr
                        key={item.id ?? `student-${item.full_name}-${index}`}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="px-5 py-4 font-semibold text-slate-800">
                          {item.full_name}
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          {item.nisn || "-"}
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          {item.class_name || "-"}

                          <span className="block text-xs text-slate-400">
                            {item.major || "-"}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          {formatTanggal(item.tanggal)}
                        </td>

                        <td className="px-5 py-4 font-medium text-blue-700">
                          {formatJam(item.jam_masuk)}
                        </td>

                        <td className="px-5 py-4 font-medium text-emerald-700">
                          {formatJam(item.jam_keluar)}
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          {item.jarak_meter !== null
                            ? `${Math.round(Number(item.jarak_meter))} m`
                            : "-"}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                              status === "SELESAI"
                                ? "bg-emerald-50 text-emerald-700"
                                : status === "BELUM PULANG"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

              </table>
            </div>
          )}

          <div className="border-t border-slate-100 px-6 py-4 text-xs text-slate-400">
            Menampilkan {data.length} catatan absensi siswa.
          </div>

        </section>

      </div>
    </main>
  );
}