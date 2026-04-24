export default function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)]">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 text-sm text-[var(--color-muted-foreground)] md:flex-row">
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="inline-block h-5 w-5 rounded-md bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)]"
          />
          <span>
            © {new Date().getFullYear()} ComfyMart. Built by Comfybear.
          </span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#how" className="hover:text-[var(--color-foreground)]">
            How it works
          </a>
          <a href="#features" className="hover:text-[var(--color-foreground)]">
            Features
          </a>
          <a href="#waitlist" className="hover:text-[var(--color-foreground)]">
            Waitlist
          </a>
        </div>
      </div>
    </footer>
  );
}
