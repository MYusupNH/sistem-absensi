
import AdminSidebar from "@/components/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AdminSidebar />
      <div className="min-h-screen md:pl-[270px]">
        {children}
      </div>
    </>
  );
}
