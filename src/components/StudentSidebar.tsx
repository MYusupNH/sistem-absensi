
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  fullName: string;
  email: string;
};

const navigation = [
  { label: "Dashboard", icon: "▦", href: "/siswa" },
  { label: "Aktivitas PKL", icon: "📋", href: "/siswa/aktivitas" },
  { label: "Riwayat Laporan", icon: "◴", href: "/siswa/riwayat" },
];

export default function StudentSidebar({ fullName, email }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const firstName = fullName.split(" ")[0] || "Siswa";

  async function handleLogout() {
    setLoggingOut(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Gagal keluar dari akun.");
      }

      router.push("/login");
      router.refresh();
    } catch {
      setLoggingOut(false);
      alert("Gagal keluar. Silakan coba kembali.");
    }
  }

  return (
    <>
      {/* HEADER MOBILE */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-[68px] items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-white">
            <Image
              src="/logo.png"
              alt="Logo STRIDE"
              fill
              className="object-contain p-1"
            />
          </div>

          <div>
            <p className="font-black text-slate-900">STRIDE</p>
            <p className="text-[9px] font-bold tracking-widest text-slate-400">
              STUDENT PORTAL
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-xl text-slate-700"
          aria-label="Buka menu"
        >
          {mobileMenuOpen ? "✕" : "☰"}
        </button>
      </header>

      {/* OVERLAY MOBILE */}
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Tutup menu"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col bg-[#102344] text-white transition-transform duration-300 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        {/* LOGO */}
        <div className="flex h-[82px] items-center gap-3 border-b border-white/10 px-6">
          <div className="relative h-11 w-11 overflow-hidden rounded-xl bg-white p-1">
            <Image
              src="/logo.png"
              alt="Logo STRIDE"
              fill
              priority
              className="object-contain p-1"
            />
          </div>

          <div>
            <h1 className="text-xl font-black tracking-wide">STRIDE</h1>
            <p className="text-[9px] font-bold tracking-[0.2em] text-blue-200">
              STUDENT PORTAL
            </p>
          </div>
        </div>

        {/* PROFIL SISWA */}
        <div className="border-b border-white/10 px-5 py-5">
          <div className="flex items-center gap-3 rounded-2xl bg-white/[0.07] p-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cyan-500 text-lg font-black">
              {firstName.charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{fullName}</p>
              <p className="mt-1 text-[11px] text-blue-200">Siswa PKL</p>
            </div>
          </div>
        </div>

        {/* NAVIGASI */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
          <p className="mb-3 px-3 text-[10px] font-black tracking-[0.2em] text-blue-300/60">
            MENU UTAMA
          </p>

          {navigation.map((item) => {
            const active =
              item.href === "/siswa"
                ? pathname === "/siswa"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  active
                    ? "bg-cyan-500 text-white shadow-lg shadow-cyan-950/20"
                    : "text-blue-100 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span className="flex h-6 w-6 items-center justify-center text-lg">
                  {item.icon}
                </span>

                {item.label}
              </Link>
            );
          })}

          <div className="my-5 border-t border-white/10" />

          <p className="mb-3 px-3 text-[10px] font-black tracking-[0.2em] text-blue-300/60">
            DOKUMEN
          </p>

          <Link
            href="/siswa/laporan-akhir"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
              pathname.startsWith("/siswa/laporan-akhir")
                ? "bg-cyan-500 text-white"
                : "text-blue-100 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span className="flex h-6 w-6 items-center justify-center text-lg">
              ▧
            </span>

            Laporan Akhir PKL
          </Link>
        </nav>

        {/* AKUN DAN LOGOUT */}
        <div className="border-t border-white/10 p-4">
          <div className="mb-3 rounded-xl bg-white/[0.06] p-3">
            <p className="text-[10px] font-bold tracking-wider text-blue-200">
              AKUN SISWA
            </p>

            <p className="mt-1 truncate text-xs text-white">{email}</p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold text-red-200 transition hover:bg-red-500/10 disabled:opacity-50"
          >
            <span className="text-lg">↪</span>
            {loggingOut ? "Sedang keluar..." : "Keluar dari akun"}
          </button>

          <p className="mt-4 text-center text-[10px] text-blue-300/50">
            © {new Date().getFullYear()} STRIDE
          </p>
        </div>
      </aside>
    </>
  );
}
