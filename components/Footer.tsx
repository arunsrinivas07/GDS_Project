"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith("/learn")) {
    return null;
  }

  const handleHomeClick = (e: React.MouseEvent) => {
    if (pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const columns = [
    {
      title: "Products",
      links: [
        { label: "Course Pricing", href: "#pricing" },
        { label: "Study Material", href: "#tabs" },
        { label: "Mock Tests", href: "#tabs" },
        { label: "Progress Tracker", href: "#tabs" },
        { label: "Certification", href: "#tabs" },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "GDS Syllabus", href: "#features" },
        { label: "Exam Pattern", href: "#features" },
        { label: "Previous Papers", href: "#features" },
        { label: "Study Tips", href: "#process" },
        { label: "FAQ", href: "#faq" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About Us", href: "#process" },
        { label: "Contact", href: "#faq" },
        { label: "Privacy Policy", href: "#" },
        { label: "Terms of Service", href: "#" },
        { label: "Refund Policy", href: "#faq" },
      ],
    },
  ];

  return (
    <footer className="bg-[#0F1629] text-gray-400 mt-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main footer content */}
        <div className="py-14 sm:py-18 grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8">
          {/* Brand column */}
          <div className="md:col-span-5">
            <Link
              href="/"
              onClick={handleHomeClick}
              className="inline-flex items-center gap-3 mb-5 group cursor-pointer"
            >
              <img
                src="/logo.png?v=2"
                alt="DOP Study Academi Logo"
                className="w-12 h-12 sm:w-14 sm:h-14 object-contain bg-white rounded-xl p-1 group-hover:scale-105 transition-transform shrink-0"
              />
              <div className="leading-tight">
                <span className="font-extrabold text-white text-base sm:text-lg tracking-tight block group-hover:text-red-400 transition-colors font-heading">
                  DOP STUDY
                </span>
                <span className="block text-[10px] sm:text-[11px] text-red-400 font-bold tracking-[0.22em] uppercase">
                  ACADEMI
                </span>
              </div>
            </Link>
            <h3 className="font-heading text-2xl sm:text-3xl font-extrabold text-white leading-tight mb-4 max-w-xs">
              Master your government career.
            </h3>
            <p className="text-sm leading-relaxed text-gray-500 max-w-sm">
              India&apos;s most comprehensive GDS exam preparation platform. Study smart, practice hard, get selected.
            </p>
          </div>

          {/* Link columns */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {columns.map(({ title, links }) => (
              <div key={title}>
                <h4 className="text-white font-semibold text-sm mb-4 font-heading">{title}</h4>
                <ul className="space-y-2.5 text-sm">
                  {links.map(({ label, href }) => (
                    <li key={label}>
                      <Link
                        href={href}
                        className="hover:text-white transition-colors"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} DOP Study Academi. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="#" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">Privacy</Link>
            <Link href="#" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">Terms</Link>
            <Link href="#" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
