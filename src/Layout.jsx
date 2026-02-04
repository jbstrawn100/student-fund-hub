import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "./utils";
import { base44 } from "@/api/base44Client";
import {
  GraduationCap,
  FileText,
  Wallet,
  LogOut,
  Menu,
  X,
  ChevronDown,
  User as UserIcon,
  Home,
  Building2,
  Bell,
  PlusCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import NotificationBell from "@/components/notifications/NotificationBell";
import { AuthProvider, useAuth } from "@/components/AuthContext";

function LayoutContent({ children, currentPageName }) {
  const { user, organization, loading, isSuperAdmin, isStaff } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    base44.auth.logout();
  };

  const navItems = [
    { name: "Home", icon: Home, page: "Home" },
    { name: "Organizations", icon: Building2, page: "SuperAdminDashboard" },
    { name: "Funds", icon: Wallet, page: "Apply" },
    { name: "My Requests", icon: FileText, page: "MyRequests" },
    { name: "Notifications", icon: Bell, page: "Notifications" },
    { name: "Profile", icon: UserIcon, page: "Profile" },
    { name: "Account", icon: UserIcon, page: "Account" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-indigo-200 rounded-full"></div>
          <div className="h-4 w-32 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2">
              {organization?.logo_url ? (
                <img src={organization.logo_url} alt={organization.org_name} className="w-8 h-8 rounded-lg object-cover" />
              ) : (
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
              )}
              <span className="font-semibold text-slate-800">
                {organization?.org_name || "Student Funds"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user && <NotificationBell user={user} />}
            <UserDropdown user={user} handleLogout={handleLogout} />
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-white/80 backdrop-blur-xl border-r border-slate-200/50 z-50 transform transition-transform duration-300 ease-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              {organization?.logo_url ? (
                <img src={organization.logo_url} alt={organization.org_name} className="w-10 h-10 rounded-xl object-cover shadow-lg" />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
              )}
              <div>
                <h1 className="font-bold text-slate-800 text-lg">
                  {organization?.org_name || "Student Funds"}
                </h1>
                <p className="text-xs text-slate-500">
                  {user?.full_name}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-400 group-hover:text-indigo-600"}`} />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-slate-100 space-y-3">
            {user && (
              <div className="hidden lg:flex justify-end">
                <NotificationBell user={user} />
              </div>
              )}
              <div className="hidden lg:block">
              <UserDropdown user={user} handleLogout={handleLogout} fullWidth />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-72 min-h-screen pt-16 lg:pt-0">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

function UserDropdown({ user, handleLogout, fullWidth }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={`${fullWidth ? "w-full justify-start" : ""} h-auto p-2 hover:bg-slate-100 rounded-xl`}
        >
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border-2 border-indigo-100">
              <AvatarFallback className="bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-700 font-semibold text-sm">
                {user?.full_name?.split(" ").map(n => n[0]).join("").toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            {fullWidth && (
              <div className="flex-1 text-left">
                <p className="font-medium text-slate-800 text-sm">{user?.full_name || "User"}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>
            )}
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-3 py-2">
          <p className="font-medium text-sm">{user?.full_name}</p>
          <p className="text-xs text-slate-500">{user?.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function Layout({ children, currentPageName }) {
  return (
    <AuthProvider>
      <LayoutContent children={children} currentPageName={currentPageName} />
    </AuthProvider>
  );
}