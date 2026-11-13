
"use client";

import Image from "next/image";
import Link from "next/link";
import { Plus_Jakarta_Sans } from "next/font/google";
import { useState } from "react";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--f-sans",
});

const menu = [
  { href: "/", label: "Beranda" },
  { href: "/lowongan-pkl", label: "Lowongan" },
  { href: "/fitur", label: "Fitur" },
  { href: "/tentang", label: "Tentang" },
  { href: "/register-sekolah", label: "Daftar Sekolah" },
  { href: "/login", label: "Masuk Sistem" },
];

const line = "stroke-[#3B82F6]";

function Arch({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 90 90" className={className} fill="none" aria-hidden="true">
      <path
        d="M3 87V40C3 20 22 3 45 3s42 17 42 37v47z"
        className={`${line} fill-[#1E3A8A]/40`}
        strokeWidth="2"
      />
      <path
        d="M45 3v84M3 50c20 0 42-8 42-30M87 50c-20 0-42-8-42-30"
        className={line}
        strokeWidth="2"
      />
    </svg>
  );
}

function Block({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 90 90" className={className} fill="none" aria-hidden="true">
      <rect
        x="2"
        y="2"
        width="86"
        height="86"
        className={`${line} fill-[#1E3A8A]/30`}
        strokeWidth="2"
      />
      <path
        d="M2 45c30 0 43-12 43-43M88 45C58 45 45 57 45 88"
        className={line}
        strokeWidth="2"
      />
      <path
        d="M45 2h43v43c-24 0-43-19-43-43z"
        className="fill-[#2563EB]"
      />
    </svg>
  );
}

