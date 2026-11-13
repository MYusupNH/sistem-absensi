import type { ReactNode } from "react";
import SchoolSidebar from "@/components/SchoolSidebar";

export default function SchoolLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <SchoolSidebar />
      <main className="min-h-screen bg-[#f4f7fc] pb-24 md:pl-[270px] md:pb-0">
        {children}
      </main>
    </>
  );
}