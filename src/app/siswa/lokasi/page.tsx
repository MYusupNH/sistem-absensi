
"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type PklLocation = {
  id: number;
  judul: string;
  nama_instansi: string;
  lokasi: string;
  latitude: number | null;
  longitude: number | null;
  radius_absensi: number;
};

export default function LokasiPklPage() {
  const [location, setLocation] = useState<PklLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadLocation = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/siswa/aktivitas", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Gagal mengambil informasi lokasi.");
      }

      setLocation(data.pklLocation || null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat mengambil data."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLocation();
  }, [loadLocation]);

  const koordinatTersedia =
    location?.latitude !== null &&
    location?.latitude !== undefined &&
    location?.longitude !== null &&
    location?.longitude !== undefined;

  const mapsUrl = koordinatTersedia
    ? `https://www.google.com/maps?q=${location.latitude},${location.longitude}`
    : null;

  return (
    <div className="min-h-screen bg-[#f4f7fb]">
      {/* HEADER */}
      <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-xl sm:px-7">
        <div>
          <p className="text-sm font-black text-slate-900">Lokasi PKL</p>
          <p className="text-[11px] text-slate-400">
            Informasi tempat Praktik Kerja Lapangan
          </p>
        </div>

        <Link
          href="/siswa"
          className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
        >
          ← Dashboard
        </Link>
      </header>

      <main className="mx-auto max-w-[1200px] space-y-6 p-4 sm:p-7 lg:p-8">
        {/* JUDUL */}
        <section>
          <p className="text-[10px] font-black tracking-[0.2em] text-blue-600">
            INFORMASI PENEMPATAN
          </p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Lokasi Praktik Kerja Lapangan
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Informasi instansi tempat kamu melaksanakan kegiatan PKL dan
            ketentuan lokasi untuk verifikasi absensi.
          </p>
        </section>

        {/* ERROR */}
        {error && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
            <p>{error}</p>
            <button
              type="button"
              onClick={loadLocation}
              className="font-bold underline"
            >
              Coba lagi
            </button>
          </div>
        )}

        {/* LOADING */}
        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="animate-pulse space-y-4">
              <div className="h-6 w-48 rounded bg-slate-100" />
              <div className="h-4 w-72 max-w-full rounded bg-slate-100" />
              <div className="h-4 w-full rounded bg-slate-100" />
              <div className="h-32 rounded-xl bg-slate-100" />
            </div>
          </div>
        )}

        {/* DATA LOKASI */}
        {!loading && !error && location && (
          <>
            <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-[#102344] via-[#174b88] to-[#087e9f] p-6 text-white shadow-xl sm:p-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-3xl">
                  📍
                </div>

                <div className="min-w-0">
                  <p className="text-[10px] font-black tracking-[0.2em] text-cyan-200">
                    TEMPAT PENEMPATAN PKL
                  </p>
                  <h2 className="mt-2 text-2xl font-black sm:text-3xl">
                    {location.nama_instansi}
                  </h2>
                  <p className="mt-2 text-sm text-blue-100">
                    {location.judul}
                  </p>
                </div>
              </div>
            </section>

            <section className="grid gap-5 lg:grid-cols-2">
              {/* ALAMAT */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl">
                  🏢
                </div>

                <h3 className="mt-5 text-lg font-black text-slate-900">
                  Alamat Instansi
                </h3>

                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {location.lokasi || "Alamat belum tersedia."}
                </p>

                {mapsUrl && (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-800"
                  >
                    Buka Google Maps ↗
                  </a>
                )}
              </div>

              {/* RADIUS */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-2xl">
                  ◎
                </div>

                <h3 className="mt-5 text-lg font-black text-slate-900">
                  Radius Absensi
                </h3>

                <p className="mt-3 text-3xl font-black text-emerald-700">
                  {location.radius_absensi || 100} meter
                </p>

                <p className="mt-3 text-sm leading-7 text-slate-500">
                  Kamu harus berada dalam radius lokasi yang telah ditentukan
                  untuk dapat melakukan absensi masuk.
                </p>
              </div>
            </section>

            {/* KOORDINAT */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-xl">
                  🌐
                </div>
                <div>
                  <h3 className="font-black text-slate-900">
                    Koordinat Lokasi
                  </h3>
                  <p className="text-xs text-slate-400">
                    Titik lokasi yang digunakan untuk verifikasi GPS.
                  </p>
                </div>
              </div>

              {koordinatTersedia ? (
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-bold text-slate-400">
                      LATITUDE
                    </p>
                    <p className="mt-2 break-all font-black text-slate-800">
                      {location.latitude}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-bold text-slate-400">
                      LONGITUDE
                    </p>
                    <p className="mt-2 break-all font-black text-slate-800">
                      {location.longitude}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-5 rounded-xl bg-amber-50 p-4 text-sm font-semibold text-amber-700">
                  Koordinat lokasi belum diatur oleh Admin. Hubungi Admin
                  untuk melengkapi koordinat sebelum melakukan absensi.
                </div>
              )}
            </section>
          </>
        )}

        {/* BELUM ADA LOKASI */}
        {!loading && !error && !location && (
          <section className="rounded-2xl border border-amber-200 bg-white px-6 py-14 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-3xl">
              📍
            </div>

            <h2 className="mt-5 text-lg font-black text-slate-900">
              Belum Ada Penempatan PKL
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Informasi lokasi PKL belum tersedia. Silakan hubungi Admin
              sekolah untuk mendapatkan informasi penempatan.
            </p>
          </section>
        )}

        {/* FOOTER */}
        <footer className="border-t border-slate-200 py-6 text-center">
          <p className="text-xs font-semibold text-slate-400">
            © {new Date().getFullYear()} STRIDE
          </p>
          <p className="mt-1 text-[10px] text-slate-400">
            Sistem Informasi Praktik Kerja Lapangan
          </p>
        </footer>
      </main>
    </div>
  );
}
