
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Account = {
  id: number;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
  school_name: string | null;
  created_at: string | Date;
};

export default function ManajemenAkunTable({
  accounts,
}: {
  accounts: Account[];
}) {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Account | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  function roleLabel(role: string) {
    const labels: Record<string, string> = {
      admin: "Admin",
      school: "Guru / Sekolah",
      student: "Siswa",
      partner: "Mitra / Instansi",
    };

    return labels[role] || role;
  }

  function openEdit(account: Account) {
    setEditing(account);
    setFullName(account.full_name);
    setEmail(account.email);
    setPassword("");
    setMessage("");
  }

  async function updateAccount(
    account: Account,
    active: boolean,
    name = account.full_name,
    mail = account.email,
    newPassword = ""
  ) {
    const response = await fetch(
      `/api/admin/manajemen-akun/${account.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: name,
          email: mail,
          is_active: active,
          new_password: newPassword,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Gagal memperbarui akun.");
    }

    return data;
  }

  async function handleSave() {
    if (!editing) return;

    if (!fullName.trim() || !email.trim()) {
      setMessage("Nama dan email wajib diisi.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      await updateAccount(
        editing,
        editing.is_active,
        fullName.trim(),
        email.trim(),
        password
      );

      setEditing(null);
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Terjadi kesalahan."
      );
    } finally {
      setLoading(false);
    }
  }

  async function toggleStatus(account: Account) {
    const action = account.is_active ? "menonaktifkan" : "mengaktifkan";

    if (!confirm(`Yakin ingin ${action} akun ${account.full_name}?`)) {
      return;
    }

    setLoading(true);

    try {
      await updateAccount(account, !account.is_active);
      router.refresh();
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Terjadi kesalahan."
      );
    } finally {
      setLoading(false);
    }
  }

  async function deleteAccount(account: Account) {
    const confirmation = confirm(
      `HAPUS PERMANEN akun ${account.full_name}?\n\nTindakan ini tidak dapat dibatalkan. Jika akun memiliki riwayat PKL, penghapusan akan ditolak.`
    );

    if (!confirmation) return;

    setLoading(true);

    try {
      const response = await fetch(
        `/api/admin/manajemen-akun/${account.id}`,
        { method: "DELETE" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Gagal menghapus akun.");
      }

      alert(data.message);
      router.refresh();
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Terjadi kesalahan."
      );
    } finally {
      setLoading(false);
    }
  }

  const filtered = accounts.filter((account) => {
    const keyword = search.toLowerCase();

    return (
      account.full_name.toLowerCase().includes(keyword) ||
      account.email.toLowerCase().includes(keyword) ||
      roleLabel(account.role).toLowerCase().includes(keyword)
    );
  });

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Daftar Seluruh Akun
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Edit, aktifkan, nonaktifkan, atau hapus akun.
            </p>
          </div>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, email, jenis akun..."
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 md:max-w-xs"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-4">Pengguna</th>
                <th className="px-5 py-4">Jenis Akun</th>
                <th className="px-5 py-4">Sekolah</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Terdaftar</th>
                <th className="px-5 py-4 text-center">Tindakan</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filtered.map((account) => (
                <tr key={account.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-800">
                      {account.full_name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {account.email}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                      {roleLabel(account.role)}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    {account.school_name || "-"}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                        account.is_active
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {account.is_active ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-xs text-slate-500">
                    {new Date(account.created_at).toLocaleDateString(
                      "id-ID",
                      {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      }
                    )}
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEdit(account)}
                        disabled={loading}
                        className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => toggleStatus(account)}
                        disabled={loading}
                        className={`rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-50 ${
                          account.is_active
                            ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                            : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        }`}
                      >
                        {account.is_active ? "Nonaktifkan" : "Aktifkan"}
                      </button>

                      <button
                        onClick={() => deleteAccount(account)}
                        disabled={loading}
                        className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-slate-400"
                  >
                    Tidak ada akun yang ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-100 px-5 py-4 text-xs text-slate-500">
          Menampilkan {filtered.length} dari {accounts.length} akun.
        </div>
      </div>

      {/* MODAL EDIT */}
      {editing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-800">
                  Edit Akun
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Perbarui informasi akun pengguna.
                </p>
              </div>

              <button
                onClick={() => setEditing(null)}
                className="text-2xl text-slate-400 hover:text-slate-700"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Nama Lengkap
                </label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Password Baru
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Kosongkan jika tidak ingin mengubah"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-slate-400">
                  Minimal 8 karakter jika ingin mengganti password.
                </p>
              </div>

              {message && (
                <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                  {message}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setEditing(null)}
                disabled={loading}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>

              <button
                onClick={handleSave}
                disabled={loading}
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
