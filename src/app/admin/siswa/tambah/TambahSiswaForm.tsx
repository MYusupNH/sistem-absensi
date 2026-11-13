
"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type School = {
  id: number;
  schoolName: string;
};

export default function TambahSiswaForm({
  schools,
}: {
  schools: School[];
}) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    nisn: "",
    schoolId: "",
    className: "",
    major: "",
    phone: "",
  });

  function updateField(
    field: keyof typeof form,
    value: string
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/siswa", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          schoolId: Number(form.schoolId),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Gagal membuat akun siswa.");
        return;
      }

      setSuccess("Akun siswa berhasil dibuat.");

      setTimeout(() => {
        router.push("/admin/siswa");
        router.refresh();
      }, 1200);

    } catch (error) {
      console.error(error);
      setError("Tidak dapat menghubungi server.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

  return (
    <form
      onSubmit={handleSubmit}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >

      {/* INFORMASI SISWA */}
      <div className="border-b border-slate-100 px-6 py-5">
        <h2 className="font-bold text-slate-800">
          Informasi Siswa
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Lengkapi identitas siswa yang akan didaftarkan.
        </p>
      </div>

      <div className="grid gap-5 p-6 md:grid-cols-2">

        <label className="text-sm font-semibold text-slate-700 md:col-span-2">
          Nama Lengkap *
          <input
            required
            maxLength={150}
            value={form.fullName}
            onChange={(e) =>
              updateField("fullName", e.target.value)
            }
            placeholder="Masukkan nama lengkap siswa"
            className={inputClass}
          />
        </label>

        <label className="text-sm font-semibold text-slate-700">
          NISN *
          <input
            required
            value={form.nisn}
            onChange={(e) =>
              updateField("nisn", e.target.value)
            }
            placeholder="Masukkan NISN"
            className={inputClass}
          />
        </label>

        <label className="text-sm font-semibold text-slate-700">
          Sekolah *
          <select
            required
            value={form.schoolId}
            onChange={(e) =>
              updateField("schoolId", e.target.value)
            }
            className={inputClass}
          >
            <option value="">Pilih sekolah</option>

            {schools.map((school) => (
              <option key={school.id} value={school.id}>
                {school.schoolName}
              </option>
            ))}
          </select>

          {schools.length === 0 && (
            <span className="mt-2 block text-xs font-normal text-rose-500">
              Belum ada sekolah aktif. Tambahkan sekolah terlebih dahulu.
            </span>
          )}
        </label>

        <label className="text-sm font-semibold text-slate-700">
          Kelas *
          <input
            required
            value={form.className}
            onChange={(e) =>
              updateField("className", e.target.value)
            }
            placeholder="Contoh: XII RPL 1"
            className={inputClass}
          />
        </label>

        <label className="text-sm font-semibold text-slate-700">
          Jurusan *
          <input
            required
            value={form.major}
            onChange={(e) =>
              updateField("major", e.target.value)
            }
            placeholder="Contoh: Rekayasa Perangkat Lunak"
            className={inputClass}
          />
        </label>

        <label className="text-sm font-semibold text-slate-700 md:col-span-2">
          Nomor Telepon
          <input
            value={form.phone}
            onChange={(e) =>
              updateField("phone", e.target.value)
            }
            placeholder="Masukkan nomor telepon siswa"
            className={inputClass}
          />
        </label>

      </div>

      {/* AKUN LOGIN */}
      <div className="border-y border-slate-100 bg-slate-50/70 px-6 py-5">
        <h2 className="font-bold text-slate-800">
          Akun Login Siswa
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Akun ini digunakan siswa untuk masuk ke STRIDE.
        </p>
      </div>

      <div className="grid gap-5 p-6 md:grid-cols-2">

        <label className="text-sm font-semibold text-slate-700">
          Email *
          <input
            required
            type="email"
            autoComplete="off"
            value={form.email}
            onChange={(e) =>
              updateField("email", e.target.value)
            }
            placeholder="nama@email.com"
            className={inputClass}
          />
        </label>

        <label className="text-sm font-semibold text-slate-700">
          Password *
          <input
            required
            type="password"
            minLength={8}
            autoComplete="new-password"
            value={form.password}
            onChange={(e) =>
              updateField("password", e.target.value)
            }
            placeholder="Minimal 8 karakter"
            className={inputClass}
          />
        </label>

      </div>

      {/* PESAN */}
      {error && (
        <div className="mx-6 mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mx-6 mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      {/* TOMBOL */}
      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-5 sm:flex-row sm:justify-end">

        <button
          type="button"
          onClick={() => router.push("/admin/siswa")}
          className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-100"
        >
          Batal
        </button>

        <button
          type="submit"
          disabled={loading || schools.length === 0}
          className="rounded-xl bg-gradient-to-r from-blue-700 to-cyan-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-900/15 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Menyimpan..." : "Simpan Siswa"}
        </button>

      </div>

    </form>
  );
}
