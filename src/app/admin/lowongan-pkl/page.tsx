"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";

type Lowongan = {
  id: number;
  judul: string;
  nama_instansi: string;
  lokasi: string;
  deskripsi: string;
  persyaratan: string;
  jurusan: string;
  kuota: number;
  tanggal_mulai: string | null;
  tanggal_selesai: string | null;
  status: "DIBUKA" | "DITUTUP";
  latitude: number | null;
  longitude: number | null;
  radius_absensi: number;
  created_at: string;
};

type FormData = {
  judul: string;
  nama_instansi: string;
  lokasi: string;
  deskripsi: string;
  persyaratan: string;
  jurusan: string;
  kuota: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  status: "DIBUKA" | "DITUTUP";
  latitude: string;
  longitude: string;
  radius_absensi: string;
};

const initialForm: FormData = {
  judul: "",
  nama_instansi: "",
  lokasi: "",
  deskripsi: "",
  persyaratan: "",
  jurusan: "",
  kuota: "1",
  tanggal_mulai: "",
  tanggal_selesai: "",
  status: "DIBUKA",
  latitude: "",
  longitude: "",
  radius_absensi: "100",
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const labelClass = "mb-2 block text-sm font-bold text-slate-700";

export default function LowonganPKLPage() {
  const [data, setData] = useState<Lowongan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("SEMUA");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success"
  );
  const [form, setForm] = useState<FormData>(initialForm);

  const showMessage = (
    text: string,
    type: "success" | "error" = "success"
  ) => {
    setMessage(text);
    setMessageType(type);
  };

  const loadData = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/admin/lowongan-pkl", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Gagal mengambil data lowongan.");
      }

      setData(result.data || []);
    } catch (error) {
      console.error(error);
      showMessage(
        error instanceof Error
          ? error.message
          : "Gagal mengambil data lowongan PKL.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function updateForm(field: keyof FormData, value: string) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function openAddModal() {
    setEditingId(null);
    setForm(initialForm);
    setModalOpen(true);
  }

  function openEditModal(item: Lowongan) {
    setEditingId(item.id);

    setForm({
      judul: item.judul || "",
      nama_instansi: item.nama_instansi || "",
      lokasi: item.lokasi || "",
      deskripsi: item.deskripsi || "",
      persyaratan: item.persyaratan || "",
      jurusan: item.jurusan || "",
      kuota: String(item.kuota),
      tanggal_mulai: item.tanggal_mulai?.slice(0, 10) || "",
      tanggal_selesai: item.tanggal_selesai?.slice(0, 10) || "",
      status: item.status,
      latitude:
        item.latitude === null || item.latitude === undefined
          ? ""
          : String(item.latitude),
      longitude:
        item.longitude === null || item.longitude === undefined
          ? ""
          : String(item.longitude),
      radius_absensi: String(item.radius_absensi || 100),
    });

    setModalOpen(true);
  }

  function ambilLokasiAdmin() {
    if (!navigator.geolocation) {
      showMessage("Browser ini tidak mendukung fitur GPS.", "error");
      return;
    }

    setGettingLocation(true);
    setMessage("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((previous) => ({
          ...previous,
          latitude: position.coords.latitude.toFixed(7),
          longitude: position.coords.longitude.toFixed(7),
        }));

        setGettingLocation(false);
        showMessage("Koordinat GPS berhasil diambil.");
      },
      (error) => {
        setGettingLocation(false);

        const errorMessage =
          error.code === 1
            ? "Izin lokasi ditolak. Aktifkan izin GPS pada browser."
            : error.code === 2
              ? "Lokasi tidak tersedia. Periksa GPS perangkat Anda."
              : "Waktu pengambilan lokasi habis. Silakan coba kembali.";

        showMessage(errorMessage, "error");
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      }
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      (form.latitude.trim() && !form.longitude.trim()) ||
      (!form.latitude.trim() && form.longitude.trim())
    ) {
      showMessage(
        "Latitude dan longitude harus diisi secara bersamaan.",
        "error"
      );
      return;
    }

    if (form.latitude.trim() && form.longitude.trim()) {
      const lat = Number(form.latitude);
      const lng = Number(form.longitude);

      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng) ||
        lat < -90 ||
        lat > 90 ||
        lng < -180 ||
        lng > 180
      ) {
        showMessage(
          "Koordinat GPS tidak valid. Periksa kembali latitude dan longitude.",
          "error"
        );
        return;
      }
    }

    if (
      form.tanggal_mulai &&
      form.tanggal_selesai &&
      form.tanggal_selesai < form.tanggal_mulai
    ) {
      showMessage(
        "Tanggal selesai PKL tidak boleh lebih awal dari tanggal mulai.",
        "error"
      );
      return;
    }

    if (
      !Number.isInteger(Number(form.kuota)) ||
      Number(form.kuota) < 1
    ) {
      showMessage("Jumlah kuota minimal 1 siswa.", "error");
      return;
    }

    if (
      !Number.isInteger(Number(form.radius_absensi)) ||
      Number(form.radius_absensi) < 20 ||
      Number(form.radius_absensi) > 1000
    ) {
      showMessage(
        "Radius absensi harus antara 20 sampai 1.000 meter.",
        "error"
      );
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/lowongan-pkl", {
        method: editingId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          id: editingId,
          kuota: Number(form.kuota),
          radius_absensi: Number(form.radius_absensi),
          latitude: form.latitude.trim() || null,
          longitude: form.longitude.trim() || null,
          tanggal_mulai: form.tanggal_mulai || null,
          tanggal_selesai: form.tanggal_selesai || null,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Gagal menyimpan data.");
      }

      setModalOpen(false);
      setForm(initialForm);
      setEditingId(null);
      showMessage(result.message || "Data lowongan berhasil disimpan.");

      await loadData();
    } catch (error) {
      showMessage(
        error instanceof Error ? error.message : "Terjadi kesalahan.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteLowongan(id: number) {
    const yakin = window.confirm(
      "Apakah Anda yakin ingin menghapus lowongan ini? Data yang dihapus tidak dapat dikembalikan."
    );

    if (!yakin) return;

    setDeletingId(id);

    try {
      const response = await fetch(
        `/api/admin/lowongan-pkl?id=${id}`,
        { method: "DELETE" }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Gagal menghapus lowongan.");
      }

      showMessage(result.message || "Lowongan berhasil dihapus.");
      await loadData();
    } catch (error) {
      showMessage(
        error instanceof Error ? error.message : "Gagal menghapus data.",
        "error"
      );
    } finally {
      setDeletingId(null);
    }
  }

  const filteredData = data.filter((item) => {
    const keyword = search.toLowerCase();

    const cocokSearch =
      (item.judul || "").toLowerCase().includes(keyword) ||
      (item.nama_instansi || "").toLowerCase().includes(keyword) ||
      (item.lokasi || "").toLowerCase().includes(keyword);

    const cocokStatus =
      filter === "SEMUA" || item.status === filter;

    return cocokSearch && cocokStatus;
  });

  const totalDibuka = data.filter(
    (item) => item.status === "DIBUKA"
  ).length;

  const totalDitutup = data.filter(
    (item) => item.status === "DITUTUP"
  ).length;

  const totalKuota = data
    .filter((item) => item.status === "DIBUKA")
    .reduce((total, item) => total + Number(item.kuota), 0);

  const totalLokasiSiap = data.filter(
    (item) =>
      item.latitude !== null &&
      item.latitude !== undefined &&
      item.longitude !== null &&
      item.longitude !== undefined
  ).length;

  function formatTanggal(value: string | null) {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  }

  function SectionTitle({
    number,
    title,
  }: {
    number: string;
    title: string;
  }) {
    return (
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-sm font-extrabold text-blue-700">
          {number}
        </div>
        <h3 className="font-bold text-slate-800">{title}</h3>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f7fc]">
      <section className="mx-auto max-w-7xl px-5 py-8 md:px-10">
        {/* KOTAK HEADER (navy) */}
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
                Pengelolaan Lowongan PKL
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100/80">
                Kelola informasi kesempatan Praktik Kerja Lapangan, jumlah
                peserta, periode pelaksanaan, dan lokasi absensi siswa.
              </p>

              <nav
                aria-label="Breadcrumb"
                className="mt-4 flex items-center gap-2 text-xs text-blue-100/70"
              >
                <Link href="/admin" className="transition hover:text-white">
                  Dashboard
                </Link>
                <span>/</span>
                <span className="font-semibold text-cyan-300">
                  Lowongan PKL
                </span>
              </nav>
            </div>

            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-[#0A1F44] shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:bg-cyan-300"
            >
              <span className="text-lg leading-none">+</span>
              Tambah Lowongan
            </button>
          </div>
        </div>

        {message && (
          <div
            className={`mb-5 flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
              messageType === "error"
                ? "border-rose-200 bg-rose-50 text-rose-800"
                : "border-emerald-200 bg-emerald-50 text-emerald-800"
            }`}
          >
            <span>{message}</span>
            <button
              type="button"
              onClick={() => setMessage("")}
              className="text-lg font-bold"
              aria-label="Tutup notifikasi"
            >
              ×
            </button>
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              title: "Total Lowongan",
              value: data.length,
              icon: "📋",
              color: "bg-blue-50",
            },
            {
              title: "Lowongan Dibuka",
              value: totalDibuka,
              icon: "🟢",
              color: "bg-emerald-50",
            },
            {
              title: "Lowongan Ditutup",
              value: totalDitutup,
              icon: "🔒",
              color: "bg-rose-50",
            },
            {
              title: "Lokasi GPS Diatur",
              value: `${totalLokasiSiap}/${data.length}`,
              icon: "📍",
              color: "bg-cyan-50",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">{item.title}</p>
                  <p className="mt-2 text-3xl font-extrabold text-slate-800">
                    {loading ? "..." : item.value}
                  </p>
                </div>
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${item.color}`}
                >
                  {item.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-6 md:flex-row md:items-center">
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                Daftar Lowongan PKL
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Lihat, tambah, ubah, dan hapus informasi lowongan PKL.
              </p>
            </div>

          </div>

          <div className="flex flex-col gap-3 border-b border-slate-100 p-5 md:flex-row">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama posisi, instansi, atau alamat..."
              className={`${inputClass} min-w-0 flex-1`}
            />

            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className={inputClass + " md:w-52"}
            >
              <option value="SEMUA">Semua Status</option>
              <option value="DIBUKA">Dibuka</option>
              <option value="DITUTUP">Ditutup</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-4">Posisi PKL</th>
                  <th className="px-6 py-4">Instansi</th>
                  <th className="px-6 py-4">Alamat</th>
                  <th className="px-6 py-4">Kuota</th>
                  <th className="px-6 py-4">Periode</th>
                  <th className="px-6 py-4">Lokasi GPS</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Aksi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-16 text-center text-slate-400"
                    >
                      Memuat data lowongan...
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-16 text-center text-slate-500"
                    >
                      Tidak ada lowongan yang ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item) => {
                    const lokasiSiap =
                      item.latitude !== null &&
                      item.latitude !== undefined &&
                      item.longitude !== null &&
                      item.longitude !== undefined;

                    return (
                      <tr
                        key={item.id}
                        className="transition hover:bg-blue-50/40"
                      >
                        <td className="px-6 py-5">
                          <p className="font-bold text-slate-800">
                            {item.judul}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            ID: #{item.id}
                          </p>
                        </td>

                        <td className="px-6 py-5 font-medium text-slate-700">
                          {item.nama_instansi}
                        </td>

                        <td className="max-w-xs px-6 py-5 text-slate-600">
                          {item.lokasi}
                        </td>

                        <td className="px-6 py-5 font-semibold text-slate-700">
                          {item.kuota} siswa
                        </td>

                        <td className="px-6 py-5 text-xs text-slate-500">
                          {formatTanggal(item.tanggal_mulai)}
                          <br />
                          sampai {formatTanggal(item.tanggal_selesai)}
                        </td>

                        <td className="px-6 py-5">
                          {lokasiSiap ? (
                            <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                              Diatur · {item.radius_absensi || 100} m
                            </span>
                          ) : (
                            <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">
                              Belum diatur
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-5">
                          <span
                            className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                              item.status === "DIBUKA"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-rose-50 text-rose-700"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <div className="flex justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(item)}
                              className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => deleteLowongan(item.id)}
                              disabled={deletingId === item.id}
                              className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-100 disabled:opacity-50"
                            >
                              {deletingId === item.id ? "Menghapus..." : "Hapus"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-1 border-t border-slate-100 px-6 py-4 text-xs text-slate-400 sm:flex-row sm:justify-between">
            <span>
              Menampilkan {filteredData.length} dari {data.length} lowongan
            </span>
            <span>Total kuota lowongan aktif: {totalKuota} siswa</span>
          </div>
        </div>
      </section>

      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="my-auto w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-gradient-to-r from-[#0b2450] to-[#15549a] px-6 py-5 text-white">
              <div>
                <p className="text-xs font-bold tracking-wider text-cyan-300">
                  FORMULIR ADMINISTRATOR
                </p>
                <h2 className="mt-1 text-xl font-bold">
                  {editingId
                    ? "Edit Informasi Lowongan PKL"
                    : "Tambah Lowongan PKL"}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-2xl text-white/80 hover:text-white"
                aria-label="Tutup formulir"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="max-h-[78vh] space-y-8 overflow-y-auto p-5 md:p-7"
            >
              <section className="space-y-5">
                <SectionTitle number="01" title="Informasi Lowongan" />

                <div>
                  <label className={labelClass}>
                    Nama Posisi / Bidang PKL *
                  </label>
                  <input
                    required
                    value={form.judul}
                    onChange={(e) => updateForm("judul", e.target.value)}
                    placeholder="Contoh: Web Developer, Desain Grafis, Administrasi Perkantoran"
                    className={inputClass}
                  />
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className={labelClass}>
                      Nama Perusahaan / Instansi *
                    </label>
                    <input
                      required
                      value={form.nama_instansi}
                      onChange={(e) =>
                        updateForm("nama_instansi", e.target.value)
                      }
                      placeholder="Contoh: PT Teknologi Indonesia"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      Alamat Lengkap Lokasi PKL *
                    </label>
                    <input
                      required
                      value={form.lokasi}
                      onChange={(e) => updateForm("lokasi", e.target.value)}
                      placeholder="Contoh: Jl. Raya Sukabumi No. 25, Kota Sukabumi"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>
                    Deskripsi Kegiatan dan Tugas PKL *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={form.deskripsi}
                    onChange={(e) => updateForm("deskripsi", e.target.value)}
                    placeholder="Jelaskan kegiatan dan tanggung jawab siswa selama PKL."
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Persyaratan dan Kualifikasi Peserta
                  </label>
                  <textarea
                    rows={3}
                    value={form.persyaratan}
                    onChange={(e) =>
                      updateForm("persyaratan", e.target.value)
                    }
                    placeholder="Contoh: Mampu mengoperasikan komputer, memahami Microsoft Office, disiplin, dan bertanggung jawab."
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Jurusan yang Dapat Mendaftar
                  </label>
                  <input
                    value={form.jurusan}
                    onChange={(e) => updateForm("jurusan", e.target.value)}
                    placeholder="Contoh: RPL, TKJ, DKV, Akuntansi, atau Semua Jurusan"
                    className={inputClass}
                  />
                </div>
              </section>

              <section className="space-y-5">
                <SectionTitle
                  number="02"
                  title="Kuota dan Periode Pelaksanaan"
                />

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className={labelClass}>
                      Jumlah Maksimal Peserta PKL *
                    </label>
                    <input
                      required
                      type="number"
                      min="1"
                      step="1"
                      value={form.kuota}
                      onChange={(e) => updateForm("kuota", e.target.value)}
                      placeholder="Contoh: 5"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      Status Pendaftaran *
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) =>
                        updateForm(
                          "status",
                          e.target.value as "DIBUKA" | "DITUTUP"
                        )
                      }
                      className={inputClass}
                    >
                      <option value="DIBUKA">
                        Dibuka - Siswa dapat mendaftar
                      </option>
                      <option value="DITUTUP">
                        Ditutup - Pendaftaran tidak tersedia
                      </option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className={labelClass}>
                      Tanggal Mulai Pelaksanaan PKL
                    </label>
                    <input
                      type="date"
                      value={form.tanggal_mulai}
                      onChange={(e) =>
                        updateForm("tanggal_mulai", e.target.value)
                      }
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      Tanggal Selesai Pelaksanaan PKL
                    </label>
                    <input
                      type="date"
                      value={form.tanggal_selesai}
                      onChange={(e) =>
                        updateForm("tanggal_selesai", e.target.value)
                      }
                      min={form.tanggal_mulai || undefined}
                      className={inputClass}
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-5">
                <SectionTitle
                  number="03"
                  title="Pengaturan Titik Lokasi Absensi GPS"
                />

                <div className="rounded-2xl border border-cyan-200 bg-cyan-50/60 p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-100 text-xl">
                      📍
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">
                        Tentukan Lokasi Instansi
                      </h4>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl border border-cyan-200 bg-white p-4">
                    <p className="text-sm font-bold text-slate-800">
                      Cara mengatur titik lokasi:
                    </p>
                    <ol className="mt-2 list-inside list-decimal space-y-1.5 text-xs leading-5 text-slate-600">
                      <li>Datangi kantor atau lokasi pelaksanaan PKL.</li>
                      <li>Aktifkan GPS atau layanan lokasi pada perangkat.</li>
                      <li>Izinkan browser mengakses lokasi perangkat.</li>
                      <li>Tekan tombol ambil koordinat GPS di bawah.</li>
                      <li>Pastikan latitude dan longitude sudah terisi.</li>
                    </ol>
                  </div>

                  <button
                    type="button"
                    onClick={ambilLokasiAdmin}
                    disabled={gettingLocation}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {gettingLocation ? (
                      <>
                        <span className="animate-spin">◌</span>
                        Sedang mengambil koordinat GPS...
                      </>
                    ) : (
                      <>
                        <span>◎</span>
                        Ambil Koordinat GPS Lokasi Saat Ini
                      </>
                    )}
                  </button>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div>
                      <label className={labelClass}>
                        Latitude (Garis Lintang)
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="-90"
                        max="90"
                        value={form.latitude}
                        onChange={(e) =>
                          updateForm("latitude", e.target.value)
                        }
                        placeholder="Contoh: -6.2000000"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>
                        Longitude (Garis Bujur)
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="-180"
                        max="180"
                        value={form.longitude}
                        onChange={(e) =>
                          updateForm("longitude", e.target.value)
                        }
                        placeholder="Contoh: 106.8166660"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="mt-5">
                    <label className={labelClass}>
                      Radius Maksimal Absensi (Meter)
                    </label>
                    <input
                      required
                      type="number"
                      min="20"
                      max="1000"
                      step="1"
                      value={form.radius_absensi}
                      onChange={(e) =>
                        updateForm("radius_absensi", e.target.value)
                      }
                      placeholder="Contoh: 100"
                      className={inputClass}
                    />
                  </div>

                  {!form.latitude.trim() || !form.longitude.trim() ? (
                    <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-100 px-4 py-3 text-xs leading-5 text-amber-800">
                      <span>⚠️</span>
                      <span>
                        <strong>Lokasi belum diatur.</strong> Isi kedua
                        koordinat GPS agar lokasi absensi dapat digunakan.
                      </span>
                    </div>
                  ) : (
                    <div className="mt-4 flex items-start gap-2 rounded-xl bg-emerald-100 px-4 py-3 text-xs leading-5 text-emerald-800">
                      <span>✓</span>
                      <span>
                        <strong>Koordinat sudah diisi.</strong> Latitude:{" "}
                        {form.latitude} dan Longitude: {form.longitude}.
                      </span>
                    </div>
                  )}
                </div>
              </section>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-400">
                  Kolom bertanda (*) wajib diisi.
                </p>

                <div className="flex flex-col-reverse gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    disabled={saving}
                    className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-gradient-to-r from-blue-700 to-cyan-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving
                      ? "Sedang Menyimpan..."
                      : editingId
                        ? "Simpan Perubahan"
                        : "Simpan Lowongan PKL"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}