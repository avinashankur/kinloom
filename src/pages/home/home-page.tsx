import { Link } from "react-router-dom";
import { TreePine, ArrowRight, Users, GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";

export function HomePage() {
  return (
    <div className="min-h-screen bg-[#fffaf0] flex flex-col">
      {/* Subtle background pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #d6cfc4 1px, transparent 0)`,
          backgroundSize: "32px 32px",
        }}
      />

      {/* Main content */}
      <main className="relative flex-1 flex flex-col items-center justify-center px-4 py-16">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-teal-200 bg-teal-50 mb-8">
          <TreePine size={13} className="text-teal-700" />
          <span className="text-xs font-semibold text-teal-700 tracking-wide uppercase">
            Family Tree
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl font-bold text-slate-900 text-center leading-tight mb-4 max-w-xl tracking-tight">
          Your family,{" "}
          <span className="text-teal-700">beautifully</span> connected
        </h1>

        <p className="text-lg text-slate-500 text-center max-w-md mb-12 leading-relaxed">
          Explore relationships, trace generations, and keep your family history
          alive — all from your browser.
        </p>

        {/* Tree card */}
        <div
          className={cn(
            "w-full max-w-sm bg-white rounded-2xl border border-slate-200",
            "shadow-xl shadow-slate-200/60 p-6",
            "hover:shadow-2xl hover:shadow-slate-200/80 transition-shadow duration-300",
          )}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-teal-700 flex items-center justify-center">
              <TreePine size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Avinash&apos;s Family Tree
              </h2>
              <p className="text-xs text-slate-400">13 members · 4 generations</p>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-5 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <Users size={12} />
              <span>13 people</span>
            </div>
            <div className="flex items-center gap-1.5">
              <GitBranch size={12} />
              <span>5 partnerships</span>
            </div>
          </div>

          <Link
            id="view-family-tree-btn"
            to="/tree"
            className={cn(
              "flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl",
              "bg-teal-700 text-white text-sm font-semibold",
              "hover:bg-teal-800 transition-all duration-150",
              "active:scale-[0.98] group",
            )}
          >
            View Family Tree
            <ArrowRight
              size={15}
              className="transition-transform duration-150 group-hover:translate-x-0.5"
            />
          </Link>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-10 max-w-md">
          {[
            "Add & edit members",
            "Interactive canvas",
            "Search & filter",
            "Export JSON",
            "Local-first storage",
          ].map((f) => (
            <span
              key={f}
              className="px-3 py-1 rounded-full bg-white border border-slate-200 text-xs text-slate-500 font-medium shadow-sm"
            >
              {f}
            </span>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative text-center py-5 text-xs text-slate-400">
        Stored locally in your browser · No account required
      </footer>
    </div>
  );
}
