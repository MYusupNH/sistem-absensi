
import { redirect } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { sql } from "@/lib/db";
import TambahAkunForm from "./TambahAkunForm";

export const dynamic = "force-dynamic";

export default async function TambahAkunPage() {
  const admin = await requireRole("admin");

  if (!admin) {
    redirect("/login");
  }

  const result = await sql`
    SELECT id, school_name
    FROM schools
    WHERE status = 'ACTIVE'
    ORDER BY school_name ASC
  `;

  const schools = result.map((school) => ({
    id: Number(school.id),
    schoolName: String(school.school_name),
  }));

  return (
    <main className="min-h-screen bg-[#f4f7fc]">

      <header className="bg-gradient-to-br from-[#071a3d] via-[#102d62] to-[#164e91] px-6 py-9 text-white md:px-10">
        <div className="mx-auto max-w-4xl">

          <Link
            href="/admin/manajemen-akun"
            className="mb-5 inline-flex items-center gap-2 text-sm text-blue-100 transition hover:text-white"
          >
            ← Kembali ke Manajemen Akun
          </Link>

          <p className="mb-3 text-xs font-bold tracking-widest text-cyan-300">
            STRIDE ADMINISTRATOR
          </p>

          <h1 className="text-3xl font-extrabold">
            Tambah Akun Pengguna
          </h1>

          <p className="mt-3 text-sm text-blue-100/80">
            Buat akun admin, guru/sekolah, atau siswa secara manual.
          </p>

        </div>
      </header>

      <section className="mx-auto max-w-4xl px-5 py-8 md:px-10">
        <TambahAkunForm schools={schools} />
      </section>

    </main>
  );
}
