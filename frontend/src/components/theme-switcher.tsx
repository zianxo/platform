"use client";

import { useEffect, useState, useCallback } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Palette, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useSidebar, SidebarContext } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useContext } from "react";

const THEMES = [
  { name: "Amethyst Haze", value: "theme-amethyst" }, // default
  { name: "Bubblegum", value: "theme-bubblegum" },
  { name: "Claude", value: "theme-claude" },
  { name: "Mono", value: "theme-mono" },
  { name: "Neo-Brutalism", value: "theme-neobrutalism" },
  { name: "Notebook", value: "theme-notebook" },
  { name: "Perpetuity", value: "theme-perpetuity" },
  { name: "Retro Arcade", value: "theme-retroarcade" },
];

export function ThemeSwitcher() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [baseTheme, setBaseThemeState] = useState("theme-amethyst");
  
  // Safe usage of sidebar context
  const sidebarContext = useContext(SidebarContext);
  const state = sidebarContext ? sidebarContext.state : "expanded";

  const applyBaseTheme = useCallback((value: string) => {
    const root = document.documentElement;
    THEMES.forEach((t) => root.classList.remove(t.value));
    if (value && value !== "theme-amethyst") {
      root.classList.add(value);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("base-theme") || "theme-amethyst";
    setBaseThemeState(savedTheme);
    applyBaseTheme(savedTheme);
  }, [applyBaseTheme]);

  if (!mounted) return null;

  const currentMode = resolvedTheme === "dark" ? "dark" : "light";

  const handleSetBaseTheme = (value: string) => {
    setBaseThemeState(value);
    localStorage.setItem("base-theme", value);
    applyBaseTheme(value);
  };

  const toggleMode = () => {
    setTheme(currentMode === "dark" ? "light" : "dark");
  };

  if (state === "collapsed") {
    return (
      <div className="flex flex-col items-center gap-2 p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md hover:bg-sidebar-accent">
              <Palette className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="end" className="w-56 glass">
            <DropdownMenuLabel>Choose Theme</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {THEMES.map((t) => (
              <DropdownMenuItem
                key={t.value}
                onClick={() => handleSetBaseTheme(t.value)}
                className="justify-between cursor-pointer"
              >
                {t.name}
                {baseTheme === t.value && <Check className="h-4 w-4" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMode}
          className="h-8 w-8 rounded-md hover:bg-sidebar-accent"
        >
          {currentMode === "dark" ? (
            <Moon className="h-4 w-4 text-primary" />
          ) : (
            <Sun className="h-4 w-4 text-primary" />
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 w-full p-1 bg-sidebar-accent/30 rounded-lg">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="flex-1 justify-start gap-2 h-8 px-2 hover:bg-sidebar-accent border-none shadow-none">
            <Palette className="h-4 w-4 shrink-0" />
            <span className="truncate text-xs font-medium">
                {THEMES.find(t => t.value === baseTheme)?.name || "Theme"}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" className="w-56 glass">
          <DropdownMenuLabel>Choose Theme</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {THEMES.map((t) => (
            <DropdownMenuItem
              key={t.value}
              onClick={() => handleSetBaseTheme(t.value)}
              className="justify-between cursor-pointer"
            >
              {t.name}
              {baseTheme === t.value && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="w-px h-4 bg-sidebar-border mx-1" />

      <Button
        variant="ghost"
        size="icon"
        onClick={toggleMode}
        className="h-8 w-8 rounded-md shrink-0 hover:bg-sidebar-accent"
      >
        {currentMode === "dark" ? (
          <Moon className="h-4 w-4 text-primary" />
        ) : (
          <Sun className="h-4 w-4 text-primary" />
        )}
      </Button>
    </div>
  );
}
