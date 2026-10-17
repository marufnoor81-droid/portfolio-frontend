import { createContext, useContext, useEffect, useMemo, useState } from "react";

type Theme = "light" | "dark";
const ThemeContext = createContext<{ theme: Theme; toggleTheme: () => void } | null>(null);

function initialTheme(): Theme {
    const saved = localStorage.getItem("devfolio-theme");
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>(initialTheme);
    useEffect(() => {
        document.documentElement.dataset.theme = theme;
        localStorage.setItem("devfolio-theme", theme);
    }, [theme]);
    const value = useMemo(() => ({
        theme,
        toggleTheme: () => setTheme((current) => current === "light" ? "dark" : "light"),
    }), [theme]);
    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    const value = useContext(ThemeContext);
    if (!value) throw new Error("useTheme must be used inside ThemeProvider.");
    return value;
}
