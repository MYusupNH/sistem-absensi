
"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";

type Attendance = {
  id: number;
  tanggal: string;
  jam_masuk: string | null;
  jam_keluar: string | null;
  latitude?: number | null;
  longitude?: number | null;
  jarak_meter?: number | null;
};

type Report = {
  id: number;
  tanggal: string;
  kegiatan: string;
  hasil: string | null;
  kendala: string | null;
  created_at: string;
};

type PklLocation = {
  id: number;
  judul: string;
  nama_instansi: string;
  lokasi: string;
  latitude: number | null;
  longitude: number | null;
  radius_absensi: number;
};

type Coordinates = {
  latitude: number;
  longitude: number;
  accuracy: number;
};

const MAX_GPS_ACCURACY = 100;

function getToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
  }).format(new Date());
}

function dateOnly(value: string) {
  if (!value) return "";

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function formatTime(value: string | null) {
  if (!value) return "-";

  if (/^\d{2}:\d{2}/.test(value)) {
    return value.slice(0, 5);
  }

  return new Date(value).toLocaleTimeString("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function hitungJarak(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371000;
  const rad = (value: number) => (value * Math.PI) / 180;

  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) *
      Math.cos(rad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function AktivitasPklPage() {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [location, setLocation] = useState<PklLocation | null>(null);

  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [selfieData, setSelfieData] = useState("");

  const [kegiatan, setKegiatan] = useState("");
  const [hasil, setHasil] = useState("");
  const [kendala, setKendala] = useState("");

  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [savingReport, setSavingReport] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/siswa/aktivitas", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Gagal mengambil data aktivitas.");
      }

      setAttendance(
        Array.isArray(data.attendance)
          ? data.attendance
          : data.attendance
            ? [data.attendance]
            : []
      );

      setReports(Array.isArray(data.reports) ? data.reports : []);

      const pklLocation = data.pklLocation;

      setLocation(
        pklLocation
          ? {
              ...pklLocation,
              latitude:
                pklLocation.latitude === null ||
                pklLocation.latitude === undefined
                  ? null
                  : Number(pklLocation.latitude),
              longitude:
                pklLocation.longitude === null ||
                pklLocation.longitude === undefined
                  ? null
                  : Number(pklLocation.longitude),
              radius_absensi: Number(
                pklLocation.radius_absensi || 100
              ),
            }
          : null
      );

      const todayReport = (data.reports || []).find(
        (item: Report) => dateOnly(item.tanggal) === getToday()
      );

      if (todayReport) {
        setKegiatan(todayReport.kegiatan || "");
        setHasil(todayReport.hasil || "");
        setKendala(todayReport.kendala || "");
      } else {
        setKegiatan("");
        setHasil("");
        setKendala("");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengambil data aktivitas."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!cameraOpen || !videoRef.current || !streamRef.current) return;

    videoRef.current.srcObject = streamRef.current;

    videoRef.current.play().catch(() => {
      setError("Kamera tidak dapat dijalankan.");
    });
  }, [cameraOpen]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOpen(false);
    setCameraLoading(false);
  };

  const startCamera = async () => {
    try {
      setError("");
      setMessage("");
      setCameraLoading(true);

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          "Browser tidak mendukung kamera. Gunakan localhost atau HTTPS."
        );
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: "user",
          width: { ideal: 720 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;
      setCameraOpen(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Tidak dapat mengakses kamera. Periksa izin browser."
      );
    } finally {
      setCameraLoading(false);
    }
  };

  const captureSelfie = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || !video.videoWidth) {
      setError("Kamera belum siap. Silakan coba kembali.");
      return;
    }

    const scale = Math.min(1, 720 / video.videoWidth);

    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);

    const context = canvas.getContext("2d");

    if (!context) {
      setError("Gagal memproses foto.");
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    setSelfieData(canvas.toDataURL("image/jpeg", 0.75));

    stopCamera();
    setMessage("Foto selfie berhasil diambil.");
    setError("");
  };

  const ambilGPS = () => {
    if (!navigator.geolocation) {
      setError("Browser tidak mendukung fitur lokasi GPS.");
      return;
    }

    setGpsLoading(true);
    setError("");
    setMessage("");
    setCoordinates(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });

        setGpsLoading(false);

        if (position.coords.accuracy > MAX_GPS_ACCURACY) {
          setError(
            `Akurasi GPS masih rendah (±${Math.round(
              position.coords.accuracy
            )} meter). Maksimal ${MAX_GPS_ACCURACY} meter. Coba ambil lokasi kembali.`
          );
        } else {
          setMessage("Lokasi GPS berhasil didapatkan.");
        }
      },
      (geoError) => {
        const messages: Record<number, string> = {
          1: "Izin lokasi ditolak. Aktifkan izin lokasi pada browser.",
          2: "Lokasi tidak tersedia. Periksa GPS perangkat.",
          3: "Waktu mendapatkan lokasi habis. Silakan coba lagi.",
        };

        setError(messages[geoError.code] || "Gagal mendapatkan lokasi GPS.");
        setGpsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      }
    );
  };

  const todayAttendance =
    attendance.find((item) => dateOnly(item.tanggal) === getToday()) || null;

  const sudahMasuk = Boolean(todayAttendance?.jam_masuk);
  const sudahKeluar = Boolean(todayAttendance?.jam_keluar);

  const lokasiSiap =
    location?.latitude !== null &&
    location?.latitude !== undefined &&
    location?.longitude !== null &&
    location?.longitude !== undefined &&
    Number.isFinite(location.latitude) &&
    Number.isFinite(location.longitude);

  const jarak =
    coordinates && lokasiSiap
      ? hitungJarak(
          coordinates.latitude,
          coordinates.longitude,
          location.latitude as number,
          location.longitude as number
        )
      : null;

  const radius = Number(location?.radius_absensi || 100);
  const gpsAkurat =
    coordinates !== null &&
    Number.isFinite(coordinates.accuracy) &&
    coordinates.accuracy > 0 &&
    coordinates.accuracy <= MAX_GPS_ACCURACY;

  const dalamRadius = jarak !== null && jarak <= radius;

  const submitAttendance = async (action: "masuk" | "keluar") => {
    try {
      setProcessing(true);
      setError("");
      setMessage("");

      if (action === "masuk") {
        if (!selfieData) {
          throw new Error("Silakan ambil foto selfie terlebih dahulu.");
        }

        if (!coordinates) {
          throw new Error("Silakan ambil lokasi GPS terlebih dahulu.");
        }

        if (!gpsAkurat) {
          throw new Error(
            `Akurasi GPS harus maksimal ${MAX_GPS_ACCURACY} meter. Ambil ulang lokasi GPS.`
          );
        }

        if (!lokasiSiap) {
          throw new Error("Koordinat lokasi PKL belum diatur Admin.");
        }

        if (!dalamRadius) {
          throw new Error(
            `Kamu berada di luar radius absensi. Jarak ${Math.round(
              jarak || 0
            )} meter, radius yang diizinkan ${radius} meter.`
          );
        }
      }

      const body =
        action === "masuk"
          ? {
              action: "masuk",
              selfieData,
              latitude: coordinates?.latitude,
              longitude: coordinates?.longitude,
              accuracy: coordinates?.accuracy,
            }
          : { action: "keluar" };

      const response = await fetch("/api/siswa/aktivitas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Absensi gagal disimpan.");
      }

      setMessage(
        data.message ||
          (action === "masuk"
            ? "Absensi masuk berhasil."
            : "Absensi keluar berhasil.")
      );

      if (action === "masuk") {
        setSelfieData("");
        setCoordinates(null);
      }

      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setProcessing(false);
    }
  };

  const submitReport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (kegiatan.trim().length < 5) {
      setError("Kegiatan minimal harus terdiri dari 5 karakter.");
      return;
    }

    try {
      setSavingReport(true);
      setError("");
      setMessage("");

      const response = await fetch("/api/siswa/aktivitas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "laporan",
          kegiatan: kegiatan.trim(),
          hasil: hasil.trim(),
          kendala: kendala.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Gagal menyimpan laporan.");
      }

      setMessage(data.message || "Laporan kegiatan berhasil disimpan.");

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal menyimpan laporan."
      );
    } finally {
      setSavingReport(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb]">
      <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-xl sm:px-7">
        <div>
          <h1 className="text-sm font-black text-slate-900">
            Aktivitas PKL
          </h1>
          <p className="text-[11px] text-slate-400">
            Absensi dan laporan kegiatan
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          ↻ Refresh
        </button>
      </header>

      <main className="mx-auto max-w-[1100px] space-y-7 p-4 sm:p-7">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0A1F44] via-[#0F2A5F] to-[#1A4A8C] p-6 text-white shadow-xl shadow-blue-900/20 sm:p-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl"
          />

          <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-cyan-300">
                <span className="h-2 w-2 rounded-full bg-cyan-400" />
                STRIDE SISWA
              </p>

              <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">
                Aktivitas Praktik Kerja Lapangan
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100/80">
                Semua kebutuhan aktivitas PKL tersedia dalam satu halaman.
              </p>

              <nav
                aria-label="Breadcrumb"
                className="mt-4 flex items-center gap-2 text-xs text-blue-100/70"
              >
                <Link href="/siswa" className="transition hover:text-white">
                  Dashboard
                </Link>
                <span>/</span>
                <span className="font-semibold text-cyan-300">
                  Aktivitas PKL
                </span>
              </nav>
            </div>

            <div className="shrink-0 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-blue-50 backdrop-blur">
              <span className="mr-2 text-lg">📅</span>
              {new Date().toLocaleDateString("id-ID", {
                timeZone: "Asia/Jakarta",
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </div>
          </div>
        </section>

        <nav className="flex flex-wrap gap-2">
          <a
            href="#absensi"
            className="rounded-xl bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700"
          >
            Absensi
          </a>

          <a
            href="#laporan"
            className="rounded-xl bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700"
          >
            Laporan Kegiatan
          </a>
        </nav>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
            {message}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
            Memuat data aktivitas PKL...
          </div>
        ) : (
          <>
            <section id="absensi" className="scroll-mt-24 space-y-4">
              <div>
                <h3 className="mt-1 text-xl font-black text-slate-900">
                  Absensi Harian
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Lakukan absensi masuk dan keluar dengan verifikasi GPS serta selfie.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-bold text-slate-400">
                    ABSENSI MASUK
                  </p>

                  <p className="mt-3 text-3xl font-black text-slate-900">
                    {formatTime(todayAttendance?.jam_masuk || null)}
                  </p>

                  <p className="mt-2 text-xs font-bold text-blue-600">
                    {sudahMasuk ? "Sudah absen masuk" : "Belum absen masuk"}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-bold text-slate-400">
                    ABSENSI KELUAR
                  </p>

                  <p className="mt-3 text-3xl font-black text-slate-900">
                    {formatTime(todayAttendance?.jam_keluar || null)}
                  </p>

                  <p className="mt-2 text-xs font-bold text-emerald-600">
                    {sudahKeluar ? "Sudah absen keluar" : "Belum absen keluar"}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="font-black text-slate-900">
                      1. Verifikasi GPS
                    </h4>

                    <p className="mt-1 text-xs text-slate-500">
                      Pastikan lokasi GPS berada dalam radius absensi yang ditentukan.
                    </p>
                  </div>

                  <span className="rounded-full bg-violet-50 px-3 py-1 text-[10px] font-black text-violet-700">
                    WAJIB
                  </span>
                </div>

                <button
                  type="button"
                  onClick={ambilGPS}
                  disabled={gpsLoading || sudahMasuk}
                  className="mt-4 rounded-xl bg-violet-700 px-5 py-3 text-sm font-bold text-white hover:bg-violet-800 disabled:opacity-50"
                >
                  {gpsLoading
                    ? "Mengambil lokasi..."
                    : coordinates
                      ? "Ambil Ulang Lokasi GPS"
                      : "Ambil Lokasi GPS"}
                </button>

                {coordinates && (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-[10px] font-black text-slate-400">
                        LATITUDE
                      </p>

                      <p className="mt-2 break-all text-sm font-bold text-slate-800">
                        {coordinates.latitude}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-[10px] font-black text-slate-400">
                        LONGITUDE
                      </p>

                      <p className="mt-2 break-all text-sm font-bold text-slate-800">
                        {coordinates.longitude}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-[10px] font-black text-slate-400">
                        AKURASI GPS
                      </p>

                      <p className="mt-2 text-sm font-bold text-slate-800">
                        ± {Math.round(coordinates.accuracy)} meter
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-[10px] font-black text-slate-400">
                        JARAK DARI INSTANSI
                      </p>

                      <p className="mt-2 text-sm font-bold text-slate-800">
                        {jarak === null ? "-" : `${Math.round(jarak)} meter`}
                      </p>
                    </div>
                  </div>
                )}

                {coordinates && !gpsAkurat && (
                  <div className="mt-4 rounded-xl bg-amber-50 p-4 text-sm font-bold text-amber-700">
                    Akurasi GPS belum memenuhi syarat. Maksimal ±{MAX_GPS_ACCURACY} meter. Silakan ambil ulang lokasi.
                  </div>
                )}

                {coordinates && !lokasiSiap && (
                  <div className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-700">
                    Koordinat lokasi PKL belum diatur Admin. Absensi masuk belum dapat dilakukan.
                  </div>
                )}

                {coordinates && lokasiSiap && (
                  <div
                    className={`mt-4 rounded-xl p-4 text-sm font-bold ${
                      dalamRadius
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {dalamRadius
                      ? "✓ Lokasi berada dalam radius absensi."
                      : `✕ Lokasi berada di luar radius ${radius} meter.`}
                  </div>
                )}

                {location && (
                  <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
                    <p className="font-bold">Lokasi PKL terdaftar</p>
                    <p className="mt-1">{location.nama_instansi}</p>
                    <p className="mt-1 text-xs">
                      Radius absensi: {radius} meter
                    </p>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="font-black text-slate-900">
                      2. Foto Selfie
                    </h4>

                    <p className="mt-1 text-xs text-slate-500">
                      Ambil foto sebagai bukti kehadiran.
                    </p>
                  </div>

                  <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black text-blue-700">
                    WAJIB
                  </span>
                </div>

                <div className="mt-4 overflow-hidden rounded-2xl bg-slate-950">
                  {cameraOpen ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="max-h-[420px] w-full object-cover"
                    />
                  ) : selfieData ? (
                    <img
                      src={selfieData}
                      alt="Foto selfie absensi"
                      className="mx-auto max-h-[420px] w-full object-contain"
                    />
                  ) : (
                    <div className="flex min-h-[210px] flex-col items-center justify-center text-white">
                      <span className="text-5xl">📷</span>

                      <p className="mt-3 text-sm font-bold">
                        Belum ada foto selfie
                      </p>
                    </div>
                  )}
                </div>

                <canvas ref={canvasRef} className="hidden" />

                <div className="mt-4 flex flex-wrap gap-3">
                  {!cameraOpen ? (
                    <button
                      type="button"
                      onClick={startCamera}
                      disabled={cameraLoading || sudahMasuk}
                      className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-50"
                    >
                      {cameraLoading
                        ? "Membuka kamera..."
                        : selfieData
                          ? "Ambil Ulang Foto"
                          : "Buka Kamera"}
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={captureSelfie}
                        className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white"
                      >
                        Ambil Foto
                      </button>

                      <button
                        type="button"
                        onClick={stopCamera}
                        className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600"
                      >
                        Tutup Kamera
                      </button>
                    </>
                  )}

                  {selfieData && !cameraOpen && (
                    <button
                      type="button"
                      onClick={() => setSelfieData("")}
                      disabled={sudahMasuk}
                      className="rounded-xl border border-red-200 px-5 py-3 text-sm font-bold text-red-600 disabled:opacity-50"
                    >
                      Hapus Foto
                    </button>
                  )}
                </div>

                {selfieData && (
                  <p className="mt-3 text-xs font-bold text-emerald-600">
                    ✓ Foto selfie siap digunakan.
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <h4 className="font-black text-slate-900">
                  3. Konfirmasi Absensi
                </h4>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => submitAttendance("masuk")}
                    disabled={
                      processing ||
                      sudahMasuk ||
                      !selfieData ||
                      !coordinates ||
                      !gpsAkurat ||
                      !lokasiSiap ||
                      !dalamRadius
                    }
                    className="rounded-xl bg-blue-700 px-5 py-4 text-sm font-black text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {processing
                      ? "Memproses..."
                      : sudahMasuk
                        ? "Sudah Absen Masuk"
                        : "ABSENSI MASUK"}
                  </button>

                  <button
                    type="button"
                    onClick={() => submitAttendance("keluar")}
                    disabled={processing || !sudahMasuk || sudahKeluar}
                    className="rounded-xl bg-emerald-600 px-5 py-4 text-sm font-black text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {processing
                      ? "Memproses..."
                      : sudahKeluar
                        ? "Sudah Absen Keluar"
                        : "ABSENSI KELUAR"}
                  </button>
                </div>

                <p className="mt-4 text-xs leading-6 text-slate-400">
                  Absensi masuk membutuhkan foto selfie dan GPS dengan akurasi maksimal 100 meter dalam radius yang diizinkan. Absensi keluar dapat dilakukan setelah absensi masuk berhasil.
                </p>
              </div>
            </section>

            <section id="laporan" className="scroll-mt-24 space-y-4">
              <div>
                <h3 className="mt-1 text-xl font-black text-slate-900">
                  Laporan Kegiatan
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Catat kegiatan, hasil pekerjaan, dan kendala selama PKL.
                </p>
              </div>

              <form
                onSubmit={submitReport}
                className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h4 className="font-black text-slate-900">
                    Form Laporan Harian
                  </h4>

                  <span className="rounded-full bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">
                    {new Date().toLocaleDateString("id-ID", {
                      timeZone: "Asia/Jakarta",
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>

                {reports.some(
                  (item) => dateOnly(item.tanggal) === getToday()
                ) && (
                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
                    Kamu sudah memiliki laporan untuk hari ini. Form telah diisi dengan data laporan yang tersimpan.
                  </div>
                )}

                <div>
                  <label
                    htmlFor="kegiatan"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    Kegiatan yang Dilakukan{" "}
                    <span className="text-red-500">*</span>
                  </label>

                  <textarea
                    id="kegiatan"
                    value={kegiatan}
                    onChange={(e) => setKegiatan(e.target.value)}
                    required
                    minLength={5}
                    maxLength={5000}
                    rows={5}
                    placeholder="Tuliskan kegiatan yang kamu lakukan hari ini..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />

                  <p className="mt-1 text-right text-xs text-slate-400">
                    {kegiatan.length}/5000 karakter
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="hasil"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    Hasil yang Diperoleh
                  </label>

                  <textarea
                    id="hasil"
                    value={hasil}
                    onChange={(e) => setHasil(e.target.value)}
                    maxLength={3000}
                    rows={4}
                    placeholder="Tuliskan hasil atau pengetahuan yang diperoleh..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />

                  <p className="mt-1 text-right text-xs text-slate-400">
                    {hasil.length}/3000 karakter
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="kendala"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    Kendala yang Dihadapi
                  </label>

                  <textarea
                    id="kendala"
                    value={kendala}
                    onChange={(e) => setKendala(e.target.value)}
                    maxLength={3000}
                    rows={4}
                    placeholder="Tuliskan kendala yang kamu alami, atau isi Tidak ada..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />

                  <p className="mt-1 text-right text-xs text-slate-400">
                    {kendala.length}/3000 karakter
                  </p>
                </div>

                <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
                  <button
                    type="button"
                    onClick={() => {
                      setKegiatan("");
                      setHasil("");
                      setKendala("");
                      setError("");
                      setMessage("");
                    }}
                    disabled={savingReport}
                    className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Kosongkan
                  </button>

                  <button
                    type="submit"
                    disabled={savingReport}
                    className="rounded-xl bg-blue-700 px-6 py-3 text-sm font-black text-white hover:bg-blue-800 disabled:opacity-50"
                  >
                    {savingReport ? "Menyimpan..." : "Simpan Laporan"}
                  </button>
                </div>
              </form>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5">
                <div>
                  <h4 className="font-black text-slate-900">
                    Riwayat Laporan
                  </h4>

                  <p className="mt-1 text-xs text-slate-500">
                    Total {reports.length} laporan kegiatan tersimpan.
                  </p>
                </div>

                <Link
                  href="/siswa/riwayat"
                  className="rounded-xl bg-slate-900 px-4 py-3 text-xs font-bold text-white hover:bg-slate-700"
                >
                  Lihat Semua Riwayat →
                </Link>
              </div>
            </section>
          </>
        )}

        <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} STRIDE — Sistem Informasi PKL
        </footer>
      </main>
    </div>
  );
}
