import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { hydrateString, loadString, saveString } from "../lib/persist";

const STORAGE_KEY = "theme";

const ThemeContext = createContext({
  theme: "dark",
  setTheme: () => {},
  toggleTheme: () => {},
});

function loadTheme() {
  const stored = loadString(STORAGE_KEY, "dark");
  return stored === "light" || stored === "dark" ? stored : "dark";
}

function applyTheme(theme) {
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  root.style.colorScheme = theme;

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", theme === "light" ? "#f5f5f5" : "#0f0f0f");
  }
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    const initial = loadTheme();
    applyTheme(initial);
    return initial;
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    hydrateString(STORAGE_KEY, "dark").then((stored) => {
      if (cancelled) return;
      if (stored === "light" || stored === "dark") {
        applyTheme(stored);
        setThemeState(stored);
      }
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    applyTheme(theme);
    saveString(STORAGE_KEY, theme);
  }, [theme, ready]);

  const value = useMemo(
    () => ({
      theme,
      setTheme: (next) => {
        if (next === "light" || next === "dark") {
          applyTheme(next);
          setThemeState(next);
        }
      },
      toggleTheme: () =>
        setThemeState((t) => {
          const next = t === "dark" ? "light" : "dark";
          applyTheme(next);
          return next;
        }),
    }),
    [theme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

/** Chart/SVG colors that follow the active theme. */
export function useChartColors() {
  const { theme } = useTheme();
  return useMemo(() => {
    const styles = getComputedStyle(document.documentElement);
    const rgb = (name) => {
      const v = styles.getPropertyValue(name).trim();
      return v ? `rgb(${v})` : undefined;
    };
    return {
      line: rgb("--color-line"),
      ink2: rgb("--color-ink-2"),
      bg2: rgb("--color-bg-2"),
      accent: rgb("--color-accent"),
      theme,
    };
  }, [theme]);
}
