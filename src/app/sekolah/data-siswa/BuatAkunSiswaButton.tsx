
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
        <p className="text-sm font-semibold text-emerald-800">
          Akun berhasil disimpan
        </p>

        <div className="space-y-2 text-xs text-slate-700">
          <div>
            <p className="font-medium">Email</p>
            <p className="break-all text-black">{credentials.email}</p>
          </div>

          <div>
            <p className="font-medium">Password</p>
            <p className="break-all text-black">{credentials.password}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={salinAkun}
          className="w-full rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
        >
          {copied ? "Berhasil Disalin" : "Salin Email dan Password"}
        </button>

        <button
          type="button"
          onClick={() => setCredentials(null)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          Tutup
        </button>
      </div>
    );
  }

  // Akun aktif.
  if (accountExists) {
    return (
      <div className="w-56 space-y-2">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-xs font-semibold text-emerald-700">
            Akun Aktif
          </span>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 p-2 text-xs text-red-600">
            {error}
          </p>
        )}

        {!resetOpen ? (
          <>
            <button
              type="button"
              onClick={() => {
                setResetOpen(true);
                setError("");
              }}
              className="w-full rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
            >
              Atur Ulang Password
            </button>

            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
            >
              {deleting ? "Memproses..." : "Nonaktifkan Akun"}
            </button>
          </>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-3">
            <p className="text-xs font-semibold text-slate-700">
              Atur Ulang Password
            </p>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Password Baru
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                maxLength={72}
                required
                placeholder="Minimal 8 karakter"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-black outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Konfirmasi Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={8}
                maxLength={72}
                required
                placeholder="Ulangi password"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-black outline-none focus:border-blue-600"
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
              />
              Tampilkan password
            </label>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Menyimpan..." : "Simpan"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setResetOpen(false);
                  setPassword("");
                  setConfirmPassword("");
                  setError("");
                  setShowPassword(false);
                }}
                className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
            </div>
          </form>
        )}
      </div>
    );
  }

  // Belum memiliki akun atau akun sebelumnya dinonaktifkan.
  return (
    <div className="min-w-[190px]">
      {!open ? (
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setError("");
          }}
          className="w-full rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
        >
          + Buat Akun
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <p className="text-xs font-semibold text-slate-700">
            Buat Akun Siswa
          </p>

          {error && (
            <p className="rounded-lg bg-red-50 p-2 text-xs text-red-600">
              {error}
            </p>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Email Login
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Masukkan email siswa"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-black outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 8 karakter"
              minLength={8}
              maxLength={72}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-black outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Konfirmasi Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ulangi kata sandi"
              minLength={8}
              maxLength={72}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-black outline-none focus:border-blue-600"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
            />
            Tampilkan password
          </label>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Menyimpan..." : "Simpan Akun"}
            </button>

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setEmail("");
                setPassword("");
                setConfirmPassword("");
                setError("");
                setShowPassword(false);
              }}
              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Batal
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
