import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="ml-64 min-h-screen">
        {/* Header */}

        <Header />
        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
