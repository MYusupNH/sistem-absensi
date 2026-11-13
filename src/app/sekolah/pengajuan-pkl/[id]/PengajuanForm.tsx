"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

type StudentForm = {
  id: number;
  fullName: string;
  email: string;
  nisn: string;
  className: string;
  major: string;
};

type Props = {
  lowonganId: number;
  kuota: number;
};

export default function PengajuanForm({
  lowonganId,
  kuota,
}: Props) {
  const [students, setStudents] = useState<StudentForm[]>([
    {
      id: 1,
      fullName: "",
      email: "",
      nisn: "",
      className: "",
      major: "",
    },
  ]);

  const [nextId, setNextId] = useState(2);
  const [bulanMulai, setBulanMulai] = useState("");
  const [bulanSelesai, setBulanSelesai] = useState("");
  const [namaGuru, setNamaGuru] = useState("");
  const [pesan, setPesan] = useState("");
  const [surat, setSurat] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-black outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  const jumlahSiswa = students.length;
  const sisaKuota = Math.max(0, kuota - jumlahSiswa);

  function addStudent() {
    if (students.length >= kuota) {
      setError(`Kuota maksimal hanya ${kuota} peserta.`);
      return;
    }

    setError("");

    setStudents((current) => [
      ...current,
      {
        id: nextId,
        fullName: "",
        email: "",
        nisn: "",
        className: "",
        major: "",
      },
    ]);

    setNextId((current) => current + 1);
  }

  function removeStudent(id: number) {
    if (students.length <= 1) {
      setError("Minimal harus ada satu siswa.");
      return;
    }

    setStudents((current) =>
      current.filter((student) => student.id !== id)
    );

    setError("");
  }

  function updateStudent(
    id: number,
    field: keyof Omit<StudentForm, "id">,
    value: string
  ) {
    setStudents((current) =>
      current.map((student) =>
        student.id === id
          ? { ...student, [field]: value }
          : student
      )
    );
  }

  function handleFileChange(file: File | null) {
    setError("");

    if (!file) {
      setSurat(null);
      return;
    }

    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      setError("Surat pengajuan harus menggunakan format PDF.");
      setSurat(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Ukuran surat maksimal 5 MB.");
      setSurat(null);
      return;
    }

    setSurat(file);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!namaGuru.trim()) {
      setError("Nama guru pembimbing wajib diisi.");
      return;
    }

    if (students.length === 0) {
      setError("Masukkan minimal satu siswa.");
      return;
    }

    if (students.length > kuota) {
      setError(`Jumlah siswa melebihi kuota ${kuota} peserta.`);
      return;
    }

    for (let i = 0; i < students.length; i++) {
      const student = students[i];

      if (
        !student.fullName.trim() ||
        !student.email.trim() ||
        !student.nisn.trim() ||
        !student.className.trim() ||
        !student.major.trim()
      ) {
        setError(`Data siswa ke-${i + 1} belum lengkap.`);
        return;
      }

      if (!/^\d{10}$/.test(student.nisn.trim())) {
        setError(`NISN siswa ke-${i + 1} harus terdiri dari 10 angka.`);
        return;
      }

      if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(student.email.trim())
      ) {
        setError(`Email siswa ke-${i + 1} tidak valid.`);
        return;
      }
    }

    const nisnList = students.map((student) => student.nisn.trim());
    if (new Set(nisnList).size !== nisnList.length) {
      setError("Terdapat NISN siswa yang sama. Periksa kembali.");
      return;
    }

    if (!bulanMulai || !bulanSelesai) {
      setError("Periode mulai dan selesai PKL wajib diisi.");
      return;
    }

    if (bulanSelesai < bulanMulai) {
      setError("Bulan selesai tidak boleh sebelum bulan mulai.");
      return;
    }

    if (!surat) {
      setError("Surat pengajuan PKL wajib diunggah.");
      return;
    }

    const formData = new FormData();

    formData.append("lowonganId", String(lowonganId));

    // Mengirim data siswa yang diisi secara manual.
    formData.append(
      "students",
      JSON.stringify(
        students.map(({ id, ...student }) => ({
          fullName: student.fullName.trim(),
          email: student.email.trim(),
          nisn: student.nisn.trim(),
          className: student.className.trim(),
          major: student.major.trim(),
        }))
      )
    );

    formData.append("bulanMulai", bulanMulai);
    formData.append("bulanSelesai", bulanSelesai);
    formData.append("namaGuruPembimbing", namaGuru.trim());
    formData.append("pesan", pesan.trim());
    formData.append("suratPengajuan", surat);

    setLoading(true);

    try {
      const response = await fetch("/api/sekolah/pengajuan-pkl", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || "Pengajuan gagal dikirim.");
        return;
      }

      setSuccess(result.message || "Pengajuan berhasil dikirim.");

      setStudents([
        {
          id: 1,
          fullName: "",
          email: "",
          nisn: "",
          className: "",
          major: "",
        },
      ]);

      setNextId(2);
      setBulanMulai("");
      setBulanSelesai("");
      setNamaGuru("");
      setPesan("");
      setSurat(null);

      const fileInput = document.getElementById(
        "suratPengajuan"
      ) as HTMLInputElement | null;

      if (fileInput) fileInput.value = "";
    } catch {
      setError("Tidak dapat menghubungi server. Coba kembali.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* BAGIAN 01: DATA SISWA */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-bold tracking-widest text-blue-600">
          BAGIAN 01
        </p>

        <h2 className="mt-2 text-xl font-extrabold text-slate-900">
          Data Siswa Peserta PKL
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Isi data siswa yang akan diajukan ke instansi tujuan secara manual.
        </p>

        {/* Statistik */}
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-gradient-to-br from-[#07152f] to-blue-800 p-4 text-white">
            <p className="text-xs text-blue-200">Jumlah siswa</p>
            <p className="mt-1 text-3xl font-extrabold">
              {jumlahSiswa}
            </p>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-cyan-600 to-blue-500 p-4 text-white">
            <p className="text-xs text-cyan-100">Sisa kuota</p>
            <p className="mt-1 text-3xl font-extrabold">
              {sisaKuota}
            </p>
          </div>
        </div>

        {/* Form siswa manual */}
        <div className="mt-6 space-y-5">
          {students.map((student, index) => (
            <div
              key={student.id}
              className="rounded-2xl border border-slate-200 p-5"
            >
              <div className="mb-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 font-extrabold text-blue-700">
                    {index + 1}
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900">
                      Data Siswa {index + 1}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Lengkapi identitas siswa
                    </p>
                  </div>
                </div>

                {students.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeStudent(student.id)}
                    className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100"
                  >
                    Hapus
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Nama Lengkap Siswa
                  </label>
                  <input
                    value={student.fullName}
                    onChange={(e) =>
                      updateStudent(student.id, "fullName", e.target.value)
                    }
                    maxLength={150}
                    required
                    placeholder="Masukkan nama lengkap siswa"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    NISN
                  </label>
                  <input
                    value={student.nisn}
                    onChange={(e) =>
                      updateStudent(
                        student.id,
                        "nisn",
                        e.target.value.replace(/\D/g, "").slice(0, 10)
                      )
                    }
                    inputMode="numeric"
                    maxLength={10}
                    required
                    placeholder="Masukkan 10 digit NISN"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Email Siswa
                  </label>
                  <input
                    type="email"
                    value={student.email}
                    onChange={(e) =>
                      updateStudent(student.id, "email", e.target.value)
                    }
                    maxLength={254}
                    required
                    placeholder="Contoh: siswa@email.com"
                    className={inputClass}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Kelas
                    </label>
                    <input
                      value={student.className}
                      onChange={(e) =>
                        updateStudent(
                          student.id,
                          "className",
                          e.target.value
                        )
                      }
                      maxLength={50}
                      required
                      placeholder="Contoh: XII RPL 1"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Jurusan
                    </label>
                    <input
                      value={student.major}
                      onChange={(e) =>
                        updateStudent(student.id, "major", e.target.value)
                      }
                      maxLength={100}
                      required
                      placeholder="Contoh: Rekayasa Perangkat Lunak"
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tambah siswa */}
        <button
          type="button"
          onClick={addStudent}
          disabled={students.length >= kuota}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50 px-5 py-4 text-sm font-bold text-blue-700 transition hover:border-blue-500 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="text-xl">+</span>
          Tambah Siswa
        </button>

        <p className="mt-3 text-xs text-slate-400">
          Kuota maksimal {kuota} peserta. Isi data setiap siswa secara manual.
        </p>
      </section>

      {/* BAGIAN 02: PERIODE DAN GURU */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-bold tracking-widest text-blue-600">
          BAGIAN 02
        </p>

        <h2 className="mt-2 text-xl font-extrabold text-slate-900">
          Periode dan Pembimbing PKL
        </h2>

        <div className="mt-5 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Nama Guru Pembimbing
            </label>
            <input
              value={namaGuru}
              onChange={(e) => setNamaGuru(e.target.value)}
              maxLength={150}
              required
              placeholder="Contoh: Bapak Ahmad, S.Pd."
              className={inputClass}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Bulan dan Tahun Mulai PKL
              </label>
              <input
                type="month"
                value={bulanMulai}
                onChange={(e) => setBulanMulai(e.target.value)}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Bulan dan Tahun Selesai PKL
              </label>
              <input
                type="month"
                value={bulanSelesai}
                min={bulanMulai || undefined}
                onChange={(e) => setBulanSelesai(e.target.value)}
                required
                className={inputClass}
              />
            </div>
          </div>

          <div className="rounded-xl bg-blue-50 p-4 text-sm text-blue-800">
            <strong>Periode PKL:</strong>{" "}
            {bulanMulai || "Belum dipilih"} sampai{" "}
            {bulanSelesai || "Belum dipilih"}
          </div>
        </div>
      </section>

      {/* BAGIAN 03: SURAT */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-bold tracking-widest text-blue-600">
          BAGIAN 03
        </p>

        <h2 className="mt-2 text-xl font-extrabold text-slate-900">
          Surat Pengajuan PKL
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Unggah surat resmi pengajuan PKL dari sekolah.
        </p>

        <label
          htmlFor="suratPengajuan"
          className="mt-5 flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/50 p-8 text-center hover:border-blue-500"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-700 to-cyan-500 text-2xl font-extrabold text-white">
            PDF
          </div>

          <p className="mt-4 font-bold text-slate-800">
            {surat ? surat.name : "Pilih Surat Pengajuan PKL"}
          </p>

          <p className="mt-2 text-xs text-slate-500">
            Format PDF • Maksimal 5 MB
          </p>

          <span className="mt-4 rounded-xl bg-[#07152f] px-5 py-3 text-sm font-bold text-white">
            Pilih File
          </span>

          <input
            id="suratPengajuan"
            type="file"
            accept=".pdf,application/pdf"
            required
            className="hidden"
            onChange={(e) =>
              handleFileChange(e.target.files?.[0] || null)
            }
          />
        </label>

        {surat && (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-emerald-800">
                {surat.name}
              </p>
              <p className="text-xs text-emerald-700">
                {(surat.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setSurat(null);
                const input = document.getElementById(
                  "suratPengajuan"
                ) as HTMLInputElement | null;

                if (input) input.value = "";
              }}
              className="shrink-0 text-sm font-bold text-red-600"
            >
              Hapus
            </button>
          </div>
        )}
      </section>

      {/* BAGIAN 04: KETERANGAN */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-bold tracking-widest text-blue-600">
          BAGIAN 04
        </p>

        <h2 className="mt-2 text-xl font-extrabold text-slate-900">
          Keterangan Tambahan
        </h2>

        <div className="mt-5">
          <label className="mb-2 block text-sm font-bold text-slate-700">
            Pesan Pengantar (Opsional)
          </label>

          <textarea
            value={pesan}
            onChange={(e) => setPesan(e.target.value)}
            rows={4}
            maxLength={2000}
            placeholder="Tuliskan pesan pengantar dari pihak sekolah..."
            className={inputClass}
          />

          <p className="mt-2 text-right text-xs text-slate-400">
            {pesan.length}/2000 karakter
          </p>
        </div>
      </section>

      {/* PESAN ERROR DAN SUKSES */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {success}

          <div className="mt-3">
            <Link
              href="/sekolah/status-pengajuan"
              className="font-bold underline"
            >
              Lihat Status Pengajuan
            </Link>
          </div>
        </div>
      )}

      {/* TOMBOL */}
      <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
        <Link
          href="/sekolah/pengajuan-pkl"
          className="rounded-xl border border-slate-300 px-6 py-3 text-center text-sm font-bold text-slate-600 hover:bg-slate-100"
        >
          Batal
        </Link>

        <button
          type="submit"
          disabled={loading || !surat || kuota < 1}
          className="rounded-xl bg-gradient-to-r from-blue-700 to-cyan-600 px-7 py-3 text-sm font-bold text-white shadow-lg hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Mengirim Pengajuan..." : "Kirim Pengajuan"}
        </button>
      </div>
    </form>
  );
}