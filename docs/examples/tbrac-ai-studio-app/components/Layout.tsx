import {
  CalendarDays,
  LayoutDashboard,
  Menu,
  Trophy,
  Users,
  X,
} from "lucide-react";
import React from "react";
import { Link, useLocation } from "react-router-dom";

type LayoutProps = {
  children: React.ReactNode;
};

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const location = useLocation();

  const navItems = [
    { label: "Dashboard", path: "/", icon: <LayoutDashboard size={20} /> },
    { label: "Events", path: "/events", icon: <CalendarDays size={20} /> },
    { label: "Bowlers", path: "/bowlers", icon: <Users size={20} /> },
  ];

  const isActive = (path: string) => {
    if (path === "/" && location.pathname !== "/") {
      return false;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar for Desktop */}
      <aside className="hidden w-64 flex-col border-slate-800 border-r bg-slate-900 text-white md:flex">
        <div className="flex items-center space-x-3 p-6">
          <div className="rounded-lg bg-indigo-500 p-2">
            <Trophy className="text-white" size={24} />
          </div>
          <span className="font-bold text-xl tracking-tight">TBrac</span>
        </div>

        <nav className="mt-4 flex-1 space-y-2 px-4">
          {navItems.map((item) => (
            <Link
              className={`flex items-center space-x-3 rounded-lg px-4 py-3 transition-colors ${
                isActive(item.path)
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
              key={item.path}
              to={item.path}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="border-slate-800 border-t p-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500 font-bold text-xs">
              TD
            </div>
            <div>
              <p className="font-medium text-sm">Tournament Dir.</p>
              <p className="text-slate-500 text-xs">Pro Account</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex h-full flex-1 flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="z-20 flex items-center justify-between bg-slate-900 p-4 text-white shadow-md md:hidden">
          <div className="flex items-center space-x-2">
            <Trophy className="text-indigo-400" size={20} />
            <span className="font-bold text-lg">TBrac</span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            type="button"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="absolute top-16 left-0 z-10 w-full border-slate-700 border-b bg-slate-800 shadow-xl md:hidden">
            <nav className="space-y-2 p-4">
              {navItems.map((item) => (
                <Link
                  className={`flex items-center space-x-3 rounded-lg px-4 py-3 ${
                    isActive(item.path)
                      ? "bg-indigo-600 text-white"
                      : "text-slate-300"
                  }`}
                  key={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  to={item.path}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        )}

        <main className="relative flex-1 overflow-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};