function Dots({ className = "" }: { className?: string }) {
  const pts = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    return [45 + 30 * Math.cos(a), 45 + 30 * Math.sin(a)];
  });

  return (
    <svg viewBox="0 0 90 90" className={className} fill="none" aria-hidden="true">
      <rect
        x="2"
        y="2"
        width="86"
        height="86"
        className={`${line} fill-[#1E3A8A]/30`}
        strokeWidth="2"
      />
      {pts.map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r="5"
          className={`${line} ${i % 2 ? "fill-[#2563EB]" : "fill-transparent"}`}
          strokeWidth="2"
        />
      ))}
    </svg>
  );
}

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <main
      className={`${sans.variable} min-h-screen bg-[#0F2A5F] font-[family-name:var(--f-sans)] text-white`}
    >
      <style>{`
        @keyframes rise {
          from {
            opacity: 0;
            transform: translateY(22px);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }
      `}</style>

      {/* NAVBAR */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0A1F44] shadow-lg shadow-black/20">
        <div className="relative mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">

          {/* LOGO DAN BRAND */}
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="group flex shrink-0 items-center gap-3"
          >
            <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-white/20 bg-white shadow-lg transition duration-300 group-hover:scale-105">
              <Image
                src="/logo.png"
                alt="Logo STRIDE"
                fill
                priority
                sizes="44px"
                className="object-contain p-1.5"
              />
            </span>

            <span className="hidden flex-col leading-none sm:flex">
              <span className="text-[17px] font-extrabold tracking-[0.12em] text-white">
                STRIDE
              </span>
              <span className="mt-1.5 text-[9px] font-semibold tracking-[0.13em] text-blue-200/90">
                SISTEM INFORMASI PKL
              </span>
            </span>
          </Link>

          {/* MENU DESKTOP */}
          <nav className="hidden items-center gap-5 text-sm font-medium lg:flex xl:gap-7">
            {menu.slice(0, 4).map((m) => (
              <Link
                key={m.href}
                href={m.href}
                className={`border-b-2 py-1 transition hover:text-[#FFD43B] ${
                  m.href === "/"
                    ? "border-[#FFD43B]"
                    : "border-transparent"
                }`}
              >
                {m.label}
              </Link>
            ))}
          </nav>

          {/* TOMBOL LOGIN DESKTOP */}
          <Link
            href="/login"
            className="hidden shrink-0 rounded-full bg-[#FFD43B] px-5 py-2.5 text-sm font-bold text-[#1B1B5E] shadow-sm transition hover:bg-[#FFE066] lg:block"
          >
            Masuk Sistem
          </Link>

          {/* TOMBOL HAMBURGER MOBILE DAN TABLET */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Tutup menu" : "Buka menu"}
            aria-expanded={mobileMenuOpen}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/40 text-white transition hover:bg-white/10 lg:hidden"
          >
            {mobileMenuOpen ? (
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* DROPDOWN MENU MOBILE */}
        {mobileMenuOpen && (
          <div className="absolute left-0 right-0 top-[72px] z-50 border-t border-white/10 bg-[#0A1F44] px-5 py-4 shadow-xl lg:hidden">
            <nav className="mx-auto flex max-w-7xl flex-col gap-1">
              {menu.map((m) => (
                <Link
                  key={m.href}
                  href={m.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`rounded-lg px-4 py-3 text-sm font-semibold transition ${
                    m.href === "/login"
                      ? "mt-2 bg-[#FFD43B] text-[#1B1B5E] hover:bg-[#FFE066]"
                      : "text-white/90 hover:bg-white/10 hover:text-[#FFD43B]"
                  }`}
                >
                  {m.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* HERO */}
      <section className="relative isolate overflow-hidden">

        {/* FOTO BACKGROUND */}
        <div className="pointer-events-none absolute inset-0 -z-20">
          <Image
            src="/bsi2.jpeg"
            alt="Informasi Praktik Kerja Lapangan"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[65%_center] md:object-[65%_center]"
          />

          {/* GRADASI KIRI */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to right, rgba(15,42,95,.88) 0%, rgba(15,42,95,.72) 18%, rgba(15,42,95,.48) 36%, rgba(15,42,95,.2) 56%, rgba(15,42,95,.04) 78%, transparent 100%)",
            }}
          />

          {/* GRADASI ATAS */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(15,42,95,.75) 0%, rgba(15,42,95,.3) 8%, transparent 22%)",
            }}
          />

          {/* GRADASI BAWAH */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, rgba(15,42,95,.8) 0%, rgba(15,42,95,.35) 10%, transparent 28%)",
            }}
          />
        </div>

        <div className="relative mx-auto min-h-[calc(100vh-72px)] max-w-[1600px]">

          {/* HALFTONE DOTS */}
          <div
            aria-hidden="true"
            className="absolute left-[48%] top-8 -z-10 hidden h-[360px] w-[420px] opacity-60 md:block"
            style={{
              backgroundImage: "radial-gradient(#3B63D8 2.2px, transparent 2.6px)",
              backgroundSize: "22px 22px",
              WebkitMaskImage:
                "radial-gradient(ellipse at center, #000 20%, transparent 70%)",
              maskImage:
                "radial-gradient(ellipse at center, #000 20%, transparent 70%)",
            }}
          />

          {/* ORNAMEN KIRI */}
          <div
            aria-hidden="true"
            className="absolute left-0 top-[26%] -z-10 hidden w-[150px] sm:block"
          >
            <Block className="h-[90px] w-[90px]" />
            <div className="ml-[90px]">
              <Dots className="h-[58px] w-[58px]" />
            </div>
            <Arch className="mt-0 h-[90px] w-[90px]" />
            <Block className="h-[90px] w-[90px]" />
          </div>

          <div
            aria-hidden="true"
            className="absolute bottom-0 left-[26%] -z-10 hidden md:block"
          >
            <Arch className="h-[100px] w-[100px]" />
          </div>

          {/* ORNAMEN KANAN ATAS */}
          <div
            aria-hidden="true"
            className="absolute right-[3%] top-[12%] -z-10 hidden xl:block"
          >
            <Arch className="h-[84px] w-[84px]" />
            <Block className="ml-10 mt-3 h-[88px] w-[88px]" />
          </div>

          {/* TEKS HERO */}
          <div className="relative z-10 px-6 pb-16 pt-14 sm:pl-20 sm:pr-8 md:px-[104px] md:pt-24">

            <p className="animate-[rise_.8s_.05s_ease-out_both] text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-300 motion-reduce:animate-none sm:text-xs sm:tracking-[0.22em]">
              Universitas BSI · Kampus Kota Sukabumi
            </p>

            <h1 className="mt-4 max-w-3xl animate-[rise_.8s_.15s_ease-out_both] text-4xl font-extrabold uppercase leading-[1.08] tracking-tight [text-shadow:0_2px_14px_rgba(0,0,0,.55)] motion-reduce:animate-none sm:text-5xl lg:text-[56px]">
              Sistem Informasi
              <span className="block text-[#FFD43B]">
                PKL / Magang
              </span>
            </h1>

            <p className="mt-5 max-w-md animate-[rise_.8s_.35s_ease-out_both] text-sm font-semibold leading-7 text-white/95 [text-shadow:0_2px_10px_rgba(0,0,0,.55)] motion-reduce:animate-none sm:text-lg">
              Temukan lowongan Praktik Kerja Lapangan berdasarkan jurusan,
              lokasi &amp; tanggal mulai.
            </p>

            {/* BADGE */}
            <div className="mt-8 inline-flex animate-[rise_.8s_.55s_ease-out_both] items-center gap-3 rounded-lg bg-white px-3 py-2.5 text-[#1B1B5E] shadow-lg motion-reduce:animate-none">
              <span className="grid h-9 w-9 place-items-center rounded bg-[#F59E0B] text-sm font-extrabold text-white">
                ✓
              </span>

              <span className="text-[10px] font-extrabold uppercase leading-tight tracking-wide">
                Lowongan
                <br />
                Terverifikasi
                <span className="block text-[9px] font-semibold normal-case italic tracking-normal text-[#1B1B5E]/70">
                  Diperbarui {new Date().getFullYear()}
                </span>
              </span>
            </div>

            {/* TOMBOL */}
            <div className="mt-8 flex animate-[rise_.8s_.7s_ease-out_both] flex-wrap items-center gap-3 motion-reduce:animate-none sm:gap-4">
              <Link
                href="/lowongan-pkl"
                className="rounded-full bg-[#FFD43B] px-6 py-3.5 text-sm font-bold text-[#1B1B5E] shadow-lg transition hover:-translate-y-0.5 hover:bg-[#FFE066] sm:px-7"
              >
                Lihat Lowongan
              </Link>

              <Link
                href="/register-sekolah"
                className="rounded-full border border-white/70 px-6 py-3.5 text-sm font-semibold transition hover:bg-white/10 sm:px-7"
              >
                Daftarkan Sekolah →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-[#0A1F44] px-4 py-5 text-center text-xs text-white/85">
        © {new Date().getFullYear()} STRIDE — Sistem Informasi Praktik Kerja Lapangan.{" "}
        <Link
          href="/login"
          className="ml-2 font-semibold underline-offset-2 hover:underline"
        >
          Login Sistem →
        </Link>
      </footer>
    </main>
  );
}
