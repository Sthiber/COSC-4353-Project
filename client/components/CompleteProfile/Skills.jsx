// components/CompleteProfile/Skills.jsx
// Leo Nguyen – searchable & scrollable skills picker for profile

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Search } from "lucide-react";

export default function SkillsSection({
                                        skills = [],
                                        error,
                                        onToggle,
                                        isOpen,
                                        setIsOpen,
                                        skillOptions = [],
                                      }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return skillOptions;
    return skillOptions.filter((s) => s.toLowerCase().includes(q));
  }, [query, skillOptions]);

  return (
      <section>
        {/* header */}
        <div
            className="flex items-center justify-between cursor-pointer select-none"
            onClick={() => setIsOpen(!isOpen)}
        >
          <h3 className="text-lg font-semibold">Skills</h3>
          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
        {error && <p className="text-red-400 text-sm mt-1">{error}</p>}

        {/* body */}
        {isOpen && (
            <div className="mt-3">
              {/* search bar */}
              <div className="relative mb-3">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search skills…"
                    className="w-full bg-[#222b45] text-white rounded-lg pl-9 pr-3 py-2 outline-none"
                />
                <Search size={16} className="absolute left-2 top-2.5 text-gray-400" />
              </div>

              {/* options list */}
              <div className="bg-[#1b223b] border border-gray-700 rounded-xl p-2 max-h-64 overflow-y-auto">
                {filtered.length === 0 ? (
                    <p className="text-xs text-gray-400 px-2 py-1">No skills match your search.</p>
                ) : (
                    <div className="flex flex-wrap gap-2">
                      {filtered.map((s) => {
                        const selected = skills.includes(s);
                        return (
                            <button
                                type="button"
                                key={s}
                                onClick={() => onToggle(s)}
                                className={`px-2 py-1 rounded-full text-xs whitespace-nowrap transition ${
                                    selected
                                        ? "bg-emerald-600"
                                        : "bg-gray-600 hover:bg-gray-500"
                                }`}
                                title={s}
                            >
                              {s}
                            </button>
                        );
                      })}
                    </div>
                )}
              </div>

              {/* selected preview */}
              {skills.length > 0 && (
                  <p className="text-xs text-gray-400 mt-2">
                    Selected: {skills.join(", ")}
                  </p>
              )}
            </div>
        )}
      </section>
  );
}
