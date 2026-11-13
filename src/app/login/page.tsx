
"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [role, setRole] = useState("school");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Login gagal.");
        return;
      }

      router.push(data.redirect);
      router.refresh();
    } catch {
      setMessage("Tidak dapat terhubung ke server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#07152f] px-4 py-10 text-white">
      <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-600/30 blur-3xl" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl" />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl md:grid-cols-2">
        <section className="hidden flex-col justify-between bg-gradient-to-br from-blue-700 via-blue-900 to-[#07152f] p-10 md:flex">
          <div>
            <div className="mb-10 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 text-2xl">
                🎓
              </div>

              <div>
                <h1 className="text-2xl font-bold">STRIDE</h1>
                <p className="text-xs text-blue-100">
                  Sistem Informasi Praktik Kerja Lapangan
                </p>
              </div>
            </div>

            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-200">
              Selamat Datang
            </p>

            <h2 className="text-4xl font-bold leading-tight">
              Temukan pengalaman PKL untuk masa depan.
            </h2>

            <p className="mt-5 leading-7 text-blue-100">
              Hubungkan sekolah, siswa, dan perusahaan dalam satu
              platform informasi dan pengajuan Praktik Kerja Lapangan.
            </p>
          </div>

          <p className="text-sm text-blue-200">
            STRIDE · Platform PKL
          </p>
        </section>

        <section className="p-7 sm:p-10">
          <div className="mb-8 md:hidden">
            <h1 className="text-2xl font-bold">STRIDE</h1>
            <p className="text-sm text-blue-200">
              Sistem Informasi PKL
            </p>
          </div>

          <h2 className="text-3xl font-bold">Masuk Akun</h2>

          <p className="mt-2 text-sm text-slate-300">
            Pilih jenis akun untuk melanjutkan.
          </p>

          <div className="mt-7 grid grid-cols-3 gap-2">
            {[
              { value: "admin", label: "Admin", icon: "🛡️" },
              { value: "school", label: "Sekolah", icon: "🏫" },
              { value: "student", label: "Siswa", icon: "🎓" },
            ].map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setRole(item.value)}
                className={`rounded-xl border p-3 text-center transition ${
                  role === item.value
                    ? "border-cyan-300 bg-cyan-400/15 text-cyan-200"
                    : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                }`}
              >
                <span className="block text-xl">{item.icon}</span>

                <span className="mt-1 block text-xs font-semibold">
                  {item.label}
                </span>
              </button>
            ))}
          </div>

          <form onSubmit={handleLogin} className="mt-7 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Email
              </label>

              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full rounded-xl border border-white/10 bg-[#091a38] px-4 py-3 outline-none transition focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Password
              </label>

              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="w-full rounded-xl border border-white/10 bg-[#091a38] px-4 py-3 outline-none transition focus:border-cyan-400"
              />
            </div>

            {message && (
              <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 py-3.5 font-bold text-white transition hover:brightness-110 disabled:opacity-60"
            >
              {loading ? "Memproses..." : "Masuk Sekarang"}
            </button>
          </form>

          {/* Pendaftaran hanya tersedia untuk sekolah */}
          {role === "school" && (
            <p className="mt-6 text-center text-sm text-slate-300">
              Belum punya akun?{" "}
              <Link
                href="/daftar/sekolah"
                className="font-semibold text-cyan-300 hover:underline"
              >
                Daftar sekarang
              </Link>
            </p>
          )}

          <Link
            href="/"
            className="mt-8 block text-center text-sm text-slate-400 hover:text-white"
          >
            ← Kembali ke halaman utama
          </Link>
        </section>
      </div>
    </main>
  );
}
