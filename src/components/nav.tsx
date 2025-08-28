
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
    LayoutDashboard, 
    BrainCircuit, 
    Code, 
    Folder, 
    Settings as SettingsIcon,
    Table
} from "lucide-react"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";


const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/editor", label: "Table Editor", icon: Table },
    { href: "/query", label: "AI SQL Translator", icon: BrainCircuit },
    { href: "/api", label: "API Generation", icon: Code },
    { href: "/storage", label: "Storage", icon: Folder },
    { href: "/settings", label: "Settings", icon: SettingsIcon },
]

export function Nav({ projectId }: { projectId?: string | null }) {
    const pathname = usePathname()
    
    return (
        <TooltipProvider>
            {navItems.map((item) => {
                const isProjectSpecific = ["/editor", "/api", "/storage", "settings", "/query"].includes(item.href);
                const isDisabled = isProjectSpecific && !projectId;
                let finalHref = item.href;

                // Dashboard link should clear the project selection
                if (item.href !== '/dashboard' && isProjectSpecific && projectId) {
                    finalHref = `${item.href}`;
                }

                return (
                    <Tooltip key={item.href}>
                        <TooltipTrigger asChild>
                             <Link
                                href={finalHref}
                                className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors md:h-8 md:w-8 ${
                                    isDisabled ? "cursor-not-allowed text-muted-foreground/50" :
                                    pathname.startsWith(item.href) // Use startsWith for editor sub-routes
                                    ? "bg-accent text-accent-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                                aria-disabled={isDisabled}
                                onClick={(e) => {
                                    if (isDisabled) e.preventDefault();
                                }}
                            >
                                <item.icon className="h-5 w-5" />
                                <span className="sr-only">{item.label}</span>
                            </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right">{isDisabled ? `${item.label} (select a project first)` : item.label}</TooltipContent>
                    </Tooltip>
                )
            })}
        </TooltipProvider>
    )
}
