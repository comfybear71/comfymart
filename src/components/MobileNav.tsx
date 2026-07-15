"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const links = [
  { href: "#how", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#faq", label: "FAQ" },
  { href: "#waitlist", label: "Waitlist" },
];

type MobileNavProps = {
  isAuthed: boolean;
};

export default function MobileNav({ isAuthed }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[var(--color-foreground)] transition hover:bg-[var(--color-muted)]"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {open && (
        <div
          id="mobile-nav-panel"
          className="animate-fade-rise absolute inset-x-0 top-full border-b border-[var(--color-border)] bg-[var(--color-background)] shadow-lg"
        >
          <nav className="flex flex-col gap-1 px-6 py-4">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--color-muted-foreground)] transition hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
              >
                {l.label}
              </a>
            ))}
            <div className="mt-2 border-t border-[var(--color-border)] pt-3">
              {isAuthed ? (
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="block rounded-full bg-[var(--color-foreground)] px-4 py-2.5 text-center text-sm font-medium text-[var(--color-background)]"
                >
                  Dashboard →
                </Link>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-center text-sm font-medium text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                  >
                    Sign in
                  </Link>
                  <a
                    href="#waitlist"
                    onClick={() => setOpen(false)}
                    className="rounded-full bg-[var(--color-foreground)] px-4 py-2.5 text-center text-sm font-medium text-[var(--color-background)]"
                  >
                    Join waitlist
                  </a>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
