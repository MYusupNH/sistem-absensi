
"use client";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-xl bg-[#0F2A5F] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-800"
    >
      🖨️ Cetak Rekap
    </button>
  );
}
