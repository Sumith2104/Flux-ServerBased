"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
    LayoutDashboard, 
    Table, 
    BrainCircuit, 
    Code, 
    Folder, 
    Settings as SettingsIcon
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
                const isProjectSpecific = ["/editor", "/api", "/storage", "/settings"].includes(item.href);
                const isDisabled = isProjectSpecific && !projectId;
                const finalHref = projectId && isProjectSpecific ? `${item.href}?projectId=${projectId}` : item.href;
                
                // For the dashboard link, we want to clear the project selection
                const dashboardHref = "/dashboard";

                return (
                    <Tooltip key={item.href}>
                        <TooltipTrigger asChild>
                             <Link
                                href={item.href === '/dashboard' ? dashboardHref : finalHref}
                                className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors md:h-8 md:w-8 ${
                                    isDisabled ? "cursor-not-allowed text-muted-foreground/50" :
                                    pathname === item.href
                                    ? "bg-accent text-accent-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                                aria-disabled={isDisabled}
                                onClick={(e) => isDisabled && e.preventDefault()}
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
