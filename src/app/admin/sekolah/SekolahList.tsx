
"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";

type School = {
  id: number;
  school_name: string;
  npsn: string | null;
  address: string | null;
  phone: string | null;
  created_at: string;
  status: string | null;
};

export default function SekolahList({
  schools,
}: {
  schools: School[];
}) {
  const router = useRouter();

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [search, setSearch] = useState("");

  // PEMBARUAN DATA OTOMATIS
  const refreshData = useCallback(() => {
    router.refresh();
  }, [router]);

  useEffect(() => {
    const interval = window.setInterval(refreshData, 10000);

    return () => window.clearInterval(interval);
  }, [refreshData]);

  // NORMALISASI STATUS
  function normalizeStatus(status: string | null | undefined) {
    const value = String(status || "").trim().toUpperCase();

    if (value === "ACTIVE") return "ACTIVE";
    if (value === "PENDING") return "PENDING";
    if (value === "INACTIVE") return "INACTIVE";

    return "UNKNOWN";
  }

  // PENCARIAN SEKOLAH
  const filteredSchools = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    return schools.filter((school) => {
      return (
        (school.school_name || "").toLowerCase().includes(keyword) ||
        (school.npsn || "").toLowerCase().includes(keyword) ||
        (school.address || "").toLowerCase().includes(keyword)
      );
    });
  }, [schools, search]);

  // HAPUS SEKOLAH
  async function handleDelete(school: School) {
    const confirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus sekolah "${school.school_name}"?\n\nData sekolah akan dinonaktifkan dan tidak ditampilkan lagi dalam daftar aktif.`
    );

    if (!confirmed) return;

    setDeletingId(school.id);
    setMessage("");
    setIsError(false);

    try {
      const response = await fetch(
        `/api/admin/sekolah/${school.id}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Gagal menghapus data sekolah."
        );
      }

      setMessage(
        result.message || "Data sekolah berhasil diperbarui."
      );

      refreshData();
    } catch (error) {
      setIsError(true);

      setMessage(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat menghapus sekolah."
      );
    } finally {
      setDeletingId(null);
    }
  }

  // FORMAT TANGGAL
  function formatDate(date: string) {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Jakarta",
    });
  }

  // LABEL DAN WARNA STATUS
  function getStatus(status: string | null | undefined) {
    switch (normalizeStatus(status)) {
      case "ACTIVE":
        return {
          label: "Aktif",
          className:
            "border-emerald-100 bg-emerald-50 text-emerald-700",
          dotClass: "bg-emerald-500",
        };

      case "PENDING":
        return {
          label: "Menunggu Verifikasi",
          className:
            "border-amber-100 bg-amber-50 text-amber-700",
          dotClass: "bg-amber-500",
        };

      case "INACTIVE":
        return {
          label: "Nonaktif",
          className:
            "border-red-100 bg-red-50 text-red-700",
          dotClass: "bg-red-500",
        };

      default:
        return {
          label: "Status Tidak Diketahui",
          className:
            "border-slate-200 bg-slate-100 text-slate-600",
          dotClass: "bg-slate-400",
        };
    }
  }

  return (
    <div>
      {/* NOTIFIKASI */}
      {message && (
        <div
          role="alert"
          className={`mx-4 mt-4 rounded-xl border px-4 py-3 text-sm font-medium sm:mx-6 ${
            isError
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {message}
        </div>
      )}

      {/* PENCARIAN */}
      <div className="space-y-4 border-b border-slate-100 px-4 py-5 sm:px-6">
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            🔎
          </span>

          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari nama sekolah, NPSN, atau alamat..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-slate-500">
            Menampilkan{" "}
            <span className="font-bold text-slate-700">
              {filteredSchools.length}
            </span>{" "}
            dari {schools.length} sekolah
          </p>

          <p className="flex items-center gap-2 text-[11px] font-medium text-emerald-600">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            Pembaruan otomatis setiap 10 detik
          </p>
        </div>
      </div>

      {/* DATA KOSONG */}
      {schools.length === 0 ? (
        <div className="px-5 py-16 text-center sm:py-20">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-50 text-4xl">
            🏫
          </div>

          <h3 className="mt-5 text-lg font-bold text-slate-700">
            Belum Ada Data Sekolah
          </h3>

          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-400">
            Sekolah yang telah mendaftar akan ditampilkan di halaman ini.
          </p>

          <Link
            href="/admin/sekolah/tambah"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-800"
          >
            + Tambah Sekolah Pertama
          </Link>
        </div>
      ) : filteredSchools.length === 0 ? (
        <div className="px-5 py-16 text-center">
          <div className="text-4xl">🔎</div>

          <h3 className="mt-4 font-bold text-slate-700">
            Data Tidak Ditemukan
          </h3>

          <p className="mt-2 text-sm text-slate-400">
            Tidak ada sekolah yang sesuai dengan pencarian.
          </p>

          <button
            type="button"
            onClick={() => setSearch("")}
            className="mt-4 rounded-xl bg-blue-50 px-4 py-2.5 text-sm font-bold text-blue-700 hover:bg-blue-100"
          >
            Reset Pencarian
          </button>
        </div>
      ) : (
        <>
          {/* TAMPILAN MOBILE */}
          <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
            {filteredSchools.map((school, index) => {
              const status = getStatus(school.status);

              return (
                <div
                  key={school.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 text-xl">
                        🏫
                      </div>

                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          SEKOLAH #{index + 1}
                        </p>

                        <h3 className="mt-1 break-words text-sm font-bold text-slate-800">
                          {school.school_name}
                        </h3>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${status.className}`}
                    >
                      {status.label}
                    </span>
                  </div>

                  <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                    <div className="flex justify-between gap-3 text-sm">
                      <span className="text-slate-400">NPSN</span>
                      <span className="font-semibold text-slate-700">
                        {school.npsn || "-"}
                      </span>
                    </div>

                    <div className="flex justify-between gap-3 text-sm">
                      <span className="text-slate-400">Telepon</span>
                      <span className="text-right text-slate-700">
                        {school.phone || "-"}
                      </span>
                    </div>

                    <div className="flex justify-between gap-3 text-sm">
                      <span className="text-slate-400">
                        Tanggal Daftar
                      </span>
                      <span className="text-right text-slate-700">
                        {formatDate(school.created_at)}
                      </span>
                    </div>

                    <div className="text-sm">
                      <p className="mb-1 text-slate-400">Alamat</p>
                      <p className="break-words leading-6 text-slate-700">
                        {school.address || "Alamat belum diisi"}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={deletingId !== null}
                    onClick={() => handleDelete(school)}
                    className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deletingId === school.id ? (
                      <>
                        <span className="animate-spin">⏳</span>
                        Memproses...
                      </>
                    ) : (
                      <>
                        <span>🗑️</span>
                        Hapus Sekolah
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* TAMPILAN DESKTOP */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[950px] text-left text-sm">
              <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-5">No.</th>
                  <th className="px-5 py-5">Nama Sekolah</th>
                  <th className="px-5 py-5">NPSN</th>
                  <th className="px-5 py-5">Telepon</th>
                  <th className="px-5 py-5">Tanggal Daftar</th>
                  <th className="px-5 py-5">Status</th>
                  <th className="px-5 py-5 text-center">Aksi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredSchools.map((school, index) => {
                  const status = getStatus(school.status);

                  return (
                    <tr
                      key={school.id}
                      className="group transition-colors hover:bg-blue-50/40"
                    >
                      <td className="px-5 py-5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-500 transition group-hover:bg-blue-100 group-hover:text-blue-700">
                          {index + 1}
                        </span>
                      </td>

                      <td className="px-5 py-5">
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

                      <td className="px-5 py-5">
                        <span className="rounded-lg bg-blue-50 px-3 py-2 font-mono text-xs font-semibold text-blue-700">
                          {school.npsn || "-"}
                        </span>
                      </td>

                      <td className="px-5 py-5 text-slate-600">
                        {school.phone || "-"}
                      </td>

                      <td className="whitespace-nowrap px-5 py-5 text-slate-600">
                        {formatDate(school.created_at)}
                      </td>

                      <td className="px-5 py-5">
                        <span
                          className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-bold ${status.className}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${status.dotClass}`}
                          />
                          {status.label}
                        </span>
                      </td>

                      <td className="px-5 py-5 text-center">
                        <button
                          type="button"
                          disabled={deletingId !== null}
                          onClick={() => handleDelete(school)}
                          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingId === school.id
                            ? "Memproses..."
                            : "🗑️ Hapus"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
