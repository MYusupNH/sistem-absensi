import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { sql } from "@/lib/db";
import PrintStudentButton from "./PrintStudentButton";

export const dynamic = "force-dynamic";

type DetailHarian = {
  tanggal: string;
  status: "HADIR" | "TIDAK_HADIR";
  jam_masuk: string | null;
  jam_keluar: string | null;
};

type RekapSiswa = {
  student_user_id: number;
  full_name: string | null;
  class_name: string | null;
  major: string | null;
  tanggal_mulai: string;
  tanggal_selesai: string | null;
  total_hari_kerja: number;
  total_hadir: number;
  total_tidak_hadir: number;
  detail: DetailHarian[];
};

function formatTanggal(value: string | null) {
  if (!value) return "-";

  return new Date(
    `${String(value).slice(0, 10)}T00:00:00`
  ).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatJam(value: string | null) {
  if (!value) return "-";
  return String(value).slice(0, 8);
}

export default async function RekapAbsensiPage() {
  const user = await requireRole(["admin", "super_admin"]);

  if (!user) {
    redirect("/login");
  }

  const data = (await sql`
    WITH penempatan_awal AS (
      SELECT DISTINCT ON (d.student_user_id)
        d.student_user_id,
        u.full_name,
        sp.class_name,
        sp.major,

        COALESCE(
          p.tanggal_mulai,
          l.tanggal_mulai
        )::date AS tanggal_mulai,

        CASE
          WHEN p.tanggal_selesai IS NOT NULL
            AND p.tanggal_selesai >= COALESCE(
              p.tanggal_mulai,
              l.tanggal_mulai
            )
          THEN p.tanggal_selesai

          WHEN l.tanggal_selesai IS NOT NULL
            AND l.tanggal_selesai >= COALESCE(
              p.tanggal_mulai,
              l.tanggal_mulai
            )
          THEN l.tanggal_selesai

          ELSE NULL
        END::date AS tanggal_selesai

      FROM detail_pengajuan_pkl d

      INNER JOIN pengajuan_pkl p
        ON p.id = d.pengajuan_id

      LEFT JOIN lowongan_pkl l
        ON l.id = p.lowongan_id

      INNER JOIN users u
        ON u.id = d.student_user_id

      LEFT JOIN student_profiles sp
        ON sp.user_id = u.id

      WHERE
        p.status = 'DISETUJUI'
        AND COALESCE(
          p.tanggal_mulai,
          l.tanggal_mulai
        ) IS NOT NULL

      ORDER BY
        d.student_user_id,
        p.updated_at DESC,
        p.id DESC
    ),

    penempatan AS (
      SELECT *
      FROM penempatan_awal
      WHERE tanggal_mulai IS NOT NULL
    ),

    hari_kerja AS (
      SELECT
        p.student_user_id,
        p.full_name,
        p.class_name,
        p.major,
        p.tanggal_mulai,
        p.tanggal_selesai,
        kalender.tanggal::date AS tanggal

      FROM penempatan p

      CROSS JOIN LATERAL generate_series(
        p.tanggal_mulai::timestamp,

        LEAST(
          COALESCE(
            p.tanggal_selesai,
            CURRENT_DATE
          ),
          CURRENT_DATE
        )::timestamp,

        INTERVAL '1 day'
      ) AS kalender(tanggal)

      WHERE
        p.tanggal_mulai <= CURRENT_DATE
        AND EXTRACT(
          ISODOW FROM kalender.tanggal
        ) BETWEEN 1 AND 5
    ),

    absensi_harian AS (
      SELECT
        student_user_id,
        tanggal::date AS tanggal,
        MIN(jam_masuk) AS jam_masuk,
        MAX(jam_keluar) AS jam_keluar

      FROM absensi_pkl

      GROUP BY
        student_user_id,
        tanggal::date
    ),

    rekap_harian AS (
      SELECT
        h.student_user_id,
        h.full_name,
        h.class_name,
        h.major,
        h.tanggal_mulai,
        h.tanggal_selesai,
        h.tanggal,

        CASE
          WHEN a.jam_masuk IS NOT NULL
            THEN 'HADIR'
          ELSE 'TIDAK_HADIR'
        END AS status,

        a.jam_masuk,
        a.jam_keluar

      FROM hari_kerja h

      LEFT JOIN absensi_harian a
        ON a.student_user_id = h.student_user_id
        AND a.tanggal = h.tanggal
    )

    SELECT
      student_user_id,
      full_name,
      class_name,
      major,

      tanggal_mulai::text AS tanggal_mulai,
      tanggal_selesai::text AS tanggal_selesai,

      COUNT(*)::int AS total_hari_kerja,

      COUNT(*) FILTER (
        WHERE status = 'HADIR'
      )::int AS total_hadir,

      COUNT(*) FILTER (
        WHERE status = 'TIDAK_HADIR'
      )::int AS total_tidak_hadir,

      JSON_AGG(
        JSON_BUILD_OBJECT(
          'tanggal', tanggal::text,
          'status', status,
          'jam_masuk', jam_masuk::text,
          'jam_keluar', jam_keluar::text
        )
        ORDER BY tanggal
      ) AS detail

    FROM rekap_harian

    GROUP BY
      student_user_id,
      full_name,
      class_name,
      major,
      tanggal_mulai,
      tanggal_selesai

    ORDER BY full_name ASC
  `) as RekapSiswa[];

  const totalSiswa = data.length;

  const totalHadir = data.reduce(
    (total, siswa) =>
      total + Number(siswa.total_hadir),
    0
  );

  const totalTidakHadir = data.reduce(
    (total, siswa) =>
      total + Number(siswa.total_tidak_hadir),
    0
  );

  return (
    <main className="min-h-screen bg-[#f4f7fc] p-5 md:p-8">
      <div className="mx-auto max-w-7xl space-y-7">

        {/* HEADER */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0b1f4d] via-[#0f2f6b] to-[#16478a] p-7 shadow-xl shadow-blue-900/20 md:p-8 print:hidden">

          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">

            <div>
              <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-300">
                <span className="h-2 w-2 rounded-full bg-cyan-400" />
                STRIDE ADMINISTRATOR
              </p>

              <h1 className="mt-3 text-3xl font-black text-white md:text-4xl">
                Rekap Absensi Siswa PKL
              </h1>

              <p className="mt-2 text-sm text-blue-100/80">
                Rekap kehadiran siswa berdasarkan data presensi yang tersimpan.
              </p>

              <nav className="mt-5 flex items-center gap-2 text-xs text-blue-100/70">
                <a href="/admin" className="hover:text-white">
                  Dashboard
                </a>
                <span>/</span>
                <span className="font-bold text-cyan-300">
                  Rekap Absensi
                </span>
              </nav>
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur">
              <span>📋</span>
              {totalSiswa} siswa
            </div>

          </div>
        </div>

        {/* STATISTIK */}
        <div className="grid gap-4 sm:grid-cols-3 print:hidden">

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Siswa PKL
            </p>

            <p className="mt-2 text-3xl font-extrabold text-slate-800">
              {totalSiswa}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Total Kehadiran
            </p>

            <p className="mt-2 text-3xl font-extrabold text-emerald-600">
              {totalHadir}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Total Tidak Hadir
            </p>

            <p className="mt-2 text-3xl font-extrabold text-red-600">
              {totalTidakHadir}
            </p>
          </div>

        </div>

        {/* REKAP PER SISWA */}
        <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">

          <div className="border-b border-slate-100 px-6 py-5 print:hidden">
            <h2 className="font-extrabold text-slate-800">
              Rekap Per Siswa
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Buka detail siswa untuk melihat catatan presensi harian.
            </p>
          </div>

          {data.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-lg font-bold text-slate-700">
                Belum Ada Data Rekap
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Belum ditemukan pengajuan PKL yang disetujui dengan tanggal mulai valid.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">

              {data.map((siswa) => {
                const hadir = Number(siswa.total_hadir);
                const tidakHadir = Number(siswa.total_tidak_hadir);
                const total = Number(siswa.total_hari_kerja);

                const persentase =
                  total > 0
                    ? Math.round((hadir / total) * 100)
                    : 0;

                const targetId = `rekap-siswa-${siswa.student_user_id}`;

                return (
                  <div
                    id={targetId}
                    key={siswa.student_user_id}
                    className="print:break-inside-avoid"
                  >

                    {/* KOP SURAT (HANYA SAAT DICETAK) */}
                    <div
                      className="hidden px-4 pb-4 pt-2 text-center text-black print:block"
                      style={{
                        fontFamily: 'Cambria, "Times New Roman", serif',
                      }}
                    >
                      <h2 className="text-[24px] font-bold uppercase leading-tight">
                        Universitas Bina Sarana Informatika
                      </h2>

                      <p className="mt-1 text-[18px] font-bold uppercase leading-tight">
                        Kampus Sukabumi
                      </p>

                      {/* Garis ganda */}
                      <div className="mt-3 h-[6px] border-y border-black" />

                      <p className="mt-5 text-[14px] underline">
                        Rekap Absensi Siswa PKL/Magang
                      </p>
                    </div>

                    <details className="group" open>

                      {/* IDENTITAS SISWA */}
                      <summary className="flex cursor-pointer list-none flex-col gap-4 p-5 transition hover:bg-slate-50 md:flex-row md:items-center md:justify-between print:cursor-default">

                        <div className="flex items-center gap-3">

                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 font-bold text-blue-700">
                            {(siswa.full_name || "S")
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <p className="font-bold text-slate-800">
                              {siswa.full_name || "Nama tidak tersedia"}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {siswa.class_name || "-"} · {siswa.major || "-"}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              {formatTanggal(siswa.tanggal_mulai)}
                              {" – "}
                              {siswa.tanggal_selesai
                                ? formatTanggal(siswa.tanggal_selesai)
                                : "Belum ditentukan"}
                            </p>
                          </div>

                        </div>

                        <div className="flex flex-wrap items-center gap-3">

                          <div className="rounded-xl bg-emerald-50 px-3 py-2 text-center">
                            <p className="text-lg font-extrabold text-emerald-700">
                              {hadir}
                            </p>
                            <p className="text-[10px] font-bold text-emerald-600">
                              HADIR
                            </p>
                          </div>

                          <div className="rounded-xl bg-red-50 px-3 py-2 text-center">
                            <p className="text-lg font-extrabold text-red-700">
                              {tidakHadir}
                            </p>
                            <p className="text-[10px] font-bold text-red-600">
                              TIDAK HADIR
                            </p>
                          </div>

                          <div className="rounded-xl bg-blue-50 px-3 py-2 text-center">
                            <p className="text-lg font-extrabold text-blue-700">
                              {persentase}%
                            </p>
                            <p className="text-[10px] font-bold text-blue-600">
                              KEHADIRAN
                            </p>
                          </div>

                          <span className="text-sm font-bold text-blue-600 print:hidden">
                            Detail ↓
                          </span>

                        </div>

                      </summary>

                      {/* DETAIL HARIAN */}
                      <div className="border-t border-slate-100 bg-slate-50/70 p-5">

                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">

                          <div>
                            <h3 className="font-bold text-slate-800">
                              Catatan Kehadiran Harian
                            </h3>

                            <p className="mt-1 text-xs text-slate-500">
                              Total {total} hari kerja sampai hari ini.
                            </p>
                          </div>

                          {/* TOMBOL CETAK PER SISWA */}
                          <div className="flex flex-wrap items-center gap-3">

                            <div className="text-sm font-bold text-slate-700">
                              Kehadiran: {persentase}%
                            </div>

                            <PrintStudentButton targetId={targetId} />

                          </div>

                        </div>

                        {/* TABEL PRESENSI */}
                        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">

                          <table className="w-full min-w-[650px] text-left text-sm">

                            <thead className="bg-slate-100 text-xs uppercase text-slate-500">
                              <tr>
                                <th className="px-4 py-3">No.</th>
                                <th className="px-4 py-3">Tanggal</th>
                                <th className="px-4 py-3">Jam Masuk</th>
                                <th className="px-4 py-3">Jam Pulang</th>
                                <th className="px-4 py-3">Status</th>
                              </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">

                              {siswa.detail.map((hari, index) => (
                                <tr key={hari.tanggal}>

                                  <td className="px-4 py-3 text-slate-500">
                                    {index + 1}
                                  </td>

                                  <td className="px-4 py-3 font-medium text-slate-700">
                                    {formatTanggal(hari.tanggal)}
                                  </td>

                                  <td className="px-4 py-3 text-slate-600">
                                    {formatJam(hari.jam_masuk)}
                                  </td>

                                  <td className="px-4 py-3 text-slate-600">
                                    {formatJam(hari.jam_keluar)}
                                  </td>

                                  <td className="px-4 py-3">
                                    {hari.status === "HADIR" ? (
                                      <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                                        Hadir
                                      </span>
                                    ) : (
                                      <span className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700">
                                        Tidak Hadir
                                      </span>
                                    )}
                                  </td>

                                </tr>
                              ))}

                            </tbody>

                          </table>

                        </div>

                        {/* TANDA TANGAN PEMBIMBING INDUSTRI */}
                        <div className="mt-12 flex justify-end px-4 pb-6">
                          <div className="w-64 text-center text-sm text-slate-800">

                            <p>
                              Sukabumi,{" "}
                              {new Date().toLocaleDateString("id-ID", {
                                day: "2-digit",
                                month: "long",
                                year: "numeric",
                                timeZone: "Asia/Jakarta",
                              })}
                            </p>

                            <p className="mt-1 font-medium">
                              Pembimbing Industri
                            </p>

                            <div className="h-24" />

                            <p className="font-bold underline">
                              Dede Wintana, M.Kom.
                            </p>

                          </div>
                        </div>

                      </div>

                    </details>
                  </div>
                );
              })}

            </div>
          )}

        </section>

        <p className="text-xs text-slate-400 print:hidden">
          Perhitungan menggunakan hari Senin sampai Jumat. Hari libur nasional serta izin dan sakit belum dikurangi dari perhitungan.
        </p>

      </div>
    </main>
  );
}