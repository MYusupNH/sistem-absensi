
"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export default function TambahSekolahForm() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    schoolName: "",
    npsn: "",
    address: "",
    phone: "",
    username: "",
    password: "",
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
    setMessage("");

    try {
      const response = await fetch("/api/admin/schools", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Gagal membuat sekolah.");
        return;
      }

      setMessage("Sekolah berhasil dibuat. Mengalihkan halaman...");

      setTimeout(() => {
        router.push("/admin/sekolah");
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
    <main className="min-h-screen bg-[#f4f7fc]">

      {/* HEADER */}
      <header className="bg-gradient-to-br from-[#071a3d] via-[#102d62] to-[#164e91] px-6 py-9 text-white md:px-10">
        <div className="mx-auto max-w-4xl">
          <p className="mb-3 text-xs font-bold tracking-widest text-cyan-300">
            STRIDE ADMINISTRATOR
          </p>

          <h1 className="text-3xl font-extrabold">
            Tambah Sekolah
          </h1>

          <p className="mt-3 text-sm text-blue-100/80">
            Buat data sekolah sekaligus akun login secara manual.
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-5 py-8 md:px-10">

        <form
          onSubmit={handleSubmit}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >

          {/* DATA SEKOLAH */}
          <div className="border-b border-slate-100 px-6 py-5">
            <h2 className="font-bold text-slate-800">
              Informasi Sekolah
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Masukkan identitas sekolah yang akan didaftarkan.
            </p>
          </div>

          <div className="grid gap-5 p-6 md:grid-cols-2">

            <label className="text-sm font-semibold text-slate-700 md:col-span-2">
              Nama Sekolah *
              <input
                required
                value={form.schoolName}
                onChange={(e) =>
                  updateField("schoolName", e.target.value)
                }
                placeholder="Contoh: SMK Negeri 1 Sukabumi"
                className={inputClass}
              />
            </label>

            <label className="text-sm font-semibold text-slate-700">
              NPSN *
              <input
                required
                inputMode="numeric"
                maxLength={10}
                value={form.npsn}
                onChange={(e) =>
                  updateField(
                    "npsn",
                    e.target.value.replace(/\D/g, "")
                  )
                }
                placeholder="8 sampai 10 angka"
                className={inputClass}
              />
            </label>

            <label className="text-sm font-semibold text-slate-700">
              Nomor Telepon
              <input
                value={form.phone}
                onChange={(e) =>
                  updateField("phone", e.target.value)
                }
                placeholder="Nomor telepon sekolah"
                className={inputClass}
              />
            </label>

            <label className="text-sm font-semibold text-slate-700 md:col-span-2">
              Alamat Sekolah
              <textarea
                rows={3}
                value={form.address}
                onChange={(e) =>
                  updateField("address", e.target.value)
                }
                placeholder="Alamat lengkap sekolah"
                className={inputClass}
              />
            </label>

          </div>

          {/* AKUN LOGIN */}
          <div className="border-y border-slate-100 bg-slate-50/70 px-6 py-5">
            <h2 className="font-bold text-slate-800">
              Akun Login Sekolah
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Buat username dan password untuk pihak sekolah.
            </p>
          </div>

          <div className="grid gap-5 p-6 md:grid-cols-2">

            <label className="text-sm font-semibold text-slate-700">
              Username *
              <input
                required
                maxLength={100}
                autoComplete="off"
                value={form.username}
                onChange={(e) =>
                  updateField("username", e.target.value)
                }
                placeholder="Masukkan username bebas"
                className={inputClass}
              />

              <span className="mt-2 block text-xs font-normal text-slate-400">
                Bebas menggunakan huruf, angka, spasi, dan simbol. Maksimal 100 karakter.
              </span>
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

          {message && (
            <div className="mx-6 mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {message}
            </div>
          )}

          {/* TOMBOL */}
          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-5 sm:flex-row sm:justify-end">

            <button
              type="button"
              onClick={() => router.push("/admin/sekolah")}
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-100"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-gradient-to-r from-blue-700 to-cyan-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-900/15 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Menyimpan..." : "Simpan Sekolah"}
            </button>

          </div>

        </form>
      </section>
    </main>
  );
}
