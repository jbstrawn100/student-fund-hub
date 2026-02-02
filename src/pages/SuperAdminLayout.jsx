import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Building2, GraduationCap } from "lucide-react";

export default function SuperAdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      {/* Simple Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to={createPageUrl("SuperAdminDashboard")} className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-800 text-lg">Student Funds Platform</h1>
              <p className="text-xs text-slate-500">Super Admin Dashboard</p>
            </div>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 md:p-8">
        {children}
      </main>
    </div>
  );
}