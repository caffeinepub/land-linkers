import { Button } from "@/components/ui/button";
import { Link, useLocation } from "@tanstack/react-router";
import { LogOut, MapPin, Menu, Shield, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

type NavLink = { label: string; to: string };

function getNavLinks(userType: "agent" | "owner" | "admin" | null): NavLink[] {
  if (userType === "agent") {
    return [
      { label: "Home", to: "/" },
      { label: "Dashboard", to: "/agent" },
    ];
  }
  if (userType === "owner") {
    return [
      { label: "Home", to: "/" },
      { label: "Owner", to: "/owner" },
    ];
  }
  if (userType === "admin") {
    return [{ label: "Dashboard", to: "/admin-portal" }];
  }
  return [
    { label: "Home", to: "/" },
    { label: "Agent", to: "/agent" },
    { label: "Owner", to: "/owner" },
  ];
}

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { userType, onLogout } = useAuth();

  const navLinks = getNavLinks(userType);

  const renderNavLink = (link: NavLink, onClick?: () => void) => (
    <Link
      key={link.label}
      to={link.to}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
        location.pathname === link.to
          ? "text-white bg-white/10"
          : "text-white/80 hover:text-white hover:bg-white/10"
      }`}
      onClick={onClick}
      data-ocid={`nav.${link.label.toLowerCase().replace(/\s/g, "_")}.link`}
    >
      {link.label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 bg-navy shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to={userType === "admin" ? "/admin-portal" : "/"}
            data-ocid="header.link"
            className="flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              {userType === "admin" ? (
                <Shield className="w-5 h-5 text-white" />
              ) : (
                <MapPin className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <div className="font-serif font-bold text-white text-lg leading-tight">
                {userType === "admin" ? "Admin Panel" : "Land Linkers"}
              </div>
              <div className="text-white/60 text-xs tracking-widest uppercase">
                {userType === "admin" ? "Land Linkers" : "The Land Hub"}
              </div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => renderNavLink(link))}
            {userType && (
              <Button
                variant="outline"
                size="sm"
                onClick={onLogout}
                className="ml-2 text-white border-white/30 hover:bg-white/10 hover:text-white bg-transparent gap-1.5"
                data-ocid="header.logout.button"
              >
                <LogOut className="w-3.5 h-3.5" />
                Logout
              </Button>
            )}
          </nav>

          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden text-white p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            data-ocid="header.mobile_menu.button"
          >
            {mobileOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden bg-navy border-t border-white/10 overflow-hidden"
          >
            <div className="px-4 py-4 flex flex-col gap-2">
              {navLinks.map((link) =>
                renderNavLink(link, () => setMobileOpen(false)),
              )}
              {userType && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    onLogout();
                  }}
                  className="flex items-center gap-2 text-white/80 hover:text-white py-2 px-3 rounded-md hover:bg-white/10 transition-colors text-sm font-medium"
                  data-ocid="header.logout.button"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
