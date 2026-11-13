
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Attendance = {
  id: number;
  tanggal: string;
  jam_masuk: string | null;
  jam_keluar: string | null;
  latitude?: number | null;
  longitude?: number | null;
  jarak_meter?: number | null;
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

export default function AbsensiPage() {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [location, setLocation] = useState<PklLocation | null>(null);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);

  const [selfieData, setSelfieData] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [loading, setLoading] = useState(true);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/siswa/aktivitas", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Gagal mengambil data absensi.");
      }

      setAttendance(
        Array.isArray(data.attendance)
          ? data.attendance
          : data.attendance
            ? [data.attendance]
            : []
      );

      if (data.pklLocation) {
        setLocation({
          ...data.pklLocation,
          latitude:
            data.pklLocation.latitude === null ||
            data.pklLocation.latitude === undefined
              ? null
              : Number(data.pklLocation.latitude),
          longitude:
            data.pklLocation.longitude === null ||
            data.pklLocation.longitude === undefined
              ? null
              : Number(data.pklLocation.longitude),
          radius_absensi: Number(
            data.pklLocation.radius_absensi || 100
          ),
        });
      } else {
        setLocation(null);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengambil data absensi."
      );
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
    video.srcObject = cameraStreamRef.current;

    video.play().catch(() => {
      setError("Kamera tidak dapat dijalankan.");
    });
  }, [cameraOpen]);

  useEffect(() => {
    return () => {
      cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const stopCamera = () => {
    cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    cameraStreamRef.current = null;
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
          "Browser tidak mendukung kamera. Gunakan HTTPS atau localhost."
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

      cameraStreamRef.current = stream;
      setCameraOpen(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Tidak dapat mengakses kamera. Periksa izin kamera browser."
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

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });

        setGpsLoading(false);
        setMessage("Lokasi GPS berhasil didapatkan.");
      },
      (geoError) => {
        let text = "Gagal mendapatkan lokasi GPS.";

        if (geoError.code === 1) {
          text = "Izin lokasi ditolak. Aktifkan izin lokasi browser.";
        } else if (geoError.code === 2) {
          text = "Lokasi tidak tersedia. Periksa GPS perangkat.";
        } else if (geoError.code === 3) {
          text = "Waktu mendapatkan lokasi habis. Silakan coba lagi.";
        }

        setError(text);
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
    attendance.find((item) => dateOnly(item.tanggal) === getToday()) ||
    null;

  const lokasiSiap =
    location !== null &&
    location.latitude !== null &&
    location.longitude !== null &&
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
  const dalamRadius = jarak !== null && jarak <= radius;
  const sudahMasuk = Boolean(todayAttendance?.jam_masuk);
  const sudahKeluar = Boolean(todayAttendance?.jam_keluar);

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

        if (!lokasiSiap) {
          throw new Error(
            "Koordinat lokasi PKL belum tersedia. Hubungi Admin."
          );
        }

        if (coordinates.accuracy > 50) {
          throw new Error(
            "Akurasi GPS harus maksimal 50 meter. Coba ambil GPS kembali di area terbuka."
          );
        }

        if (!dalamRadius) {
          throw new Error(
            `Kamu berada di luar radius absensi. Jarak saat ini ${Math.round(
              jarak || 0
            )} meter, sedangkan radius yang diizinkan ${radius} meter.`
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Absensi gagal disimpan.");
      }

      setMessage(data.message || "Absensi berhasil disimpan.");

      if (action === "masuk") {
        setSelfieData("");
        setCoordinates(null);
      }

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Terjadi kesalahan."
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb]">
      <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-xl sm:px-7">
        <div>
          <h1 className="text-sm font-black text-slate-900">
            Absensi PKL
          </h1>
          <p className="text-[11px] text-slate-400">
            Pencatatan kehadiran menggunakan selfie dan GPS
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          Refresh
        </button>
      </header>

      <main className="mx-auto max-w-[1100px] space-y-6 p-4 sm:p-7">
        <section>
          <p className="text-[10px] font-black tracking-[0.2em] text-blue-600">
            KEHADIRAN SISWA
          </p>
          <h2 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
            Absensi Harian
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Ambil selfie dan verifikasi lokasi sebelum melakukan absensi masuk.
          </p>
        </section>

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
          <div className="rounded-2xl bg-white p-8 text-sm text-slate-500 shadow-sm">
            Memuat data absensi...
          </div>
        ) : (
          <>
            <section className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-bold text-slate-400">
                  ABSENSI MASUK
                </p>
                <p className="mt-3 text-3xl font-black text-slate-900">
                  {formatTime(todayAttendance?.jam_masuk || null)}
                </p>
                <p className="mt-2 text-xs font-bold text-blue-600">
                  {sudahMasuk
                    ? "Sudah melakukan absensi masuk"
                    : "Belum absen masuk"}
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
                  {sudahKeluar
                    ? "Sudah melakukan absensi keluar"
                    : "Belum absen keluar"}
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h3 className="font-black text-slate-900">Lokasi PKL</h3>

              {location ? (
                <>
                  <p className="mt-3 text-lg font-black text-slate-800">
                    {location.nama_instansi}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {location.lokasi || "Alamat belum tersedia"}
                  </p>
                  <p className="mt-3 text-xs font-bold text-blue-700">
                    Radius absensi: {radius} meter
                  </p>

                  {lokasiSiap ? (
                    <p className="mt-2 text-xs text-emerald-700">
                      Koordinat lokasi sudah tersedia.
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-red-600">
                      Koordinat lokasi belum diatur Admin.
                    </p>
                  )}
                </>
              ) : (
                <p className="mt-3 text-sm text-amber-700">
                  Data penempatan PKL yang disetujui belum ditemukan.
                </p>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div>
                <h3 className="font-black text-slate-900">
                  1. Foto Selfie
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Ambil foto wajah sebagai bukti kehadiran.
                </p>
              </div>

              <div className="mt-5 overflow-hidden rounded-2xl bg-slate-950">
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
                  <div className="flex min-h-[230px] flex-col items-center justify-center text-white">
                    <span className="text-5xl">📷</span>
                    <p className="mt-4 text-sm font-bold">
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
                      className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700"
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
                  Foto selfie siap digunakan.
                </p>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h3 className="font-black text-slate-900">
                2. Verifikasi GPS
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Pastikan GPS perangkat aktif dan browser mendapat izin lokasi.
              </p>

              <button
                type="button"
                onClick={ambilGPS}
                disabled={gpsLoading || sudahMasuk}
                className="mt-5 rounded-xl bg-violet-700 px-5 py-3 text-sm font-bold text-white hover:bg-violet-800 disabled:opacity-50"
              >
                {gpsLoading ? "Mengambil lokasi..." : "Ambil Lokasi GPS"}
              </button>

              {coordinates && (
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-[10px] font-black text-slate-400">
                      LATITUDE GPS
                    </p>
                    <p className="mt-2 break-all text-sm font-bold text-slate-800">
                      {coordinates.latitude}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-[10px] font-black text-slate-400">
                      LONGITUDE GPS
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

              {coordinates && !lokasiSiap && (
                <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm font-semibold text-amber-700">
                  Koordinat lokasi PKL belum tersedia dari data penempatan.
                </p>
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
                    ? "Lokasi berada dalam radius absensi."
                    : `Lokasi berada di luar radius ${radius} meter.`}
                </div>
              )}

              {coordinates && coordinates.accuracy > 50 && (
                <p className="mt-3 rounded-xl bg-amber-50 p-4 text-sm font-semibold text-amber-700">
                  Akurasi GPS lebih dari 50 meter. Ambil lokasi kembali di area terbuka.
                </p>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h3 className="font-black text-slate-900">
                3. Konfirmasi Kehadiran
              </h3>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => submitAttendance("masuk")}
                  disabled={
                    processing ||
                    sudahMasuk ||
                    !selfieData ||
                    !coordinates ||
                    !lokasiSiap ||
                    !dalamRadius ||
                    coordinates.accuracy > 50
                  }
                  className="rounded-xl bg-blue-700 px-5 py-4 text-sm font-black text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
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
                  className="rounded-xl bg-emerald-600 px-5 py-4 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {processing
                    ? "Memproses..."
                    : sudahKeluar
                      ? "Sudah Absen Keluar"
                      : "ABSENSI KELUAR"}
                </button>
              </div>

              <p className="mt-4 text-xs leading-6 text-slate-400">
                Absensi masuk memerlukan foto selfie dan lokasi GPS dengan
                akurasi maksimal 50 meter serta berada dalam radius yang
                ditentukan Admin. Absensi keluar dapat dilakukan setelah
                berhasil melakukan absensi masuk.
              </p>
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
