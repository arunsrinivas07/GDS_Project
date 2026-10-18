"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, User } from "lucide-react";
import { useAuth } from "@/lib/authContext";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Hide the global website navbar on the learning / video player page
  if (pathname?.startsWith("/learn")) {
    return null;
  }

  const handleScrollTo = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setOpen(false);
    if (id === "top") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const navLinks = [
    { href: "#top", label: "Home", onClick: (e: React.MouseEvent) => handleScrollTo(e, "top") },
    { href: "#process", label: "How It Works", onClick: (e: React.MouseEvent) => handleScrollTo(e, "process") },
    { href: "#features", label: "Features", onClick: (e: React.MouseEvent) => handleScrollTo(e, "features") },
    { href: "#pricing", label: "Pricing", onClick: (e: React.MouseEvent) => handleScrollTo(e, "pricing") },
    { href: "#faq", label: "FAQ", onClick: (e: React.MouseEvent) => handleScrollTo(e, "faq") },
  ];

  return (
    <div className="fixed top-0 left-0 right-0 z-50 px-3 sm:px-6 pt-3">
      <nav
        className={`max-w-7xl mx-auto rounded-2xl transition-all duration-300 ${scrolled
          ? "nav-floating shadow-lg"
          : "bg-white/70 backdrop-blur-md border border-white/50 shadow-sm"
          }`}
      >
        <div className="px-4 sm:px-8">
          <div className="flex items-center justify-between h-[76px]">
            {/* Logo */}
            <Link
              href="/"
              onClick={(e) => handleScrollTo(e, "top")}
              className="flex items-center gap-3 group cursor-pointer focus:outline-none"
              aria-label="DOP Study Academi Home"
            >
              <img
                src="/logo.png"
                alt="DOP Study Academi Logo"
                className="w-12 h-12 sm:w-16 sm:h-16 object-contain group-hover:scale-105 transition-transform shrink-0"
              />
              <div className="leading-tight">
                <span className="font-extrabold text-charcoal text-base sm:text-lg tracking-tight block group-hover:text-brand-red transition-colors font-heading">
                  DOP STUDY
                </span>
                <span className="block text-[10px] sm:text-[11px] text-brand-red font-bold tracking-[0.22em] uppercase">
                  ACADEMI
                </span>
              </div>
            </Link>

            {/* Desktop nav — hidden when user is signed in */}
            <div className="hidden md:flex items-center gap-1">
              {!user && navLinks.map(({ href, label, onClick }) => (
                <a
                  key={label}
                  href={href}
                  onClick={onClick}
                  className="text-sm font-medium px-4 py-2 rounded-xl text-gray-600 hover:text-charcoal hover:bg-gray-100/60 transition-colors cursor-pointer"
                >
                  {label}
                </a>
              ))}
            </div>

            {/* Desktop CTAs */}
            <div className="hidden md:flex items-center gap-2.5">
              {user ? (
                <Link
                  href="/learn/gds-chapter-1-introduction"
                  className="bg-brand-red text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-brand-red-dark transition-colors shadow-sm hover:shadow flex items-center gap-2 cursor-pointer"
                >
                  <User size={16} />
                  <span>My Lessons</span>
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-sm font-semibold px-4 py-2.5 rounded-xl text-charcoal hover:text-brand-red hover:bg-gray-100/70 transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    href="/enroll"
                    className="bg-brand-red text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-brand-red-dark transition-colors shadow-sm hover:shadow cursor-pointer"
                  >
                    Enroll Now
                  </Link>
                </>
              )}
            </div>

            {/* Mobile toggle */}
            <button
              className="md:hidden p-2 text-gray-600 hover:text-charcoal cursor-pointer rounded-xl hover:bg-gray-100/60 transition-colors"
              onClick={() => setOpen(!open)}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {/* Mobile menu */}
          {open && (
            <div className="md:hidden border-t border-gray-100/60 py-4 space-y-1 animate-scale-in">
              {/* Only show marketing links when not signed in */}
              {!user && navLinks.map(({ href, label, onClick }) => (
                <a
                  key={label}
                  href={href}
                  className="block text-sm font-medium py-2.5 px-3 rounded-xl text-gray-600 hover:text-charcoal hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={onClick}
                >
                  {label}
                </a>
              ))}
              <div className="pt-3 space-y-2 border-t border-gray-100/60 mt-2">
                {user ? (
                  <Link
                    href="/learn/gds-chapter-1-introduction"
                    className="block bg-brand-red text-white text-sm font-semibold px-5 py-3 rounded-xl text-center cursor-pointer hover:bg-brand-red-dark transition-colors"
                    onClick={() => setOpen(false)}
                  >
                    My Lessons
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="block text-sm font-semibold py-2.5 px-3 rounded-xl text-center text-charcoal hover:bg-gray-50 hover:text-brand-red transition-colors"
                      onClick={() => setOpen(false)}
                    >
                      Login
                    </Link>
                    <Link
                      href="/enroll"
                      className="block bg-brand-red text-white text-sm font-semibold px-5 py-3 rounded-xl text-center cursor-pointer hover:bg-brand-red-dark transition-colors"
                      onClick={() => setOpen(false)}
                    >
                      Enroll Now
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>
    </div>
  );
}
