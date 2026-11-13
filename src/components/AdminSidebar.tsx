
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const menuGroups = [
  {
    title: "MENU UTAMA",
    items: [{ name: "Dashboard", icon: "▦", href: "/admin" }],
  },
  {
    title: "DATA MASTER",
    items: [
      { name: "Data Sekolah", icon: "▤", href: "/admin/sekolah" },
      { name: "Data Siswa", icon: "♟", href: "/admin/siswa" },
      { name: "Manajemen Akun", icon: "♙", href: "/admin/manajemen-akun" },
    ],
  },
  {
    title: "MANAJEMEN PKL",
    items: [
      { name: "Lowongan PKL", icon: "▣", href: "/admin/lowongan-pkl" },
      { name: "Pengajuan PKL", icon: "▤", href: "/admin/pengajuan-pkl" },
      { name: "Presensi Siswa", icon: "◷", href: "/admin/presensi" },
      { name: "Logbook Siswa", icon: "▧", href: "/admin/logbook" },
    ],
  },
  {
    title: "LAPORAN",
    items: [
      { name: "Laporan", icon: "▥", href: "/admin/laporan" },
      {
        name: "Rekap Absensi",
        icon: "▤",
        href: "/admin/rekap-absensi",
      },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/admin") {
      return pathname === "/admin";
    }

    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <>
      {/* TOMBOL MOBILE */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed left-4 top-4 z-50 flex h-11 w-11 items-center justify-center rounded-xl bg-[#102b59] text-xl text-white shadow-lg transition hover:bg-blue-800 md:hidden"
        aria-label="Buka menu"
      >
        ☰
      </button>

      {/* OVERLAY MOBILE */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm md:hidden"
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col bg-gradient-to-b from-[#071a3d] via-[#0b2450] to-[#102f60] text-white shadow-2xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        {/* HEADER LOGO DAN LOGOUT */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-5">
          <Link
            href="/admin"
            onClick={() => setIsOpen(false)}
            className="flex min-w-0 items-center gap-3"
          >
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-white p-1 shadow-lg shadow-cyan-500/20">
              <Image
                src="/logo.png"
                alt="Logo STRIDE"
                fill
                priority
                sizes="44px"
                className="object-contain p-1"
              />
            </div>

            <div className="min-w-0">
              <h1 className="text-lg font-extrabold tracking-wider">
                STRIDE
              </h1>
              <p className="text-[9px] tracking-[0.15em] text-cyan-300">
                ADMINISTRATOR
              </p>
            </div>
          </Link>

          <div className="ml-2 flex shrink-0 items-center gap-1">
            {/* LOGOUT */}
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                title="Logout"
                aria-label="Logout"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-400/20 bg-red-500/10 text-lg text-red-200 transition hover:border-red-400/40 hover:bg-red-500/25 hover:text-white"
              >
                ↪
              </button>
            </form>

            {/* TOMBOL TUTUP MOBILE */}
            <button
              onClick={() => setIsOpen(false)}
              className="flex h-9 w-7 items-center justify-center text-2xl text-white/70 transition hover:text-white md:hidden"
              aria-label="Tutup menu"
            >
              ×
            </button>
          </div>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-6">
          {menuGroups.map((group) => (
            <div key={group.title}>
              <p className="mb-3 px-3 text-[10px] font-bold tracking-[0.18em] text-blue-300/60">
                {group.title}
              </p>

              <div className="space-y-1.5">
                {group.items.map((item) => {
                  const active = isActive(item.href);

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 ${
                        active
                          ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-blue-950/30"
                          : "text-blue-100/75 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base transition ${
                          active
                            ? "bg-white/20"
                            : "bg-white/[0.07] group-hover:bg-white/15"
                        }`}
                      >
                        {item.icon}
                      </span>

                      <span>{item.name}</span>

                      {active && (
                        <span className="ml-auto h-2 w-2 rounded-full bg-white" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* FOOTER SIDEBAR */}
        <div className="border-t border-white/10 p-5">
          <p className="text-center text-[10px] leading-5 text-blue-200/50">
            STRIDE - Sistem Informasi
            <br />
            Praktik Kerja Lapangan
          </p>
        </div>
      </aside>
    </>
  );
}
