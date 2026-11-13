
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SchoolPage() {
  const user = await requireRole("school");

  if (!user) redirect("/login");

  let schoolName = "Sekolah";
  let npsn = "-";
  let schoolStatus = "PENDING";
  let totalStudents = 0;
  let totalVacancies = 0;

  let applicationStats = [
    { status: "MENUNGGU", total: 0 },
    { status: "DISETUJUI", total: 0 },
    { status: "DITOLAK", total: 0 },
  ];

  try {
    if (user.schoolId) {
      const schoolRows = await sql`
        SELECT school_name, npsn, status
        FROM schools
        WHERE id = ${user.schoolId}
        LIMIT 1
      `;

      if (schoolRows.length > 0) {
        schoolName = String(schoolRows[0].school_name || "Sekolah");
        npsn = String(schoolRows[0].npsn || "-");
        schoolStatus = String(schoolRows[0].status || "PENDING");
      }

      const studentRows = await sql`
        SELECT COUNT(*)::int AS total
        FROM users
        WHERE school_id = ${user.schoolId}
          AND role = 'student'
          AND is_active = true
      `;

      totalStudents = Number(studentRows[0]?.total || 0);

      const applicationRows = await sql`
        SELECT
          status,
          COUNT(*)::int AS total
        FROM pengajuan_pkl
        WHERE school_id = ${user.schoolId}
        GROUP BY status
      `;

      applicationStats = applicationStats.map((item) => ({
        ...item,
        total: Number(
          applicationRows.find(
            (row) => String(row.status).toUpperCase() === item.status
          )?.total || 0
        ),
      }));
    }

    const vacancyRows = await sql`
      SELECT COUNT(*)::int AS total
      FROM lowongan_pkl
      WHERE status = 'DIBUKA'
    `;

    totalVacancies = Number(vacancyRows[0]?.total || 0);
  } catch (error) {
    console.error("GURU DASHBOARD ERROR:", error);
  }

  const statusLabel: Record<string, string> = {
    ACTIVE: "Aktif",
    PENDING: "Menunggu verifikasi",
    REJECTED: "Ditolak",
  };

  const schoolStatusLabel = statusLabel[schoolStatus] || schoolStatus;

  const statusStyle =
    schoolStatus === "ACTIVE"
      ? "bg-emerald-50 text-emerald-700"
      : schoolStatus === "REJECTED"
      ? "bg-red-50 text-red-700"
      : "bg-amber-50 text-amber-700";

  const totalApplications = applicationStats.reduce(
    (sum, item) => sum + item.total,
    0
  );

  const waiting = applicationStats.find(
    (item) => item.status === "MENUNGGU"
  )?.total || 0;

  const approved = applicationStats.find(
    (item) => item.status === "DISETUJUI"
  )?.total || 0;

  const rejected = applicationStats.find(
    (item) => item.status === "DITOLAK"
  )?.total || 0;

  const waitingPercentage =
    totalApplications > 0 ? (waiting / totalApplications) * 100 : 0;

  const approvedPercentage =
    totalApplications > 0 ? (approved / totalApplications) * 100 : 0;

  const rejectedPercentage =
    totalApplications > 0 ? (rejected / totalApplications) * 100 : 0;

  const waitingEnd = waitingPercentage;
  const approvedEnd = waitingPercentage + approvedPercentage;

  const pieChart =
    totalApplications > 0
      ? `conic-gradient(
          #fbbf24 0% ${waitingEnd}%,
          #10b981 ${waitingEnd}% ${approvedEnd}%,
          #f43f5e ${approvedEnd}% 100%
        )`
      : "#e2e8f0";

  const statistics = [
    {
      title: "Total Siswa",
      value: totalStudents,
      description: "Siswa aktif dari sekolah Anda",
      icon: "👨‍🎓",
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "Lowongan PKL",
      value: totalVacancies,
      description: "Lowongan yang sedang dibuka",
      icon: "💼",
      color: "bg-cyan-50 text-cyan-600",
    },
    {
      title: "Status Sekolah",
      value: schoolStatusLabel,
      description: "Status akun sekolah STRIDE",
      icon: "🏫",
      color: "bg-emerald-50 text-emerald-600",
    },
  ];

  const quickMenus = [
    {
      title: "Pengajuan PKL",
      description:
        "Pilih lowongan dan ajukan beberapa siswa sekaligus ke perusahaan tujuan.",
      href: "/sekolah/pengajuan-pkl",
      icon: "📋",
      color: "from-blue-600 to-blue-500",
      light: "bg-blue-50 text-blue-600",
      action: "Buat pengajuan",
    },
    {
      title: "Status Pengajuan",
      description:
        "Lihat perkembangan pengajuan dan keputusan dari pihak mitra.",
      href: "/sekolah/status-pengajuan",
      icon: "📝",
      color: "from-violet-600 to-purple-500",
      light: "bg-violet-50 text-violet-600",
      action: "Lihat status",
    },
    {
      title: "Pemantauan Absensi",
      description:
        "Pantau kehadiran siswa selama menjalani kegiatan PKL.",
      href: "/sekolah/absensi",
      icon: "📊",
      color: "from-emerald-600 to-teal-500",
      light: "bg-emerald-50 text-emerald-600",
      action: "Pantau absensi",
    },
    {
      title: "Laporan PKL",
      description:
        "Lihat rekap kegiatan dan kehadiran siswa selama PKL.",
      href: "/sekolah/laporan",
      icon: "📄",
      color: "from-orange-500 to-amber-500",
      light: "bg-orange-50 text-orange-600",
      action: "Lihat laporan",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f4f7fc] text-slate-800">
      <div className="mx-auto max-w-[1500px] space-y-7 p-5 md:p-8 xl:p-9">

        {/* HEADER */}
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
              <span>STRIDE</span>
              <span>/</span>
              <span className="text-blue-600">Dashboard Guru</span>
            </div>

            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[#10264a] md:text-3xl">
              Dashboard Guru
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Ringkasan pengajuan dan pemantauan PKL sekolah.
            </p>
          </div>

          <Link
            href="/sekolah/profil"
            className="inline-flex items-center gap-3 self-start rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:border-blue-300 hover:shadow-md sm:self-auto"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-400 font-bold text-white">
              {user.fullName.charAt(0).toUpperCase()}
            </div>

            <div>
              <p className="text-sm font-bold text-slate-800">
                {user.fullName}
              </p>
              <p className="text-xs text-slate-400">
                Guru / Sekolah
              </p>
            </div>

            <span className="ml-2 text-slate-400">→</span>
          </Link>
        </header>

        {/* HERO */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#07152f] via-[#10478b] to-[#0789bd] p-7 text-white shadow-xl shadow-blue-900/10 md:p-10">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200/30 bg-white/10 px-3 py-1.5 text-xs font-semibold text-cyan-100">
              <span className="h-2 w-2 rounded-full bg-cyan-300" />
              PORTAL GURU DAN SEKOLAH
            </span>

            <h2 className="mt-6 text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">
              Selamat Datang,
              <br />
              {user.fullName}
            </h2>

            <p className="mt-4 max-w-xl text-sm leading-7 text-blue-100 md:text-base">
              Kelola pengajuan siswa ke tempat PKL, pantau keputusan
              perusahaan, dan awasi kehadiran siswa selama melaksanakan
              Praktik Kerja Lapangan.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/sekolah/pengajuan-pkl"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-800 shadow-lg transition hover:-translate-y-0.5 hover:bg-cyan-50"
              >
                + Buat Pengajuan PKL
              </Link>

              <Link
                href="/sekolah/status-pengajuan"
                className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/20"
              >
                Status Pengajuan →
              </Link>
            </div>
          </div>

          <div className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full border-[35px] border-white/5" />
          <div className="pointer-events-none absolute -bottom-36 right-24 h-80 w-80 rounded-full bg-cyan-300/10 blur-3xl" />

          <div className="pointer-events-none absolute right-12 top-10 hidden select-none text-8xl font-black tracking-widest text-white/[0.07] lg:block">
            PKL
          </div>
        </section>

        {/* INFORMASI SEKOLAH */}
        <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-100 text-2xl">
                🏫
              </div>

              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Sekolah Terdaftar
                </p>

                <h3 className="mt-1 truncate text-lg font-extrabold text-[#10264a]">
                  {schoolName}
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  NPSN: {npsn}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold ${statusStyle}`}
              >
                <span className="h-2 w-2 rounded-full bg-current" />
                {schoolStatusLabel}
              </span>

              <Link
                href="/sekolah/profil"
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:border-blue-300 hover:text-blue-600"
              >
                Lihat Profil →
              </Link>
            </div>
          </div>
        </section>

        {/* STATISTIK */}
        <section>
          <div className="mb-5">
            <h2 className="text-lg font-extrabold text-[#10264a]">
              Ringkasan Dashboard
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Informasi umum aktivitas sekolah di STRIDE.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {statistics.map((item) => (
              <div
                key={item.title}
                className="group rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      {item.title}
                    </p>

                    <h3 className="mt-3 text-3xl font-extrabold tracking-tight text-[#10264a]">
                      {item.value}
                    </h3>
                  </div>

                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl text-2xl ${item.color}`}
                  >
                    {item.icon}
                  </div>
                </div>

                <p className="mt-5 border-t border-slate-100 pt-4 text-xs text-slate-400">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* GRAFIK LINGKARAN */}
        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm md:p-7">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-extrabold text-[#10264a]">
                Grafik Pengajuan PKL
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Perbandingan status pengajuan PKL sekolah Anda.
              </p>
            </div>

            <div className="rounded-xl bg-blue-50 px-4 py-2">
              <p className="text-xs font-medium text-blue-500">
                Total Pengajuan
              </p>
              <p className="text-2xl font-extrabold text-blue-700">
                {totalApplications}
              </p>
            </div>
          </div>

          <div className="mt-8 grid items-center gap-8 md:grid-cols-2">
            {/* DIAGRAM LINGKARAN */}
            <div className="flex justify-center">
              <div
                className="relative h-64 w-64 rounded-full shadow-lg"
                style={{ background: pieChart }}
              >
                <div className="absolute inset-8 flex flex-col items-center justify-center rounded-full bg-white shadow-inner">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Total
                  </span>

                  <span className="mt-1 text-4xl font-extrabold text-[#10264a]">
                    {totalApplications}
                  </span>

                  <span className="mt-1 text-xs text-slate-400">
                    Pengajuan PKL
                  </span>
                </div>
              </div>
            </div>

            {/* KETERANGAN GRAFIK */}
            <div className="space-y-5">
              {applicationStats.map((item) => {
                const percentage =
                  totalApplications > 0
                    ? Math.round(
                        (item.total / totalApplications) * 100
                      )
                    : 0;

                const colors: Record<string, string> = {
                  MENUNGGU: "bg-amber-400",
                  DISETUJUI: "bg-emerald-500",
                  DITOLAK: "bg-rose-500",
                };

                const labels: Record<string, string> = {
                  MENUNGGU: "Menunggu",
                  DISETUJUI: "Disetujui",
                  DITOLAK: "Ditolak",
                };

                return (
                  <div
                    key={item.status}
                    className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`h-4 w-4 rounded-full ${colors[item.status]}`}
                      />

                      <div>
                        <p className="text-sm font-bold text-slate-700">
                          {labels[item.status]}
                        </p>

                        <p className="text-xs text-slate-400">
                          {percentage}% dari seluruh pengajuan
                        </p>
                      </div>
                    </div>

                    <span className="text-xl font-extrabold text-[#10264a]">
                      {item.total}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {totalApplications === 0 && (
            <p className="mt-5 text-center text-sm text-slate-400">
              Belum ada data pengajuan PKL.
            </p>
          )}

          <div className="mt-8 flex flex-wrap gap-5 border-t border-slate-100 pt-5">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-amber-400" />
              <span className="text-xs text-slate-500">Menunggu</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-emerald-500" />
              <span className="text-xs text-slate-500">Disetujui</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-rose-500" />
              <span className="text-xs text-slate-500">Ditolak</span>
            </div>
          </div>
        </section>
        {/* FOOTER */}
        <footer className="flex flex-col justify-between gap-2 border-t border-slate-200 py-5 text-xs text-slate-400 sm:flex-row">
          <p>
            © {new Date().getFullYear()} STRIDE — Sistem Informasi Praktik
            Kerja Lapangan
          </p>

          <p>Portal Guru dan Sekolah</p>
        </footer>
      </div>
    </div>
  );
}
