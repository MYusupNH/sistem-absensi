"use client";

import Link from "next/link";
import { useState, type ChangeEvent, type FormEvent } from "react";

type RegisterForm = {
  fullName: string;
  email: string;
  password: string;
  schoolName: string;
  npsn: string;
  phone: string;
  address: string;
};

export default function RegisterSchoolPage() {
  const [form, setForm] = useState<RegisterForm>({
    fullName: "",
    email: "",
    password: "",
    schoolName: "",
    npsn: "",
    phone: "",
    address: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  function change(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth/register-school", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Pendaftaran gagal.");
        return;
      }

      setMessage(data.message);
      setRegistered(true);
    } catch {
      setMessage("Tidak dapat terhubung ke server.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-[#091a38] px-4 py-3 text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/10";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_right,#123c70_0%,#07152f_45%,#030a19_100%)] px-4 py-10 text-white">
      <div className="w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06] shadow-2xl backdrop-blur-xl">
        <div className="border-b border-white/10 px-6 py-7 sm:px-10">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-cyan-300 transition hover:text-white"
          >
            <span>←</span>
            Kembali ke login
          </Link>

          <div className="mt-7">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 text-2xl font-black shadow-lg shadow-cyan-500/20">
              S
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Pendaftaran Guru
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
              Daftarkan akun Guru sekaligus sekolah Anda untuk mulai
              menggunakan platform STRIDE dan mengelola pengajuan PKL siswa.
            </p>
          </div>
        </div>

        {registered ? (
          <div className="px-6 py-12 text-center sm:px-10">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-green-400/30 bg-green-500/10">
              <span className="text-4xl text-green-400">✓</span>
            </div>

            <h2 className="mt-6 text-2xl font-bold text-white">
              Pendaftaran Berhasil!
            </h2>

            <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-slate-300">
              {message}
            </p>

            <div className="mx-auto mt-7 max-w-lg rounded-2xl border border-amber-400/20 bg-amber-500/10 p-5 text-left">
              <div className="flex items-center gap-3">
                <span className="text-xl">⏳</span>
                <p className="font-semibold text-amber-300">
                  Menunggu Verifikasi Admin
                </p>
              </div>

              <p className="mt-2 text-sm leading-6 text-slate-300">
                Silakan tunggu Admin memverifikasi pendaftaran sekolah Anda.
                Setelah sekolah diaktifkan, Anda dapat masuk menggunakan email
                dan password yang telah didaftarkan.
              </p>
            </div>

            <Link
              href="/login"
              className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-3.5 font-bold text-white shadow-lg shadow-blue-900/30 transition hover:brightness-110 sm:w-auto"
            >
              Kembali ke halaman login
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-8 px-6 py-8 sm:px-10">
            {/* DATA GURU */}
            <section>
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 text-lg text-cyan-300">
                  <span>01</span>
                </div>

                <div>
                  <h2 className="font-bold text-white">Data Guru</h2>
                  <p className="text-xs text-slate-400">
                    Informasi akun Guru atau penanggung jawab sekolah
                  </p>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-200">
                    Nama lengkap Guru
                  </label>
                  <input
                    name="fullName"
                    value={form.fullName}
                    onChange={change}
                    placeholder="Masukkan nama lengkap"
                    className={inputClass}
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-200">
                    Email untuk login
                  </label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={change}
                    placeholder="nama@email.com"
                    className={inputClass}
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-200">
                    Password
                  </label>
                  <input
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={change}
                    placeholder="Minimal 8 karakter"
                    minLength={8}
                    className={inputClass}
                    required
                  />
                  <p className="mt-2 text-xs text-slate-400">
                    Gunakan password minimal 8 karakter.
                  </p>
                </div>
              </div>
            </section>

            <div className="border-t border-white/10" />

            {/* DATA SEKOLAH */}
            <section>
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/15 text-lg text-cyan-300">
                  <span>02</span>
                </div>

                <div>
                  <h2 className="font-bold text-white">Data Sekolah</h2>
                  <p className="text-xs text-slate-400">
                    Informasi sekolah yang akan didaftarkan
                  </p>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-200">
                    Nama sekolah
                  </label>
                  <input
                    name="schoolName"
                    value={form.schoolName}
                    onChange={change}
                    placeholder="Contoh: SMK Negeri 1 Sukabumi"
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">
                    NPSN
                  </label>
                  <input
                    name="npsn"
                    value={form.npsn}
                    onChange={change}
                    placeholder="Masukkan NPSN"
                    inputMode="numeric"
                    maxLength={10}
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">
                    Nomor telepon sekolah
                  </label>
                  <input
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={change}
                    placeholder="08xxxxxxxxxx"
                    className={inputClass}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-200">
                    Alamat sekolah
                  </label>
                  <textarea
                    name="address"
                    value={form.address}
                    onChange={change}
                    rows={4}
                    placeholder="Masukkan alamat lengkap sekolah"
                    className={inputClass}
                  />
                </div>
              </div>
            </section>

            {message && (
              <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">
                {message}
              </div>
            )}

            <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/5 p-4">
              <p className="text-sm leading-6 text-slate-300">
                Dengan mendaftar, Anda mengajukan pembuatan akun Guru dan
                pendaftaran sekolah. Akun dapat digunakan setelah sekolah
                diverifikasi oleh Admin.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 py-4 font-bold text-white shadow-lg shadow-blue-900/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Sedang mendaftarkan..." : "Daftar Guru dan Sekolah"}
            </button>

            <p className="text-center text-sm text-slate-400">
              Sudah memiliki akun?{" "}
              <Link
                href="/login"
                className="font-semibold text-cyan-300 hover:text-white"
              >
                Masuk di sini
              </Link>
            </p>
          </form>
        )}
      </div>
    </main>
  );
}