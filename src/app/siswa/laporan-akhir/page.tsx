
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import LaporanAkhirClient from "./LaporanAkhirClient";

export const dynamic = "force-dynamic";

export default async function LaporanAkhirPage() {
  const user = await requireRole("student");

  if (!user) {
    redirect("/login");
  }

  return <LaporanAkhirClient />;
}
