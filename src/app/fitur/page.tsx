
import Link from "next/link";

const features = [
  {
    icon: "🔎",
    title: "Cari Tempat PKL",
    description:
      "Temukan berbagai informasi lowongan PKL dari perusahaan dan instansi yang membuka kesempatan bagi siswa.",
  },
  {
    icon: "📝",
    title: "Pengajuan PKL",
    description:
      "Sekolah dapat mengajukan beberapa siswa sekaligus untuk mengikuti program Praktik Kerja Lapangan.",
  },
  {
    icon: "🏫",
    title: "Data Sekolah",
    description:
      "Informasi sekolah dan siswa dikelola dalam satu sistem yang terintegrasi.",
  },
  {
    icon: "📊",
    title: "Monitoring PKL",
    description:
      "Pantau informasi pengajuan, status penerimaan, dan perkembangan kegiatan PKL.",
  },
];

export default function FiturPage() {
  return (
    <main className="min-h-screen bg-[#020b20] text-white">
      <header className="border-b border-white/10 bg-[#06142f]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-2xl font-black">
            STRIDE<span className="text-cyan-400">.</span>
          </Link>

          <nav className="flex items-center gap-6 text-sm">
            <Link href="/" className="text-blue-100 hover:text-cyan-400">Beranda</Link>
            <Link href="/lowongan-pkl" className="text-blue-100 hover:text-cyan-400">Lowongan PKL</Link>
            <Link href="/fitur" className="font-bold text-cyan-400">Fitur</Link>
            <Link href="/tentang" className="text-blue-100 hover:text-cyan-400">Tentang</Link>
          </nav>

          <Link href="/login" className="rounded-full bg-blue-600 px-5 py-3 text-sm font-bold hover:bg-cyan-500">
            Masuk Sistem →
          </Link>
        </div>
      </header>

      <section className="bg-gradient-to-br from-[#071a36] via-[#10376b] to-[#087eaa] px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <p className="font-bold uppercase tracking-[4px] text-cyan-300">
            Fitur STRIDE
          </p>
          <h1 className="mt-6 max-w-3xl text-4xl font-black leading-tight md:text-6xl">
            Semua Kebutuhan PKL
            <span className="block text-cyan-300">Dalam Satu Platform.</span>
          </h1>
          <p className="mt-6 max-w-2xl leading-8 text-blue-100/80">
            STRIDE menyediakan fasilitas informasi dan pengelolaan
            Praktik Kerja Lapangan untuk sekolah dan siswa.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-20 md:grid-cols-2 lg:grid-cols-4">
        {features.map((feature) => (
          <article key={feature.title} className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 transition hover:-translate-y-2 hover:border-cyan-400/50">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-3xl">
              {feature.icon}
            </div>
            <h2 className="mt-7 text-xl font-extrabold">{feature.title}</h2>
            <p className="mt-4 text-sm leading-7 text-blue-100/60">
              {feature.description}
            </p>
          </article>
        ))}
      </section>

      <footer className="border-t border-white/10 px-6 py-8 text-center text-sm text-blue-100/50">
        © {new Date().getFullYear()} STRIDE — Sistem Informasi Praktik Kerja Lapangan.
      </footer>
    </main>
  );
}
