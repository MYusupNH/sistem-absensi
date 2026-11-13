
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import TambahSekolahForm from "./TambahSekolahForm";

export default async function TambahSekolahPage() {
  const user = await requireRole("admin");

  if (!user) redirect("/login");

  return <TambahSekolahForm />;
}
