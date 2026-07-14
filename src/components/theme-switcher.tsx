"use client";

import { useEffect, useState } from "react";

export type ThemeId = "white" | "blue" | "dark" | "light" | "pink" | "red";

const THEMES: { id: ThemeId; label: string; swatch: string[] }[] = [
  { id: "white", label: "White", swatch: ["#FFFFFF", "#2563EB", "#F59E0B"] },
  { id: "blue", label: "Ocean", swatch: ["#0B1A2E", "#FF7A1A", "#2563EB"] },
  { id: "dark", label: "Onyx", swatch: ["#090C0A", "#1A332A", "#C9A84C"] },
  { id: "light", label: "Ivory", swatch: ["#FAF7EF", "#FFFFFF", "#B8941F"] },
  { id: "pink", label: "Blush", swatch: ["#FDF4F1", "#D4869A", "#C9A84C"] },
  { id: "red", label: "Oxblood", swatch: ["#1F0606", "#8B2635", "#D4AF37"] },
];

const STORAGE_KEY = "planned-theme";

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    if (typeof window === "undefined") return "white";
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeId | null;
    return saved && THEMES.some((t) => t.id === saved) ? saved : "white";
  });

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem(STORAGE_KEY, theme);
    }
  }, [theme]);

  const setTheme = (id: ThemeId) => setThemeState(id);
  return { theme, setTheme };
}

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="btn-ghost p-2 rounded flex items-center gap-2" aria-label="Choose theme">
        <div className="flex -space-x-1">
          {THEMES.find((t) => t.id === theme)?.swatch.map((c, i) => (
            <span key={i} className="h-3 w-3 rounded-full border border-[rgba(201,168,76,0.4)]" style={{ background: c }} />
          ))}
        </div>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-40 surface-wood-strong rounded-lg p-3 min-w-[180px] shadow-2xl">
            <div className="micro-label-gold mb-2 px-2">Theme</div>
            <div className="divider-gold mb-2" />
            {THEMES.map((t) => (
              <button key={t.id} onClick={() => { setTheme(t.id); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-2 py-2 rounded text-left transition-colors ${theme === t.id ? "bg-[color-mix(in_srgb,var(--primary)_8%,transparent)]" : "hover:bg-[color-mix(in_srgb,var(--primary)_4%,transparent)]"}`}>
                <div className="flex -space-x-1">
                  {t.swatch.map((c, i) => (<span key={i} className="h-4 w-4 rounded-full border" style={{ background: c, borderColor: "var(--hairline-strong)" }} />))}
                </div>
                <span className="text-xs tracking-wider flex-1" style={{ color: theme === t.id ? "var(--chart-5)" : "var(--text-soft)" }}>{t.label}</span>
                {theme === t.id && <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--primary)" }} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
