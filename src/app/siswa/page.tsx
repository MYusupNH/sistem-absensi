
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import StudentDashboardClient from "./StudentDashboardClient";

export const dynamic = "force-dynamic";

export default async function StudentPage() {
  const user = await requireRole("student");

  if (!user) {
    redirect("/login");
  }

  return (
    <StudentDashboardClient
      fullName={user.fullName}
      email={user.email}
    />
  );
}
