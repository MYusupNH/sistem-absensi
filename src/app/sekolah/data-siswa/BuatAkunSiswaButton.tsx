
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  studentId: number;
  accountExists: boolean;
};

type Credentials = {
  email: string;
  password: string;
};

export default function BuatAkunSiswaButton({
  studentId,
  accountExists,
}: Props) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function salinAkun() {
    if (!credentials) return;

    try {
      await navigator.clipboard.writeText(
        `Email: ${credentials.email}\nPassword: ${credentials.password}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Gagal menyalin akun. Silakan salin secara manual.");
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Email login harus diisi.");
      return;
    }

    if (password.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak sama.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `/api/sekolah/data-siswa/${studentId}/buat-akun`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || "Gagal membuat akun siswa.");
        return;
      }

      setCredentials(result.credentials);
      setOpen(false);
      setEmail("");
      setPassword("");
      setConfirmPassword("");

      router.refresh();
    } catch {
      setError("Tidak dapat terhubung ke server.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak sama.");
      return;
    }

    if (
      !window.confirm(
        "Apakah Anda yakin ingin mengganti password akun siswa ini?"
      )
    ) {
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `/api/sekolah/data-siswa/${studentId}/buat-akun`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || "Gagal mengatur ulang password.");
        return;
      }

      setCredentials(result.credentials);
      setResetOpen(false);
      setPassword("");
      setConfirmPassword("");
      setShowPassword(false);

      router.refresh();
    } catch {
      setError("Tidak dapat terhubung ke server.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteAccount() {
    const confirmed = window.confirm(
      "Nonaktifkan akun siswa ini?\n\nSiswa tidak akan bisa login, tetapi data identitas, presensi, dan laporan PKL tetap tersimpan."
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      setError("");

      const response = await fetch(
        `/api/sekolah/data-siswa/${studentId}/hapus-akun`,
        { method: "DELETE" }
      );

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || "Gagal menonaktifkan akun.");
        return;
      }

      setCredentials(null);
      alert(result.message || "Akun berhasil dinonaktifkan.");
      router.refresh();
    } catch {
      setError("Tidak dapat terhubung ke server.");
    } finally {
      setDeleting(false);
    }
  }

  // Menampilkan kredensial setelah pembuatan atau reset password.
  if (credentials) {
    return (
      <div className="w-64 space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <div>
          <p className="text-sm font-extrabold text-emerald-800">
            ✓ Kredensial Berhasil Diperbarui
          </p>
          <p className="mt-1 text-xs text-emerald-700">
            Simpan informasi login berikut untuk siswa.
          </p>
        </div>

        <div className="space-y-3 rounded-lg border border-emerald-200 bg-white p-3">
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-400">
              Email / Username
            </p>
            <p className="mt-1 break-all text-sm font-semibold text-slate-800">
              {credentials.email}
            </p>
          </div>

          <div className="border-t border-slate-100 pt-2">
            <p className="text-[10px] font-bold uppercase text-slate-400">
              Kata Sandi Baru
            </p>
            <div className="mt-1 flex items-center gap-2">
              <p className="min-w-0 flex-1 break-all font-mono text-sm font-bold text-slate-800">
                {showPassword ? credentials.password : "••••••••••"}
              </p>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="shrink-0 text-xs font-semibold text-blue-700"
              >
                {showPassword ? "Sembunyikan" : "Lihat"}
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={salinAkun}
          className="w-full rounded-lg bg-emerald-700 px-3 py-2.5 text-xs font-bold text-white hover:bg-emerald-800"
        >
          {copied ? "✓ Berhasil Disalin" : "Salin Email & Password"}
        </button>

        <button
          type="button"
          onClick={() => setCredentials(null)}
          className="w-full rounded-lg border border-emerald-300 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
        >
          Tutup
        </button>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <p className="text-[10px] leading-relaxed text-emerald-800">
          Password hanya ditampilkan sementara. Simpan sebelum menutup
          tampilan ini.
        </p>
      </div>
    );
  }

  // Akun aktif.
  if (accountExists) {
    return (
      <div className="w-56 space-y-2">
        <span className="inline-flex rounded-lg bg-emerald-100 px-3 py-2 text-xs font-bold text-emerald-700">
          ✓ Akun Aktif
        </span>

        {!resetOpen ? (
          <>
            <button
              type="button"
              onClick={() => {
                setError("");
                setPassword("");
                setConfirmPassword("");
                setResetOpen(true);
              }}
              className="w-full rounded-lg bg-blue-700 px-3 py-2 text-xs font-bold text-white hover:bg-blue-800"
            >
              Atur Ulang Password
            </button>

            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-50"
            >
              {deleting ? "Menonaktifkan..." : "Hapus Akun"}
            </button>
          </>
        ) : (
          <form
            onSubmit={handleResetPassword}
            className="space-y-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
          >
            <h3 className="text-sm font-bold text-slate-800">
              Atur Ulang Password
            </h3>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Password Baru
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                maxLength={72}
                required
                placeholder="Minimal 8 karakter"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Konfirmasi Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={8}
                maxLength={72}
                required
                placeholder="Ulangi password"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs outline-none focus:border-blue-600"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 p-2 text-xs text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-700 px-3 py-2 text-xs font-bold text-white hover:bg-blue-800 disabled:opacity-50"
            >
              {loading ? "Menyimpan..." : "Simpan Password Baru"}
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setResetOpen(false);
                setError("");
              }}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Batal
            </button>
          </form>
        )}

        {error && !resetOpen && (
          <p className="text-xs text-red-600">{error}</p>
        )}
      </div>
    );
  }

  // Belum memiliki akun atau akun sebelumnya dinonaktifkan.
  return (
    <div className="min-w-[190px]">
      {!open ? (
        <div className="space-y-2">
          <span className="inline-flex rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600">
            Belum Ada Akun Aktif
          </span>

          <button
            type="button"
            onClick={() => {
              setError("");
              setOpen(true);
            }}
            className="w-full rounded-lg bg-blue-700 px-4 py-2 text-xs font-bold text-white hover:bg-blue-800"
          >
            + Buat / Aktifkan Akun
          </button>

          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="w-72 space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-lg"
        >
          <div>
            <h3 className="font-bold text-slate-800">
              Buat / Aktifkan Akun Siswa
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Masukkan email dan password login siswa.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Email Login
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Masukkan email siswa"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Kata Sandi
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 8 karakter"
              minLength={8}
              maxLength={72}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Konfirmasi Kata Sandi
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ulangi kata sandi"
              minLength={8}
              maxLength={72}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 p-2 text-xs text-red-600">
              {error}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-blue-700 px-3 py-2 text-xs font-bold text-white hover:bg-blue-800 disabled:opacity-50"
            >
              {loading ? "Menyimpan..." : "Simpan Akun"}
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setOpen(false);
                setError("");
              }}
              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Batal
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
