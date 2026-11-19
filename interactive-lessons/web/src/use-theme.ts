import { useEffect, useState } from "react";

/** Dark or light theme, stored in localStorage and applied as data-theme on <html>; shared by every page. */
export function useTheme() {
  const [theme, setTheme] = useState<"dark" | "light">(() => (localStorage.getItem("theme") as "dark" | "light") || "dark");
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);
  return [theme, setTheme] as const;
}
