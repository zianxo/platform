"use client";

import * as React from "react";
import { Moon, Sun, Monitor, Palette, Check } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";

const themes = [
  {
    name: "Zinc",
    label: "Professional",
    activeColor: "240 5.9% 10%",
    cssVars: {
      light: {
        "--primary": "240 5.9% 10%",
        "--primary-foreground": "0 0% 98%",
        "--ring": "240 5.9% 10%",
      },
      dark: {
        "--primary": "0 0% 98%",
        "--primary-foreground": "240 5.9% 10%",
        "--ring": "0 0% 98%",
      }
    }
  },
  {
    name: "Violet",
    label: "Vibrant",
    activeColor: "262.1 83.3% 57.8%",
     cssVars: {
      light: {
        "--primary": "262.1 83.3% 57.8%",
        "--primary-foreground": "210 40% 98%",
        "--ring": "262.1 83.3% 57.8%",
      },
      dark: {
        "--primary": "263.4 70% 50.4%", // Bright violet
        "--primary-foreground": "210 40% 98%",
        "--ring": "263.4 70% 50.4%",
      }
    }
  },
  {
    name: "Ocean",
    label: "Ocean",
    activeColor: "187 100% 41%", // Cyan-ish
    cssVars: {
      light: {
        "--primary": "187 70% 41%",
        "--primary-foreground": "0 0% 98%",
        "--ring": "187 70% 41%",
      },
      dark: {
        "--primary": "187 80% 45%",
        "--primary-foreground": "0 0% 10%",
        "--ring": "187 80% 45%",
      }
    }
  },
];

export function ThemeCustomizer() {
  const { setTheme, theme } = useTheme();
  const [activeTheme, setActiveTheme] = React.useState("Zinc");

  // Effect to apply CSS variables when activeTheme changes
  React.useEffect(() => {
    const root = document.documentElement;
    const selected = themes.find(t => t.name === activeTheme);
    if (!selected) return;

    // We need to apply based on current mode (light/dark), but simplest is to just set specific vars
    // However, shadcn uses CSS variables that change based on .dark class.
    // To implement "dynamic" primary colors properly in tailwind + css vars without a full page reload or complex CSS generation:
    // We can inject a style tag or set style properties on :root. 
    
    // A robust way: Set specific --primary override variables that take precedence, OR
    // rely on a class-based approach if we had predefined classes. 
    // Given the prompt "Redesign... support for different themes", let's try setting style properties on the body/root.
    
    // BUT: standard shadcn uses values in globals.css.
    // Let's set the '--primary' variable directly on document.documentElement.style
    
    // Note: This simple implementation toggles MAIN brand color.
    // Ideally we would swap entire palettes.
    
    // For this demo, let's assume we are in 'dark' mode mostly as that's the premium feel, 
    // but code below attempts to handle both if we could detect system preference easily here.
    // We'll stick to updating the global '--primary' and '--ring' for now which drives most 'brand' feel.
    
    // Check if dark mode is active to pick correct tuple
    const isDark = document.documentElement.classList.contains("dark");
    const vars = isDark ? selected.cssVars.dark : selected.cssVars.light;
    
    Object.entries(vars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

  }, [activeTheme, theme]); // Re-run if light/dark changes too

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="h-[2.5rem] w-[2.5rem] rounded-full border-2 border-primary/20 bg-background/50 backdrop-blur-sm hover:bg-primary/10 transition-colors">
          <Palette className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 backdrop-blur-xl bg-background/80 border-white/10">
        <DropdownMenuLabel>Appearance</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuSub>
            <DropdownMenuSubTrigger>
                <Monitor className="mr-2 h-4 w-4" />
                <span>Mode</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => setTheme("light")}>
                    <Sun className="mr-2 h-4 w-4" /> Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                    <Moon className="mr-2 h-4 w-4" /> Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                    <Monitor className="mr-2 h-4 w-4" /> System
                </DropdownMenuItem>
            </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />
        <DropdownMenuLabel>Accent Color</DropdownMenuLabel>
        <div className="grid grid-cols-3 gap-2 p-2">
            {themes.map((t) => (
                <button
                    key={t.name}
                    onClick={() => setActiveTheme(t.name)}
                    className={`
                        h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all
                        ${activeTheme === t.name ? 'border-primary ring-2 ring-primary/30 scale-110' : 'border-transparent hover:scale-105'}
                    `}
                    style={{ backgroundColor: `hsl(${t.activeColor})` }}
                >
                    {activeTheme === t.name && <Check className="h-4 w-4 text-white mix-blend-difference" />}
                    <span className="sr-only">{t.label}</span>
                </button>
            ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
