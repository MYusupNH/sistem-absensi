"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Student = {
  id: number;
  fullName: string;
  email: string;
  nisn: string;
  className: string;
  major: string;
  phone: string;
  schoolName: string;
  isActive: boolean;
  createdAt: string;
};

export default function StudentTable({
  students,
}: {
  students: Student[];
}) {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [schoolFilter, setSchoolFilter] = useState("SEMUA");
  const [statusFilter, setStatusFilter] = useState("SEMUA");

  const [selectedStudent, setSelectedStudent] =
    useState<Student | null>(null);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    nisn: "",
    className: "",
    major: "",
    phone: "",
    password: "",
    isActive: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const schools = useMemo(
    () => [...new Set(students.map((student) => student.schoolName))],
    [students]
  );

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const keyword = search.toLowerCase();

      const matchesSearch =
        student.fullName.toLowerCase().includes(keyword) ||
        student.email.toLowerCase().includes(keyword) ||
        student.nisn.toLowerCase().includes(keyword) ||
        student.schoolName.toLowerCase().includes(keyword);

      const matchesSchool =
        schoolFilter === "SEMUA" ||
        student.schoolName === schoolFilter;

      const matchesStatus =
        statusFilter === "SEMUA" ||
        (statusFilter === "AKTIF" && student.isActive) ||
        (statusFilter === "NONAKTIF" && !student.isActive);

      return matchesSearch && matchesSchool && matchesStatus;
    });
  }, [students, search, schoolFilter, statusFilter]);

  function openEdit(student: Student) {
    setSelectedStudent(student);

    setForm({
      fullName: student.fullName === "-" ? "" : student.fullName,
      email: student.email === "-" ? "" : student.email,
      nisn: student.nisn === "-" ? "" : student.nisn,
      className: student.className === "-" ? "" : student.className,
      major: student.major === "-" ? "" : student.major,
      phone: student.phone === "-" ? "" : student.phone,
      password: "",
      isActive: student.isActive,
    });

    setMessage("");
    setError("");
    setShowPassword(false);
  }

  function closeEdit() {
    if (saving) return;

    setSelectedStudent(null);
    setMessage("");
    setError("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedStudent) return;

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `/api/admin/siswa/${selectedStudent.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal memperbarui data siswa.");
      }

      setMessage("Data siswa berhasil diperbarui.");

      setTimeout(() => {
        setSelectedStudent(null);
        router.refresh();
      }, 700);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat menyimpan data."
      );
    } finally {
      setSaving(false);
    }
  }

  function formatDate(date: string) {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Asia/Jakarta",
    });
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        {/* HEADER */}
        <div className="border-b border-slate-100 p-5 md:p-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                Daftar Siswa
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Kelola informasi dan akun siswa yang terdaftar di STRIDE.
              </p>
            </div>

            <div className="rounded-xl bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
              {filteredStudents.length} dari {students.length} siswa
            </div>
          </div>

          {/* PENCARIAN DAN FILTER */}
          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                🔎
              </span>

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari nama, NISN, email..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            <select
              value={schoolFilter}
              onChange={(event) => setSchoolFilter(event.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-500"
            >
              <option value="SEMUA">Semua Sekolah</option>

              {schools.map((school) => (
                <option key={school} value={school}>
                  {school}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-500"
            >
              <option value="SEMUA">Semua Status</option>
              <option value="AKTIF">Aktif</option>
              <option value="NONAKTIF">Tidak Aktif</option>
            </select>
          </div>
        </div>

        {/* TABEL */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="bg-[#f7f9fd] text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4">Siswa</th>
                <th className="px-6 py-4">NISN</th>
                <th className="px-6 py-4">Kelas / Jurusan</th>
                <th className="px-6 py-4">Sekolah</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    className="transition hover:bg-blue-50/40"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 font-bold text-white">
                          {student.fullName.charAt(0).toUpperCase()}
                        </div>

                        <div>
                          <p className="font-bold text-slate-800">
                            {student.fullName}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {student.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 font-medium text-slate-600">
                      {student.nisn}
                    </td>

                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-700">
                        {student.className}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {student.major}
                      </p>
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {student.schoolName}
                    </td>

                    <td className="px-6 py-4">
                      {student.isActive ? (
                        <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                          Aktif
                        </span>
                      ) : (
                        <span className="rounded-full bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700">
                          Tidak Aktif
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => openEdit(student)}
                        className="rounded-lg bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-600 hover:text-white"
                      >
                        ✏️ Edit
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="text-4xl">🔍</div>

                    <p className="mt-3 font-semibold text-slate-700">
                      Data siswa tidak ditemukan
                    </p>

                    <p className="mt-1 text-sm text-slate-400">
                      Coba gunakan kata kunci atau filter lainnya.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-100 px-6 py-4 text-xs text-slate-400">
          Menampilkan {filteredStudents.length} data siswa.
        </div>
      </div>

      {/* MODAL EDIT SISWA */}
      {selectedStudent && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeEdit();
          }}
        >
          <div className="my-auto w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            {/* MODAL HEADER */}
            <div className="bg-gradient-to-r from-[#071a3d] to-[#1760a8] p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold tracking-[0.2em] text-cyan-300">
                    MANAJEMEN SISWA
                  </p>

                  <h2 className="mt-2 text-xl font-bold">
                    Edit Data Siswa
                  </h2>

                  <p className="mt-1 text-sm text-blue-100">
                    Perbarui informasi dan akun siswa.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeEdit}
                  disabled={saving}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-2xl transition hover:bg-white/20 disabled:opacity-50"
                  aria-label="Tutup"
                >
                  ×
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="max-h-[65vh] space-y-5 overflow-y-auto p-6">
                {/* PESAN */}
                {message && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                    ✓ {message}
                  </div>
                )}

                {error && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                    {error}
                  </div>
                )}

                {/* IDENTITAS */}
                <div>
                  <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-500">
                    Informasi Siswa
                  </h3>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Nama Lengkap
                      </label>

                      <input
                        required
                        value={form.fullName}
                        onChange={(event) =>
                          setForm({ ...form, fullName: event.target.value })
                        }
                        placeholder="Masukkan nama lengkap"
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Email
                      </label>

                      <input
                        required
                        type="email"
                        value={form.email}
                        onChange={(event) =>
                          setForm({ ...form, email: event.target.value })
                        }
                        placeholder="nama@email.com"
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        NISN
                      </label>

                      <input
                        value={form.nisn}
                        onChange={(event) =>
                          setForm({ ...form, nisn: event.target.value })
                        }
                        placeholder="Masukkan NISN"
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Kelas
                      </label>

                      <input
                        value={form.className}
                        onChange={(event) =>
                          setForm({ ...form, className: event.target.value })
                        }
                        placeholder="Contoh: XII"
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Jurusan
                      </label>

                      <input
                        value={form.major}
                        onChange={(event) =>
                          setForm({ ...form, major: event.target.value })
                        }
                        placeholder="Contoh: Rekayasa Perangkat Lunak"
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Nomor HP
                      </label>

                      <input
                        value={form.phone}
                        onChange={(event) =>
                          setForm({ ...form, phone: event.target.value })
                        }
                        placeholder="08xxxxxxxxxx"
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100" />

                {/* KATA SANDI */}
                <div>
                  <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-slate-500">
                    Pengaturan Kata Sandi
                  </h3>

                  <p className="mb-3 text-xs leading-relaxed text-slate-400">
                    Kata sandi lama tidak ditampilkan. Kosongkan kolom ini
                    jika tidak ingin mengganti kata sandi siswa.
                  </p>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Kata Sandi Baru
                  </label>

                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={form.password}
                      onChange={(event) =>
                        setForm({ ...form, password: event.target.value })
                      }
                      placeholder="Masukkan kata sandi baru (minimal 8 karakter)"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-20 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-blue-600"
                    >
                      {showPassword ? "Sembunyikan" : "Lihat"}
                    </button>
                  </div>
                </div>

                <div className="border-t border-slate-100" />

                {/* STATUS */}
                <div>
                  <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">
                    Status Akun
                  </h3>

                  <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 p-4 transition hover:bg-slate-50">
                    <div>
                      <p className="text-sm font-bold text-slate-700">
                        Akun Siswa
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {form.isActive
                          ? "Siswa dapat login ke platform STRIDE."
                          : "Siswa tidak dapat login ke platform STRIDE."}
                      </p>
                    </div>

                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(event) =>
                        setForm({ ...form, isActive: event.target.checked })
                      }
                      className="h-5 w-5 accent-blue-600"
                    />
                  </label>
                </div>

                <div className="rounded-xl bg-blue-50 p-4">
                  <p className="text-xs leading-relaxed text-blue-700">
                    <strong>Sekolah:</strong> {selectedStudent.schoolName}
                    <br />
                    <strong>Tanggal daftar:</strong>{" "}
                    {formatDate(selectedStudent.createdAt)}
                  </p>
                  <p className="mt-2 text-xs text-blue-600">
                    Informasi sekolah dan tanggal pendaftaran ditampilkan
                    sebagai referensi dan tidak diubah melalui formulir ini.
                  </p>
                </div>
              </div>

              {/* FOOTER MODAL */}
              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 p-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeEdit}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-gradient-to-r from-[#102d62] to-[#1760a8] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-900/10 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}