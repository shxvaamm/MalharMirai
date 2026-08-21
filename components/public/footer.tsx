"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Mail, MapPin, Instagram } from "lucide-react";

export function PublicFooter() {
  const footerRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    const updateFooterHeight = () => {
      if (footerRef.current) {
        const height = footerRef.current.offsetHeight;
        document.documentElement.style.setProperty("--footer-height", `${height}px`);
      }
    };

    updateFooterHeight();

    const resizeObserver = new ResizeObserver(() => {
      updateFooterHeight();
    });

    if (footerRef.current) {
      resizeObserver.observe(footerRef.current);
    }

    window.addEventListener("resize", updateFooterHeight);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateFooterHeight);
    };
  }, []);

  return (
    <footer
      ref={footerRef}
      className="fixed bottom-0 left-0 right-0 z-40 w-full border-t border-white/[0.06] bg-black/90 backdrop-blur-xl text-neutral-400 transition-all duration-300"
    >
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 pb-8 sm:pb-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-10 mb-8">
          {/* Brand & About */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="relative h-9 w-9 rounded-full overflow-hidden border border-white/10 shadow-sm bg-neutral-900 shrink-0 select-none">
                <Image
                  src="/images/malhar-logo.png"
                  alt="MALHAR Society Logo"
                  fill
                  unoptimized
                  draggable={false}
                  className="object-cover brightness-105 pointer-events-none select-none"
                />
              </div>
              <div className="flex flex-col select-none">
                <div className="relative h-4.5 w-24 mb-0.5 select-none">
                  <Image
                    src="/images/malhar-wordmark.png"
                    alt="MALHAR"
                    fill
                    unoptimized
                    draggable={false}
                    className="object-contain object-left brightness-110 pointer-events-none select-none"
                  />
                </div>
                <span className="text-[10px] font-medium text-neutral-400">
                  The Cultural Society of Mirai
                </span>
              </div>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed max-w-md">
              Malhar is the cultural society of Mirai School of Technology, started by the 2025–29 batch. From dance and singing to management and tech, we give students the stage to build skills and showcase their talent.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-semibold text-neutral-200 uppercase tracking-wider mb-3 border-l-2 border-neutral-500 pl-2.5">
              Explore Malhar
            </h4>
            <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
              <li>
                <Link href="/" className="hover:text-neutral-200 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-neutral-200 transition-colors">
                  About Society
                </Link>
              </li>
              <li>
                <Link href="/members" className="hover:text-neutral-200 transition-colors">
                  Members
                </Link>
              </li>
              <li>
                <Link href="/leadership" className="hover:text-neutral-200 transition-colors">
                  Core Committee
                </Link>
              </li>
              <li>
                <Link href="/events" className="hover:text-neutral-200 transition-colors">
                  Events & Fests
                </Link>
              </li>
              <li>
                <Link href="/gallery" className="hover:text-neutral-200 transition-colors">
                  Gallery
                </Link>
              </li>
              <li>
                <Link href="/announcements" className="hover:text-neutral-200 transition-colors">
                  Announcements
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-neutral-200 transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Institutional Contact */}
          <div>
            <h4 className="text-xs font-semibold text-neutral-200 uppercase tracking-wider mb-3 border-l-2 border-neutral-500 pl-2.5">
              Society Office
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-start gap-2">
                <MapPin className="h-3.5 w-3.5 text-neutral-400 mt-0.5 shrink-0" />
                <span>Mirai School of Technology Delhi Campus</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                <a href="mailto:malharmirai01@gmail.com" className="hover:text-neutral-200 font-medium transition-colors">
                  malharmirai01@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Instagram className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                <a
                  href="https://www.instagram.com/malhar_mirai.hiet/"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-neutral-200 font-medium transition-colors"
                >
                  @malhar_mirai.hiet
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright bar */}
        <div className="pt-4 border-t border-white/[0.06] text-center text-[11px] text-neutral-500">
          <p>© {new Date().getFullYear()} MALHAR – The Cultural Society of Mirai. Started by the 2025–29 batch.</p>
        </div>
      </div>
    </footer>
  );
}
