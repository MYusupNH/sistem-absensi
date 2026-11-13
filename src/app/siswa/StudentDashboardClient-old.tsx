
"use client";

import Image from "next/image";
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

type Props = {
  fullName: string;
  email: string;
};

type Coordinates = {
  latitude: number;
  longitude: number;
  accuracy: number;
};

function dateOnly(value: string | null | undefined): string {
  if (!value) return "";

  const match = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
  }).format(date);
}

function formatTime(value: string | null | undefined): string {
  if (!value) return "--:--";

  const match = String(value).match(/^(\d{1,2}):(\d{2})(?::\d{2})?/);

  if (match) {
    return `${match[1].padStart(2, "0")}:${match[2]}`;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";

  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

function formatDate(value: string | null | undefined): string {
  const key = dateOnly(value);
  if (!key) return "-";

  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(year, month - 1, day, 12);

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function getToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
  }).format(new Date());
}

function hitungJarak(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371000;
  const toRad = (value: number) => (value * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-5">
      <p className="text-[10px] font-black tracking-[0.2em] text-blue-600">
        {eyebrow}
      </p>
      <h2 className="mt-1.5 text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
        {title}
      </h2>
      <p className="mt-1 text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}

export default function StudentDashboardClient({
  fullName,
  email,
}: Props) {
  const [attendance, setAttendance] = useState<Attendance | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [pklLocation, setPklLocation] = useState<PklLocation | null>(null);

  const [kegiatan, setKegiatan] = useState("");
  const [hasil, setHasil] = useState("");
  const [kendala, setKendala] = useState("");

  const [selfieData, setSelfieData] = useState("");
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);

  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [savingReport, setSavingReport] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  const sudahMasuk = Boolean(attendance?.jam_masuk);
  const sudahKeluar = Boolean(attendance?.jam_keluar);

  const lokasiSiap = Boolean(
    pklLocation &&
      pklLocation.latitude !== null &&
      pklLocation.longitude !== null &&
      Number.isFinite(Number(pklLocation.latitude)) &&
      Number.isFinite(Number(pklLocation.longitude))
  );

  const jarakSaatIni =
    coordinates && lokasiSiap && pklLocation
      ? hitungJarak(
          coordinates.latitude,
          coordinates.longitude,
          Number(pklLocation.latitude),
          Number(pklLocation.longitude)
        )
      : null;

  const radius = Number(pklLocation?.radius_absensi || 100);
  const dalamRadius = jarakSaatIni !== null && jarakSaatIni <= radius;

  const firstName = fullName.split(" ")[0] || "Siswa";

  const todayLabel = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date());

  const loadData = useCallback(async () => {
    try {
      const response = await fetch("/api/siswa/aktivitas", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Gagal mengambil data.");
      }

      setAttendance(data.attendance || null);
      setReports(data.reports || []);
      setPklLocation(data.pklLocation || null);

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
      setError(err instanceof Error ? err.message : "Gagal memuat data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!cameraOpen || !cameraStreamRef.current || !videoRef.current) {
      return;
    }

    const video = videoRef.current;
    const stream = cameraStreamRef.current;

    video.srcObject = stream;

    const handleReady = () => {
      setCameraReady(true);
      video.play().catch((err) => {
        console.error("Gagal memutar kamera:", err);
        setError("Video kamera gagal dijalankan.");
      });
    };

    video.addEventListener("loadedmetadata", handleReady);

    if (video.readyState >= 1) {
      handleReady();
    }

    return () => {
      video.removeEventListener("loadedmetadata", handleReady);
    };
  }, [cameraOpen]);

  useEffect(() => {
    return () => {
      cameraStreamRef.current?.getTracks().forEach((track) => {
        track.stop();
      });
    };
  }, []);

  async function startCamera() {
    setError("");
    setMessage("");
    setCameraReady(false);

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Kamera tidak tersedia. Gunakan HTTPS atau localhost.");
      return;
    }

    try {
      setCameraLoading(true);

      cameraStreamRef.current?.getTracks().forEach((track) => {
        track.stop();
      });

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: "user",
          width: { ideal: 720 },
          height: { ideal: 720 },
        },
      });

      cameraStreamRef.current = stream;
      setCameraOpen(true);
    } catch (err) {
      console.error(err);
      setError(
        "Tidak dapat membuka kamera. Izinkan akses kamera pada browser dan pastikan kamera tidak sedang digunakan aplikasi lain."
      );
    } finally {
      setCameraLoading(false);
    }
  }

  function stopCamera() {
    cameraStreamRef.current?.getTracks().forEach((track) => {
      track.stop();
    });

    cameraStreamRef.current = null;
    setCameraReady(false);
    setCameraOpen(false);
  }

  function captureSelfie() {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || !video.videoWidth || !cameraReady) {
      setError("Kamera belum siap. Tunggu sampai video muncul.");
      return;
    }

    const maxWidth = 720;
    const scale = Math.min(1, maxWidth / video.videoWidth);

    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);

    const context = canvas.getContext("2d");

    if (!context) {
      setError("Gagal mengambil foto.");
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const photo = canvas.toDataURL("image/jpeg", 0.75);

    setSelfieData(photo);
    stopCamera();
    setMessage("Foto selfie berhasil diambil.");
    setError("");
  }

  function ambilGPS() {
    setError("");
    setMessage("");

    if (!navigator.geolocation) {
      setError("Browser tidak mendukung layanan GPS.");
      return;
    }

    setGpsLoading(true);
    setCoordinates(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });

        setGpsLoading(false);
        setMessage("Lokasi GPS berhasil diperoleh.");
      },
      (gpsError) => {
        setGpsLoading(false);

        if (gpsError.code === 1) {
          setError("Izin GPS ditolak. Aktifkan izin lokasi browser.");
        } else if (gpsError.code === 2) {
          setError("Lokasi tidak tersedia. Aktifkan GPS perangkat.");
        } else {
          setError("Waktu mengambil lokasi habis. Coba lagi.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      }
    );
  }

  async function submitAttendance(action: "masuk" | "keluar") {
    setProcessing(true);
    setMessage("");
    setError("");

    try {
      let body: Record<string, unknown> = { action };

      if (action === "masuk") {
        if (!selfieData) {
          throw new Error("Silakan ambil foto selfie terlebih dahulu.");
        }

        if (!coordinates) {
          throw new Error("Silakan ambil lokasi GPS terlebih dahulu.");
        }

        if (!lokasiSiap || !pklLocation) {
          throw new Error("Koordinat tempat PKL belum diatur oleh Admin.");
        }

        if (!dalamRadius) {
          throw new Error(
            `Kamu berada di luar lokasi PKL. Jarak sekitar ${Math.round(
              jarakSaatIni || 0
            )} meter. Batas absensi ${radius} meter.`
          );
        }

        body = {
          action: "masuk",
          selfieData,
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
        };
      }

      const response = await fetch("/api/siswa/aktivitas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Absensi gagal.");
      }

      setMessage(data.message || "Absensi berhasil.");

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
  }

  async function submitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSavingReport(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/siswa/aktivitas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "laporan",
          kegiatan,
          hasil,
          kendala,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Laporan gagal disimpan.");
      }

      setMessage(data.message || "Laporan berhasil disimpan.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setSavingReport(false);
    }
  }

  const navigation = [
    { label: "Dashboard", icon: "▦", href: "#dashboard" },
    { label: "Lokasi PKL", icon: "⌖", href: "#lokasi" },
    { label: "Absensi", icon: "◷", href: "#absensi" },
    { label: "Laporan Kegiatan", icon: "▤", href: "#laporan" },
    { label: "Riwayat Laporan", icon: "◴", href: "#riwayat" },
  ];

  return (
    <main className="min-h-screen bg-[#f4f7fb] text-slate-800">
      {/* MOBILE OVERLAY */}
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Tutup menu"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col bg-[#102344] text-white transition-transform duration-300 lg:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-[82px] items-center justify-between border-b border-white/10 px-6">
          <div className="flex items-center gap-3">
            <div className="relative h-11 w-11 overflow-hidden rounded-xl bg-white p-1">
              <Image
                src="/logo.png"
                alt="Logo STRIDE"
                fill
                priority
                sizes="44px"
                className="object-contain p-1"
              />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-wide">STRIDE</h1>
              <p className="text-[9px] font-bold tracking-[0.2em] text-blue-200">
                STUDENT PORTAL
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="rounded-lg p-2 text-slate-300 hover:bg-white/10 lg:hidden"
          >
            ✕
          </button>
        </div>

        <div className="border-b border-white/10 px-5 py-5">
          <div className="flex items-center gap-3 rounded-2xl bg-white/[0.07] p-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cyan-500 text-lg font-black text-white">
              {firstName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{fullName}</p>
              <p className="mt-1 truncate text-[11px] text-blue-200">
                Siswa PKL
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
          <p className="mb-3 px-3 text-[10px] font-black tracking-[0.2em] text-blue-300/60">
            MENU UTAMA
          </p>

          {navigation.map((item, index) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                index === 0
                  ? "bg-cyan-500 text-white shadow-lg shadow-cyan-950/20"
                  : "text-blue-100 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span className="flex h-6 w-6 items-center justify-center text-lg">
                {item.icon}
              </span>
              {item.label}
            </a>
          ))}

          <div className="my-5 border-t border-white/10" />

          <p className="mb-3 px-3 text-[10px] font-black tracking-[0.2em] text-blue-300/60">
            DOKUMEN
          </p>

          <Link
            href="/siswa/laporan-akhir"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-blue-100 transition hover:bg-white/10 hover:text-white"
          >
            <span className="flex h-6 w-6 items-center justify-center text-lg">
              ▧
            </span>
            Laporan Akhir PKL
          </Link>
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="mb-3 rounded-xl bg-white/[0.06] p-3">
            <p className="text-[10px] font-bold tracking-wider text-blue-200">
              AKUN SISWA
            </p>
            <p className="mt-1 truncate text-xs text-white">{email}</p>
          </div>

          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-red-200 transition hover:bg-red-500/10 hover:text-red-100"
            >
              <span className="text-lg">↪</span>
              Keluar dari akun
            </button>
          </form>

          <p className="mt-4 text-center text-[10px] text-blue-300/50">
            © {new Date().getFullYear()} STRIDE
          </p>
        </div>
      </aside>

      {/* MAIN AREA */}
      <div className="min-h-screen lg:pl-[270px]">
        {/* TOPBAR */}
        <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-xl sm:px-7">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-xl text-slate-700 hover:bg-slate-50 lg:hidden"
            >
              ☰
            </button>

            <div>
              <p className="text-sm font-black text-slate-900">
                Portal Siswa
              </p>
              <p className="text-[11px] text-slate-400">
                Sistem Informasi Praktik Kerja Lapangan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-xs font-bold text-slate-800">{fullName}</p>
              <p className="text-[10px] text-slate-400">Peserta PKL</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-black text-blue-700">
              {firstName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1500px] space-y-7 p-4 sm:p-7 lg:p-8">
          {/* ALERT */}
          {message && (
            <div
              role="status"
              className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-800"
            >
              <span className="text-lg">✓</span>
              <p>{message}</p>
              <button
                type="button"
                onClick={() => setMessage("")}
                className="ml-auto"
              >
                ✕
              </button>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700"
            >
              <span className="text-lg">!</span>
              <p>{error}</p>
              <button
                type="button"
                onClick={() => setError("")}
                className="ml-auto"
              >
                ✕
              </button>
            </div>
          )}

          {/* DASHBOARD HERO */}
          <section id="dashboard" className="scroll-mt-24">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#102344] via-[#174b88] to-[#087e9f] p-6 text-white shadow-xl shadow-blue-950/10 sm:p-8">
              <div className="absolute -right-10 -top-24 h-72 w-72 rounded-full border-[35px] border-white/[0.06]" />
              <div className="absolute -bottom-32 right-52 h-64 w-64 rounded-full bg-cyan-300/10 blur-3xl" />

              <div className="relative max-w-2xl">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-black tracking-[0.15em] text-cyan-100">
                  <span className="h-2 w-2 rounded-full bg-emerald-300" />
                  STUDENT DASHBOARD
                </span>

                <h2 className="mt-5 text-2xl font-black leading-tight sm:text-4xl">
                  Selamat Datang, {firstName}!
                </h2>

                <p className="mt-3 max-w-xl text-sm leading-7 text-blue-100">
                  Pantau kehadiran, catat aktivitas harian, dan kelola
                  dokumen Praktik Kerja Lapangan melalui satu portal.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <span className="rounded-lg border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold">
                    📅 {todayLabel}
                  </span>
                  <span className="rounded-lg border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold">
                    🎓 Peserta Praktik Kerja Lapangan
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* SUMMARY CARDS */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-500">
                  Absensi Masuk
                </p>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-xl text-emerald-600">
                  ↘
                </span>
              </div>
              <p className="mt-4 text-2xl font-black text-slate-900">
                {loading ? "..." : formatTime(attendance?.jam_masuk)}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {sudahMasuk ? "Sudah tercatat hari ini" : "Belum melakukan absensi"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-500">
                  Absensi Keluar
                </p>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-xl text-blue-600">
                  ↗
                </span>
              </div>
              <p className="mt-4 text-2xl font-black text-slate-900">
                {loading ? "..." : formatTime(attendance?.jam_keluar)}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {sudahKeluar ? "Sudah tercatat hari ini" : "Menunggu absensi keluar"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-500">
                  Laporan Tersimpan
                </p>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-xl text-violet-600">
                  ▤
                </span>
              </div>
              <p className="mt-4 text-2xl font-black text-slate-900">
                {loading ? "..." : reports.length}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Laporan kegiatan tersedia
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-500">
                  Status Hari Ini
                </p>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-xl text-orange-600">
                  ◷
                </span>
              </div>
              <p className="mt-4 text-lg font-black text-slate-900">
                {loading
                  ? "Memuat..."
                  : sudahKeluar
                    ? "Selesai"
                    : sudahMasuk
                      ? "Sedang PKL"
                      : "Belum Hadir"}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Status kehadiran hari ini
              </p>
            </div>
          </section>

          {/* FINAL REPORT CARD */}
          <section className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
            <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-2xl">
                  📄
                </div>
                <div>
                  <span className="rounded-full bg-orange-100 px-3 py-1 text-[10px] font-black tracking-wider text-orange-700">
                    DOKUMEN PKL
                  </span>
                  <h3 className="mt-2 text-lg font-black text-slate-900">
                    Laporan Akhir PKL
                  </h3>
                  <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">
                    Unggah laporan akhir dalam format PDF untuk diperiksa
                    oleh guru pembimbing.
                  </p>
                </div>
              </div>

              <Link
                href="/siswa/laporan-akhir"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-700 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-800"
              >
                Upload Laporan <span>→</span>
              </Link>
            </div>
          </section>

          {/* LOCATION */}
          <section id="lokasi" className="scroll-mt-24">
            <SectionTitle
              eyebrow="INFORMASI PENEMPATAN"
              title="Lokasi PKL"
              description="Informasi instansi dan lokasi yang digunakan untuk verifikasi absensi."
            />

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-cyan-50 text-2xl">
                  📍
                </div>

                <div className="min-w-0 flex-1">
                  {loading ? (
                    <div className="h-5 w-48 animate-pulse rounded bg-slate-100" />
                  ) : pklLocation ? (
                    <>
                      <h3 className="text-lg font-black text-slate-900">
                        {pklLocation.nama_instansi}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {pklLocation.judul}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {pklLocation.lokasi}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm font-semibold text-amber-700">
                      Belum ada informasi penempatan PKL.
                    </p>
                  )}
                </div>

                {pklLocation && (
                  <div className="rounded-xl bg-blue-50 px-4 py-3 sm:text-right">
                    <p className="text-[10px] font-bold tracking-wider text-blue-500">
                      RADIUS ABSENSI
                    </p>
                    <p className="mt-1 text-lg font-black text-blue-800">
                      {radius} meter
                    </p>
                  </div>
                )}
              </div>

              {!loading && pklLocation && !lokasiSiap && (
                <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-700">
                  Koordinat tempat PKL belum diatur oleh Admin.
                </p>
              )}
            </div>
          </section>

          {/* ATTENDANCE */}
          <section id="absensi" className="scroll-mt-24">
            <SectionTitle
              eyebrow="KEHADIRAN SISWA"
              title="Absensi Hari Ini"
              description="Lakukan absensi masuk dan keluar sesuai aktivitas PKL."
            />

            <div className="grid gap-5 xl:grid-cols-2">
              {/* CHECK IN */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-xl text-emerald-600">
                    ↘
                  </div>
                  <span
                    className={`rounded-full px-3 py-1.5 text-[10px] font-black ${
                      sudahMasuk
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {sudahMasuk ? "SUDAH ABSEN" : "BELUM ABSEN"}
                  </span>
                </div>

                <p className="mt-5 text-xs font-black tracking-wider text-slate-400">
                  ABSENSI MASUK
                </p>
                <p className="mt-1 text-4xl font-black text-slate-900">
                  {loading ? "..." : formatTime(attendance?.jam_masuk)}
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  Waktu kedatangan di tempat PKL
                </p>

                {!sudahMasuk && (
                  <div className="mt-6 space-y-4">
                    {/* SELFIE */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-bold text-slate-800">
                            1. Foto Selfie
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Ambil foto langsung dari kamera.
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                            selfieData
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {selfieData ? "Sudah Foto" : "Wajib"}
                        </span>
                      </div>

                      {selfieData ? (
                        <div className="mt-4">
                          <img
                            src={selfieData}
                            alt="Foto selfie absensi"
                            className="mx-auto max-h-64 w-full rounded-xl bg-slate-100 object-contain"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setSelfieData("");
                              startCamera();
                            }}
                            className="mt-3 w-full rounded-lg border border-blue-200 bg-white px-4 py-3 text-sm font-bold text-blue-700 hover:bg-blue-50"
                          >
                            Ambil Ulang Foto
                          </button>
                        </div>
                      ) : cameraOpen ? (
                        <div className="mt-4 space-y-3">
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="max-h-80 w-full rounded-xl bg-black object-cover"
                          />
                          <canvas ref={canvasRef} className="hidden" />

                          <div className="grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={captureSelfie}
                              disabled={!cameraReady}
                              className="rounded-lg bg-emerald-600 px-3 py-3 text-sm font-bold text-white disabled:bg-slate-300"
                            >
                              {cameraReady ? "Ambil Foto" : "Menyiapkan..."}
                            </button>
                            <button
                              type="button"
                              onClick={stopCamera}
                              className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-slate-600"
                            >
                              Tutup Kamera
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={startCamera}
                          disabled={cameraLoading}
                          className="mt-4 w-full rounded-lg bg-blue-700 px-4 py-3 text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-50"
                        >
                          {cameraLoading
                            ? "Membuka Kamera..."
                            : "📷 Buka Kamera Selfie"}
                        </button>
                      )}
                    </div>

                    {/* GPS */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-bold text-slate-800">
                            2. Verifikasi GPS
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Periksa jarak dari lokasi PKL.
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                            coordinates
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {coordinates ? "GPS AKTIF" : "BELUM AKTIF"}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={ambilGPS}
                        disabled={gpsLoading || !lokasiSiap}
                        className="mt-4 w-full rounded-lg bg-cyan-700 px-4 py-3 text-sm font-bold text-white hover:bg-cyan-800 disabled:opacity-50"
                      >
                        {gpsLoading
                          ? "Mencari Lokasi..."
                          : coordinates
                            ? "Perbarui Lokasi GPS"
                            : "◎ Aktifkan dan Ambil GPS"}
                      </button>

                      {coordinates && (
                        <div className="mt-4 space-y-2 rounded-lg border border-slate-100 bg-white p-3 text-xs text-slate-600">
                          <p>
                            Latitude:{" "}
                            <strong>{coordinates.latitude.toFixed(7)}</strong>
                          </p>
                          <p>
                            Longitude:{" "}
                            <strong>{coordinates.longitude.toFixed(7)}</strong>
                          </p>
                          <p>
                            Akurasi GPS:{" "}
                            <strong>
                              ±{Math.round(coordinates.accuracy)} meter
                            </strong>
                          </p>

                          {jarakSaatIni !== null && (
                            <>
                              <div className="border-t border-slate-100 pt-2" />
                              <p>
                                Jarak dari lokasi PKL:{" "}
                                <strong>
                                  {Math.round(jarakSaatIni)} meter
                                </strong>
                              </p>
                              <div
                                className={`rounded-lg p-3 font-bold ${
                                  dalamRadius
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {dalamRadius
                                  ? "✓ Lokasi sesuai radius absensi."
                                  : `✕ Di luar radius. Batas ${radius} meter.`}
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={
                        loading ||
                        processing ||
                        !selfieData ||
                        !coordinates ||
                        !lokasiSiap ||
                        !dalamRadius
                      }
                      onClick={() => submitAttendance("masuk")}
                      className="w-full rounded-xl bg-emerald-600 px-5 py-3.5 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      {processing
                        ? "Memproses Absensi..."
                        : "✓ Verifikasi dan Absen Masuk"}
                    </button>
                  </div>
                )}

                {sudahMasuk && (
                  <div className="mt-6 rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
                    ✓ Absensi masuk hari ini sudah berhasil dicatat.
                  </div>
                )}
              </div>

              {/* CHECK OUT */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-xl text-blue-600">
                    ↗
                  </div>
                  <span
                    className={`rounded-full px-3 py-1.5 text-[10px] font-black ${
                      sudahKeluar
                        ? "bg-blue-100 text-blue-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {sudahKeluar ? "SUDAH ABSEN" : "MENUNGGU"}
                  </span>
                </div>

                <p className="mt-5 text-xs font-black tracking-wider text-slate-400">
                  ABSENSI KELUAR
                </p>
                <p className="mt-1 text-4xl font-black text-slate-900">
                  {loading ? "..." : formatTime(attendance?.jam_keluar)}
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  Waktu selesai kegiatan PKL
                </p>

                <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-5">
                  <p className="text-sm font-bold text-blue-950">
                    ℹ️ Informasi Absensi Keluar
                  </p>
                  <p className="mt-2 text-xs leading-6 text-blue-800">
                    Absensi keluar dapat dilakukan setelah kamu berhasil
                    melakukan absensi masuk. Pastikan kegiatan PKL hari ini
                    sudah selesai.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={loading || processing || !sudahMasuk || sudahKeluar}
                  onClick={() => submitAttendance("keluar")}
                  className="mt-6 w-full rounded-xl bg-blue-700 px-5 py-3.5 text-sm font-black text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {processing
                    ? "Memproses..."
                    : sudahKeluar
                      ? "✓ Absensi Keluar Tercatat"
                      : "Absen Keluar Sekarang"}
                </button>
              </div>
            </div>
          </section>

          {/* DAILY REPORT FORM */}
          <section id="laporan" className="scroll-mt-24">
            <SectionTitle
              eyebrow="AKTIVITAS HARIAN"
              title="Laporan Kegiatan"
              description="Dokumentasikan pekerjaan, hasil, dan kendala selama menjalani PKL."
            />

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 text-xl">
                  ✎
                </div>
                <div>
                  <h3 className="font-black text-slate-900">
                    Formulir Aktivitas Harian
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Isi laporan sesuai kegiatan yang benar-benar dilakukan.
                  </p>
                </div>
              </div>

              <form onSubmit={submitReport} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Kegiatan yang Dilakukan{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    minLength={5}
                    maxLength={5000}
                    rows={4}
                    value={kegiatan}
                    onChange={(e) => setKegiatan(e.target.value)}
                    placeholder="Contoh: Membantu menginput data pelanggan, mengarsipkan dokumen, dan membuat laporan..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                  <p className="mt-1 text-right text-[11px] text-slate-400">
                    {kegiatan.length}/5000 karakter
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Hasil Pekerjaan
                  </label>
                  <textarea
                    rows={3}
                    maxLength={3000}
                    value={hasil}
                    onChange={(e) => setHasil(e.target.value)}
                    placeholder="Tuliskan hasil pekerjaan yang telah diselesaikan..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Kendala yang Dihadapi
                  </label>
                  <textarea
                    rows={3}
                    maxLength={3000}
                    value={kendala}
                    onChange={(e) => setKendala(e.target.value)}
                    placeholder="Tuliskan kendala yang dihadapi atau isi dengan Tidak ada..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingReport || loading}
                  className="w-full rounded-xl bg-blue-700 px-5 py-3.5 text-sm font-black text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-52"
                >
                  {savingReport
                    ? "Menyimpan Laporan..."
                    : "Simpan Laporan Kegiatan"}
                </button>

                <p className="text-xs text-slate-400">
                  Laporan hari ini dapat diperbarui dengan mengirim ulang.
                </p>
              </form>
            </div>
          </section>

          {/* REPORT HISTORY */}
          <section
            id="riwayat"
            className="scroll-mt-24 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="border-b border-slate-100 p-5 sm:p-6">
              <p className="text-[10px] font-black tracking-[0.2em] text-blue-600">
                DOKUMENTASI
              </p>
              <h3 className="mt-2 text-xl font-black text-slate-900">
                Riwayat Laporan PKL
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Laporan kegiatan yang sudah kamu simpan.
              </p>
            </div>

            {loading ? (
              <div className="space-y-4 p-6">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="animate-pulse space-y-3">
                    <div className="h-4 w-36 rounded bg-slate-100" />
                    <div className="h-3 w-full rounded bg-slate-100" />
                    <div className="h-3 w-3/4 rounded bg-slate-100" />
                  </div>
                ))}
              </div>
            ) : reports.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {reports.map((report) => (
                  <article
                    key={report.id}
                    className="p-5 transition hover:bg-slate-50/70 sm:p-6"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-slate-900">
                          {formatDate(report.tanggal)}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-400">
                          Laporan kegiatan harian
                        </p>
                      </div>
                      <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-black text-emerald-700">
                        ✓ Tersimpan
                      </span>
                    </div>

                    <div className="mt-4 rounded-xl bg-slate-50 p-4">
                      <p className="mb-2 text-[10px] font-black tracking-wider text-slate-400">
                        KEGIATAN
                      </p>
                      <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                        {report.kegiatan}
                      </p>
                    </div>

                    {report.hasil && (
                      <div className="mt-4">
                        <p className="text-xs font-black text-slate-600">
                          Hasil Pekerjaan
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-500">
                          {report.hasil}
                        </p>
                      </div>
                    )}

                    {report.kendala && (
                      <div className="mt-4">
                        <p className="text-xs font-black text-slate-600">
                          Kendala
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-500">
                          {report.kendala}
                        </p>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <div className="px-6 py-12 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-3xl text-blue-600">
                  ▤
                </div>
                <h4 className="mt-4 font-black text-slate-800">
                  Belum Ada Laporan PKL
                </h4>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                  Laporan kegiatan yang kamu simpan akan muncul di bagian ini.
                </p>
              </div>
            )}
          </section>

          {/* FOOTER */}
          <footer className="border-t border-slate-200 py-6 text-center">
            <p className="text-xs font-semibold text-slate-400">
              © {new Date().getFullYear()} STRIDE
            </p>
            <p className="mt-1 text-[10px] text-slate-400">
              Sistem Informasi Praktik Kerja Lapangan
            </p>
          </footer>
        </div>
      </div>
    </main>
  );
}
