import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="bg-surface-soft text-body text-sm py-12 px-6 md:px-12 mt-auto w-full">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div className="font-bold text-lg text-ink">kinloom</div>
          <div className="hidden md:block h-4 w-px bg-border"></div>
          <Link
            to="https://github.com"
            className="hover:text-ink transition-colors"
          >
            GitHub
          </Link>
        </div>
        <div>
          &copy; {new Date().getFullYear()} Kinloom. Local-first family tree.
        </div>
      </div>
    </footer>
  );
}
