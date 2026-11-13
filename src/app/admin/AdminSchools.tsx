"use client";

import { useEffect, useState } from "react";

type School = {
  id: number;
  school_name: string;
  npsn: string;
  school_code: string;
  address: string | null;
  phone: string | null;
  status: "PENDING" | "ACTIVE" | "REJECTED";
  full_name: string | null;
  email: string | null;
};

export default function AdminSchools() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadSchools() {
    try {
      const response = await fetch("/api/admin/schools");
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Gagal memuat sekolah.");
        return;
      }

      setSchools(data.schools);
    } catch {
      setMessage("Tidak dapat terhubung ke server.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSchools();
  }, []);

  async function updateStatus(id: number, status: "ACTIVE" | "REJECTED") {
    const confirmation =
      status === "ACTIVE"
        ? "Verifikasi dan aktifkan sekolah ini?"
        : "Tolak pendaftaran sekolah ini?";

    if (!window.confirm(confirmation)) return;

    setMessage("");

    try {
      const response = await fetch("/api/admin/schools", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });

      const data = await response.json();
      setMessage(data.message);

      if (response.ok) await loadSchools();
    } catch {
      setMessage("Tidak dapat terhubung ke server.");
    }
  }

  return (
    <section className="mt-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Pendaftaran Sekolah</h2>
          <p className="text-sm text-slate-500">
            Periksa dan verifikasi akun sekolah.
          </p>
        </div>

        <button
          onClick={loadSchools}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
        >
          Muat ulang
        </button>
      </div>

      {message && (
        <p className="mb-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
          {message}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Memuat data sekolah...</p>
      ) : schools.length === 0 ? (
        <p className="rounded-xl bg-white p-6 text-center text-slate-500">
          Belum ada pendaftaran sekolah.
        </p>
      ) : (
        <div className="space-y-4">
          {schools.map((school) => (
            <article
              key={school.id}
              className="rounded-xl border border-slate-200 bg-white p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-900">
                    {school.school_name}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    NPSN: {school.npsn}
                  </p>
                  <p className="text-sm text-slate-500">
                    Penanggung jawab: {school.full_name || "-"}
                  </p>
                  <p className="text-sm text-slate-500">
                    Email: {school.email || "-"}
                  </p>
                  <p className="text-sm text-slate-500">
                    Kode sekolah: {school.school_code}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    {school.address || "Alamat belum diisi"}
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    school.status === "ACTIVE"
                      ? "bg-green-100 text-green-700"
                      : school.status === "REJECTED"
                      ? "bg-red-100 text-red-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {school.status}
                </span>
              </div>

              {school.status === "PENDING" && (
                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    onClick={() => updateStatus(school.id, "ACTIVE")}
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Verifikasi sekolah
                  </button>

                  <button
                    onClick={() => updateStatus(school.id, "REJECTED")}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Tolak
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}