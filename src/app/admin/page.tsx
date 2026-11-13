
import Image from "next/image";
import { sql } from "@/lib/db";
import { requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

const monthNames = [
  "Jan", "Feb", "Mar", "Apr",
  "Mei", "Jun", "Jul", "Agu",
  "Sep", "Okt", "Nov", "Des",
];

export default async function AdminPage() {
  await requireRole("admin");

  const [
    schoolResult,
    studentResult,
    attendanceResult,
    chartResult,
  ] = await Promise.all([
    sql`
      SELECT COUNT(*) AS total
      FROM schools
    `,

    sql`
      SELECT COUNT(*) AS total
      FROM users
      WHERE role = 'student'
    `,

    sql`
      SELECT COUNT(*) AS total
      FROM absensi_pkl
      WHERE jam_masuk IS NOT NULL
    `,

    // Grafik pendaftaran siswa selama 12 bulan terakhir
    sql`
      SELECT
        EXTRACT(MONTH FROM months.month_start)::int AS month_number,
        EXTRACT(YEAR FROM months.month_start)::int AS year_number,
        COUNT(u.id)::int AS total
      FROM generate_series(
        date_trunc('month', CURRENT_DATE) - INTERVAL '11 months',
        date_trunc('month', CURRENT_DATE),
        INTERVAL '1 month'
      ) AS months(month_start)
      LEFT JOIN users u
        ON date_trunc('month', u.created_at) = months.month_start
        AND u.role = 'student'
      GROUP BY months.month_start
      ORDER BY months.month_start
    `,
  ]);

  const totalSchools = Number(schoolResult[0].total);
  const totalStudents = Number(studentResult[0].total);
  const totalAttendance = Number(attendanceResult[0].total);

  // DATA GRAFIK 12 BULAN
  const chartData = chartResult.map((item) => ({
    month: monthNames[Number(item.month_number) - 1],
    year: Number(item.year_number),
    total: Number(item.total),
  }));

  const chartMax = Math.max(
    1,
    ...chartData.map((item) => item.total)
  );

  // TOTAL SISWA BARU SELAMA 12 BULAN
  const totalMonthlyStudents = chartData.reduce(
    (sum, item) => sum + item.total,
    0
  );

  // RATA-RATA SISWA BARU PER BULAN
  const averageStudents = Math.round(
    totalMonthlyStudents / Math.max(chartData.length, 1)
  );

  // POSISI GRAFIK
  const chartWidth = 1000;
  const chartHeight = 350;

  const left = 65;
  const right = 970;
  const top = 35;
  const bottom = 260;

  const chartRange = chartMax * 1.2;

  const points = chartData.map((item, index) => {
    const x =
      left +
      (index * (right - left)) /
        Math.max(chartData.length - 1, 1);

    const y =
      bottom -
      (item.total / chartRange) * (bottom - top);

    return {
      x,
      y,
      total: item.total,
      month: item.month,
      year: item.year,
    };
  });

  const linePath = points
    .map((point, index) =>
      `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`
    )
    .join(" ");

  const areaPath = points.length
    ? `${linePath} L ${right} ${bottom} L ${left} ${bottom} Z`
    : "";

  const yLabels = [0, 0.25, 0.5, 0.75, 1];

  const stats = [
    {
      title: "Total Sekolah",
      value: totalSchools,
      description: "Sekolah terdaftar",
      icon: "S",
      light: "bg-blue-50 text-blue-600",
    },
    {
      title: "Total Siswa PKL",
      value: totalStudents,
      description: "Akun siswa terdaftar",
      icon: "S",
      light: "bg-violet-50 text-violet-600",
    },
    {
      title: "Total Absensi",
      value: totalAttendance,
      description: "Seluruh presensi masuk siswa",
      icon: "A",
      light: "bg-cyan-50 text-cyan-600",
    },
  ];

  return (
    <main className="min-h-screen bg-[#f4f7fc]">

      {/* HEADER DASHBOARD */}
      <header className="relative overflow-hidden bg-gradient-to-br from-[#061631] via-[#102d62] to-[#15518e] px-6 py-8 text-white md:px-10">
        <div className="absolute -right-20 -top-32 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 h-80 w-80 rounded-full bg-blue-400/10 blur-3xl" />

        <div className="relative mx-auto flex max-w-7xl flex-col justify-between gap-5 md:flex-row md:items-center">

          <div>
            <div className="mb-5 flex items-center gap-3">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-white/20 bg-white p-1.5 shadow-lg shadow-cyan-500/20">
                <Image
                  src="/logo.png"
                  alt="Logo STRIDE"
                  fill
                  priority
                  sizes="56px"
                  className="object-contain p-1"
                />
              </div>

              <div>
                <p className="text-base font-extrabold tracking-[0.2em] text-white">
                  STRIDE
                </p>
                <p className="text-xs text-blue-100">
                  Sistem Informasi Praktik Kerja Lapangan
                </p>
              </div>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
              Dashboard Administrator
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100">
              Pantau perkembangan platform, statistik sekolah,
              jumlah siswa PKL, dan aktivitas presensi.
            </p>
          </div>

          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              Logout →
            </button>
          </form>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-8 md:px-10">

        {/* JUDUL */}
        <div className="mb-6">
          <p className="text-xs font-bold tracking-[0.2em] text-blue-600">
            OVERVIEW
          </p>

          <h2 className="mt-1 text-2xl font-extrabold text-slate-800">
            Ringkasan Statistik
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Gambaran umum aktivitas sistem STRIDE.
          </p>
        </div>

        {/* KARTU STATISTIK */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.title}
              className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {stat.title}
                  </p>

                  <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-800">
                    {stat.value.toLocaleString("id-ID")}
                  </p>

                  <p className="mt-2 text-xs text-slate-400">
                    {stat.description}
                  </p>
                </div>

                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl text-xl font-extrabold ${stat.light}`}
                >
                  {stat.icon}
                </div>
              </div>

              <div className="absolute -bottom-10 -right-10 h-28 w-28 rounded-full bg-blue-500 opacity-[0.05] transition group-hover:scale-150" />
            </div>
          ))}
        </div>

        {/* GRAFIK SISWA PKL 12 BULAN */}
        <div className="mt-8 overflow-hidden rounded-3xl bg-gradient-to-br from-[#071a3d] via-[#102b58] to-[#123d70] p-5 shadow-xl md:p-8">

          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_12px_#22d3ee]" />

                <p className="text-xs font-bold tracking-[0.2em] text-cyan-300">
                  STUDENT ANALYTICS
                </p>
              </div>

              <h2 className="mt-3 text-2xl font-extrabold text-white md:text-3xl">
                Statistik Siswa PKL
              </h2>

              <p className="mt-2 max-w-lg text-sm leading-6 text-blue-200">
                Grafik jumlah siswa PKL yang didaftarkan setiap
                bulan selama 12 bulan terakhir.
              </p>
            </div>

            {/* TOTAL SISWA 12 BULAN */}
            <div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur">
              <p className="text-xs text-blue-200">
                Total Siswa Terdaftar 12 Bulan
              </p>

              <p className="mt-1 text-3xl font-extrabold text-white">
                {totalMonthlyStudents.toLocaleString("id-ID")}
              </p>

              <p className="mt-1 text-xs text-cyan-300">
                Siswa baru terdaftar
              </p>
            </div>
          </div>

          {/* CHART */}
          <div className="mt-8 overflow-x-auto">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="h-auto min-w-[850px] w-full overflow-visible"
              role="img"
              aria-label="Grafik jumlah siswa PKL selama 12 bulan terakhir"
            >
              <defs>
                {/* GRADASI AREA */}
                <linearGradient
                  id="areaFill"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="#22d3ee"
                    stopOpacity="0.35"
                  />
                  <stop
                    offset="100%"
                    stopColor="#22d3ee"
                    stopOpacity="0.01"
                  />
                </linearGradient>

                {/* GRADASI GARIS */}
                <linearGradient
                  id="lineFill"
                  x1="0"
                  y1="0"
                  x2="1"
                  y2="0"
                >
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#67e8f9" />
                </linearGradient>

                {/* EFEK CAHAYA */}
                <filter
                  id="lineGlow"
                  x="-50%"
                  y="-50%"
                  width="200%"
                  height="200%"
                >
                  <feGaussianBlur stdDeviation="5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* GARIS GRID */}
              {yLabels.map((ratio, index) => {
                const y = bottom - ratio * (bottom - top);
                const label = Math.round(ratio * chartRange);

                return (
                  <g key={index}>
                    <line
                      x1={left}
                      y1={y}
                      x2={right}
                      y2={y}
                      stroke="#ffffff"
                      strokeOpacity="0.12"
                      strokeDasharray="5 7"
                    />

                    <text
                      x="45"
                      y={y + 4}
                      textAnchor="end"
                      fontSize="12"
                      fill="#a5b4fc"
                    >
                      {label}
                    </text>
                  </g>
                );
              })}

              {/* AREA GRAFIK */}
              {points.length > 0 && (
                <path
                  d={areaPath}
                  fill="url(#areaFill)"
                />
              )}

              {/* GARIS GRAFIK */}
              {points.length > 1 && (
                <>
                  <path
                    d={linePath}
                    fill="none"
                    stroke="#22d3ee"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.15"
                    filter="url(#lineGlow)"
                  />

                  <path
                    d={linePath}
                    fill="none"
                    stroke="url(#lineFill)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </>
              )}

              {/* TITIK DATA 12 BULAN */}
              {points.map((point, index) => (
                <g key={`${point.month}-${point.year}`}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="11"
                    fill="#22d3ee"
                    opacity="0.15"
                  />

                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="5"
                    fill="#67e8f9"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />

                  {/* JUMLAH SISWA */}
                  <text
                    x={point.x}
                    y={Math.max(point.y - 20, 17)}
                    textAnchor="middle"
                    fontSize="13"
                    fontWeight="bold"
                    fill="white"
                  >
                    {point.total}
                  </text>

                  {/* NAMA BULAN */}
                  <text
                    x={point.x}
                    y="290"
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="600"
                    fill="#dbeafe"
                  >
                    {point.month}
                  </text>

                  {/* TAHUN */}
                  <text
                    x={point.x}
                    y="310"
                    textAnchor="middle"
                    fontSize="10"
                    fill="#93c5fd"
                  >
                    {point.year}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          {/* JIKA DATA KOSONG */}
          {points.every((point) => point.total === 0) && (
            <p className="py-8 text-center text-sm text-blue-200">
              Belum ada siswa yang terdaftar dalam 12 bulan terakhir.
            </p>
          )}

          {/* KETERANGAN GRAFIK */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
            <div className="flex items-center gap-2 text-xs text-blue-100">
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
              Jumlah siswa baru terdaftar
            </div>

            <p className="text-xs text-blue-200">
              Data berdasarkan tanggal pendaftaran akun
            </p>
          </div>
        </div>

        {/* RINGKASAN TAMBAHAN */}
        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">

          {/* RATA-RATA SISWA */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-xl font-extrabold text-blue-600">
                S
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Rata-rata Siswa Baru
                </p>

                <h3 className="text-2xl font-extrabold text-slate-800">
                  {averageStudents.toLocaleString("id-ID")}
                  <span className="ml-1 text-sm font-medium text-slate-400">
                    siswa/bulan
                  </span>
                </h3>
              </div>
            </div>

            <p className="mt-4 text-xs leading-5 text-slate-400">
              Rata-rata jumlah siswa baru yang mendaftar
              dalam periode 12 bulan terakhir.
            </p>
          </div>

          {/* INFORMASI PLATFORM */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-50 text-xl font-extrabold text-cyan-600">
                S
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Platform STRIDE
                </p>

                <h3 className="text-xl font-extrabold text-slate-800">
                  Sistem Informasi PKL
                </h3>
              </div>
            </div>

            <p className="mt-4 text-xs leading-5 text-slate-400">
              Memudahkan sekolah dan administrator dalam
              mengelola dan memantau peserta Praktik Kerja Lapangan.
            </p>
          </div>
        </div>

        {/* FOOTER */}
        <footer className="mt-10 border-t border-slate-200 py-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} STRIDE - Sistem Informasi
          Praktik Kerja Lapangan
        </footer>

      </section>
    </main>
  );
}
