import { useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import type { Person } from "@/entities/person/model/person";
import { useTreeUIStore } from "@/stores/tree-ui-store";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface SearchCommandProps {
  people: Person[];
}

export function SearchCommand({ people }: SearchCommandProps) {
  const { searchOpen, closeSearch, setActivePerson } = useTreeUIStore();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [searchOpen]);

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        if (searchOpen) closeSearch();
        else useTreeUIStore.getState().openSearch();
      }
      if (e.key === "Escape" && searchOpen) closeSearch();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [searchOpen, closeSearch]);

  if (!searchOpen) return null;

  const filtered =
    query.trim().length === 0
      ? people.slice(0, 8)
      : people.filter((p) => {
          const q = query.toLowerCase();
          return (
            p.firstName.toLowerCase().includes(q) ||
            (p.lastName?.toLowerCase().includes(q) ?? false) ||
            (p.nickname?.toLowerCase().includes(q) ?? false) ||
            `${p.firstName} ${p.lastName ?? ""}`.toLowerCase().includes(q)
          );
        });

  const select = (personId: string) => {
    setActivePerson(personId);
    closeSearch();
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
        onClick={closeSearch}
      />
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
        <div
          className={cn(
            "bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200",
            "animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200",
            "overflow-hidden",
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
            <Search size={16} className="text-slate-400 shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search family members…"
              className="flex-1 text-sm text-slate-900 placeholder-slate-400 bg-transparent outline-none"
            />
            {query && (
              <button onClick={() => setQuery("")} className="text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            )}
            <kbd className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-mono">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-[320px] overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-400">
                No results for &ldquo;{query}&rdquo;
              </div>
            ) : (
              <ul className="p-2">
                {filtered.map((person) => {
                  const displayName = [person.firstName, person.lastName]
                    .filter(Boolean)
                    .join(" ");
                  return (
                    <li key={person.id}>
                      <button
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left",
                          "hover:bg-slate-50 transition-colors duration-100",
                        )}
                        onClick={() => select(person.id)}
                      >
                        <div
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold",
                            person.gender === "male"
                              ? "bg-sky-100 text-sky-700"
                              : "bg-rose-100 text-rose-700",
                          )}
                        >
                          {displayName.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-900">
                            {displayName}
                            {person.deathDate && (
                              <span className="ml-1 text-slate-400">†</span>
                            )}
                          </div>
                          {person.birthDate && (
                            <div className="text-xs text-slate-400">
                              b. {person.birthDate.split("-")[0]}
                            </div>
                          )}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="px-4 py-2.5 border-t border-slate-100 text-xs text-slate-400">
            {filtered.length} of {people.length} people
          </div>
        </div>
      </div>
    </>
  );
}
