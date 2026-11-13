
"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export default function RefreshStatus() {
  const router = useRouter();
  const [loading, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => startTransition(() => router.refresh())}
      disabled={loading}
      className="inline-flex items-center justify-center rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-bold text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? "Memperbarui..." : "↻ Perbarui Status"}
    </button>
  );
}
