
import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Tentang STRIDE",
  description:
    "Tentang STRIDE, Sistem Informasi Praktik Kerja Lapangan.",
};

export default function TentangPage() {
  return (
    <main className="min-h-screen bg-[#f5f7fc] text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative h-12 w-12 overflow-hidden rounded-2xl">
              <Image
                src="/logo.png"
                alt="Logo STRIDE"
                fill
                sizes="48px"
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="text-lg font-black text-[#10234b]">
                STRIDE
              </h1>
              <p className="text-[10px] font-bold tracking-[0.2em] text-slate-400">
                STUDENT PORTAL
              </p>
            </div>
          </Link>

          <Link
            href="/"
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-blue-50 hover:text-blue-700"
          >
            ← Kembali ke Beranda
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden bg-gradient-to-br from-[#10234b] via-[#123d83] to-[#0785ad] px-5 py-20 text-white sm:py-28">
        <div className="absolute -right-20 -top-24 h-80 w-80 rounded-full border-[45px] border-white/5" />
        <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="relative mx-auto max-w-5xl text-center">
          <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold tracking-widest text-cyan-100">
            TENTANG KAMI
          </span>

          <h2 className="mt-7 text-4xl font-black leading-tight sm:text-5xl md:text-6xl">
            Mengenal <span className="text-cyan-300">STRIDE</span>
          </h2>

          <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-blue-100 sm:text-lg">
            Sistem Informasi Praktik Kerja Lapangan yang membantu
            mengelola kegiatan PKL secara digital, terstruktur,
            transparan, dan mudah digunakan.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-5 py-16 md:grid-cols-2 md:items-center lg:px-8">
        <div>
          <span className="text-xs font-black tracking-widest text-cyan-700">
            APA ITU STRIDE?
          </span>

          <h3 className="mt-3 text-3xl font-black leading-tight text-[#10234b]">
            Pengelolaan PKL dalam Satu Sistem
          </h3>

          <p className="mt-5 leading-8 text-slate-600">
            STRIDE merupakan Sistem Informasi Praktik Kerja Lapangan
            yang dirancang untuk mempermudah proses administrasi dan
            pemantauan kegiatan PKL antara admin, sekolah, dan siswa.
          </p>

          <p className="mt-4 leading-8 text-slate-600">
            Melalui STRIDE, proses pengajuan PKL, persetujuan,
            penempatan siswa, presensi, hingga pelaporan kegiatan
            dapat dikelola melalui satu platform digital.
          </p>
        </div>

        <div className="rounded-3xl border border-blue-100 bg-white p-8 shadow-xl shadow-blue-100/50">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-blue-50 p-3">
            <div className="relative h-full w-full">
              <Image
                src="/logo.png"
                alt="STRIDE"
                fill
                sizes="96px"
                className="object-contain"
              />
            </div>
          </div>

          <h4 className="mt-6 text-center text-2xl font-black text-[#10234b]">
            STRIDE
          </h4>
          <p className="mt-2 text-center text-sm leading-7 text-slate-500">
            Sistem Informasi Praktik Kerja Lapangan
          </p>
        </div>
      </section>

      <section className="bg-white px-5 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <span className="text-xs font-black tracking-widest text-cyan-700">
              TUJUAN SISTEM
            </span>
            <h3 className="mt-3 text-3xl font-black text-[#10234b]">
              Mengapa STRIDE?
            </h3>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-500">
              Menghadirkan pengelolaan kegiatan PKL yang lebih efektif
              dengan memanfaatkan teknologi informasi.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-3xl border border-slate-100 bg-[#f8faff] p-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-2xl">
                📋
              </div>
              <h4 className="mt-5 font-black text-[#10234b]">
                Administrasi Digital
              </h4>
              <p className="mt-2 text-sm leading-7 text-slate-500">
                Mempermudah proses pengajuan, persetujuan, dan
                pengelolaan data peserta PKL.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-[#f8faff] p-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-100 text-2xl">
                📍
              </div>
              <h4 className="mt-5 font-black text-[#10234b]">
                Presensi Berbasis Lokasi
              </h4>
              <p className="mt-2 text-sm leading-7 text-slate-500">
                Mendukung pencatatan kehadiran siswa melalui foto
                selfie dan verifikasi lokasi GPS.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-[#f8faff] p-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-2xl">
                📊
              </div>
              <h4 className="mt-5 font-black text-[#10234b]">
                Monitoring Kegiatan
              </h4>
              <p className="mt-2 text-sm leading-7 text-slate-500">
                Memudahkan pemantauan kehadiran dan laporan
                aktivitas harian siswa selama PKL.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 lg:px-8">
        <div className="text-center">
          <span className="text-xs font-black tracking-widest text-cyan-700">
            PENGGUNA SISTEM
          </span>
          <h3 className="mt-3 text-3xl font-black text-[#10234b]">
            Terhubung dalam Satu Platform
          </h3>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            {
              icon: "🛡️",
              title: "Admin",
              description:
                "Mengelola pengajuan, data sekolah, penempatan, dan keseluruhan administrasi PKL.",
            },
            {
              icon: "🏫",
              title: "Sekolah",
              description:
                "Mengajukan peserta PKL dan memantau perkembangan siswa yang sedang melaksanakan PKL.",
            },
            {
              icon: "🎓",
              title: "Siswa",
              description:
                "Melakukan presensi, mengisi laporan kegiatan, dan memantau riwayat PKL.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-3xl">
                {item.icon}
              </div>
              <h4 className="mt-5 text-lg font-black text-[#10234b]">
                {item.title}
              </h4>
              <p className="mt-3 text-sm leading-7 text-slate-500">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-5 pb-16">
        <div className="mx-auto max-w-5xl rounded-3xl bg-gradient-to-r from-[#10234b] to-[#087eaa] px-7 py-12 text-center text-white sm:px-12">
          <h3 className="text-2xl font-black sm:text-3xl">
            Mulai Kelola Kegiatan PKL dengan Lebih Mudah
          </h3>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-blue-100">
            STRIDE hadir untuk mendukung pengelolaan Praktik Kerja
            Lapangan yang lebih terorganisasi melalui teknologi digital.
          </p>
          <Link
            href="/"
            className="mt-7 inline-flex rounded-xl bg-white px-6 py-3 font-bold text-[#10234b] transition hover:bg-cyan-50"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white px-5 py-7 text-center">
        <p className="text-sm font-bold text-[#10234b]">
          STRIDE
        </p>
        <p className="mt-2 text-xs text-slate-400">
          © {new Date().getFullYear()} STRIDE — Sistem Informasi Praktik Kerja Lapangan
        </p>
      </footer>
    </main>
  );
}
