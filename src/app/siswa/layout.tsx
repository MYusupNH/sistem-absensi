
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import StudentSidebar from "@/components/StudentSidebar";

export const dynamic = "force-dynamic";

export default async function SiswaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session || session.role !== "student") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[#f4f7fb]">
      <StudentSidebar
        fullName={session.fullName}
        email={session.email}
      />

      <main className="min-h-screen pt-[68px] lg:ml-[270px] lg:pt-0">
        {children}
      </main>
    </div>
  );
}
