
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const menuGroups = [
  {
    title: "MENU UTAMA",
    items: [
      {
        label: "Dashboard",
        href: "/sekolah",
        icon: "⌂",
      },
      {
        label: "Pengajuan PKL",
        href: "/sekolah/pengajuan-pkl",
        icon: "▤",
      },
      {
        label: "Status Pengajuan",
        href: "/sekolah/status-pengajuan",
        icon: "◷",
      },
      {
        label: "Data Siswa PKL",
        href: "/sekolah/data-siswa",
        icon: "♟",
      },
    ],
  },
  {
    title: "PEMANTAUAN",
    items: [
      {
        label: "Pemantauan Absensi",
        href: "/sekolah/absensi",
        icon: "✓",
      },
      {
        label: "Ketidakhadiran",
        href: "/sekolah/ketidakhadiran",
        icon: "!",
      },
      {
        label: "Laporan PKL",
        href: "/sekolah/laporan",
        icon: "▧",
      },
    ],
  },
];

const mobileMenus = [
  {
    label: "Dashboard",
    href: "/sekolah",
    icon: "⌂",
  },
  {
    label: "Pengajuan",
    href: "/sekolah/pengajuan-pkl",
    icon: "▤",
  },
  {
    label: "Status",
    href: "/sekolah/status-pengajuan",
    icon: "◷",
  },
  {
    label: "Siswa",
    href: "/sekolah/data-siswa",
    icon: "♟",
  },
  {
    label: "Absensi",
    href: "/sekolah/absensi",
    icon: "✓",
  },
  {
    label: "Izin",
    href: "/sekolah/ketidakhadiran",
    icon: "!",
  },
  {
    label: "Laporan",
    href: "/sekolah/laporan",
    icon: "▧",
  },
];

export default function SchoolSidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/sekolah") {
      return pathname === "/sekolah";
    }

    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <>
      {/* SIDEBAR DESKTOP */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[270px] flex-col border-r border-white/10 bg-[#07152f] text-white md:flex">

        {/* LOGO STRIDE */}
        <div className="flex h-[95px] shrink-0 items-center gap-3 border-b border-white/10 px-5">
          <Link
            href="/sekolah"
            className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white p-1.5 shadow-lg shadow-cyan-500/20 transition hover:scale-105"
          >
            <Image
              src="/logo.png"
              alt="Logo STRIDE"
              fill
              priority
              sizes="56px"
              className="object-contain p-1"
            />
          </Link>

          <div className="min-w-0">
            <h1 className="text-xl font-extrabold tracking-wider">
              STRIDE<span className="text-cyan-400">.</span>
            </h1>

            <p className="mt-1 text-[9px] font-bold tracking-[1.5px] text-cyan-300">
              PORTAL GURU & SEKOLAH
            </p>

            <p className="mt-1 text-[10px] text-slate-400">
              Sistem Informasi PKL
            </p>
          </div>
        </div>

        {/* MENU */}
        <nav className="flex-1 space-y-8 overflow-y-auto px-4 py-7">
          {menuGroups.map((group) => (
            <div key={group.title}>
              <p className="mb-3 px-3 text-[10px] font-bold tracking-[2px] text-slate-500">
                {group.title}
              </p>

              <div className="space-y-2">
                {group.items.map((item) => {
                  const active = isActive(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group flex items-center gap-3 rounded-xl px-3 py-3 transition-all duration-200 ${
                        active
                          ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-blue-950/40"
                          : "text-slate-300 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-xl text-xl ${
                          active
                            ? "bg-white/20"
                            : "bg-white/5 group-hover:bg-white/10"
                        }`}
                      >
                        {item.icon}
                      </span>

                      <span className="flex-1 text-[13px] font-semibold">
                        {item.label}
                      </span>

                      {active && (
                        <span className="h-2 w-2 rounded-full bg-white" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* INFORMASI */}
        <div className="px-4 pb-4">
          <div className="rounded-2xl border border-cyan-400/10 bg-gradient-to-br from-blue-500/15 to-cyan-500/5 p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />

              <p className="text-xs font-bold text-white">
                Portal STRIDE Aktif
              </p>
            </div>

            <p className="text-[11px] leading-relaxed text-slate-400">
              Kelola pengajuan siswa dan pantau kegiatan PKL sekolah Anda.
            </p>
          </div>
        </div>

        {/* LOGOUT */}
        <div className="border-t border-white/10 p-4">
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/10 hover:text-red-200"
            >
              <span className="text-xl">↪</span>
              Keluar dari Akun
            </button>
          </form>

          <p className="mt-3 text-center text-[9px] text-slate-600">
            © {new Date().getFullYear()} STRIDE
          </p>
        </div>
      </aside>

      {/* NAVBAR MOBILE */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#07152f] px-1 py-2 md:hidden">
        <div className="grid grid-cols-7 gap-0.5">
          {mobileMenus.map((item) => {
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-0.5 py-2 text-[9px] font-medium transition ${
                  active
                    ? "bg-cyan-500/15 text-cyan-300"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="truncate max-w-full">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
