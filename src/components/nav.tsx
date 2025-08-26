"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
    LayoutDashboard, 
    Table, 
    BrainCircuit, 
    Code, 
    Folder, 
    Settings as SettingsIcon,
    Tooltip,
    TooltipContent,
    TooltipTrigger,
    TooltipProvider
} from "lucide-react"

const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/editor", label: "Table Editor", icon: Table },
    { href: "/query", label: "AI SQL Translator", icon: BrainCircuit },
    { href: "/api", label: "API Generation", icon: Code },
    { href: "/storage", label: "Mock Storage", icon: Folder },
    { href: "/settings", label: "Settings", icon: SettingsIcon },
]

export function Nav() {
    const pathname = usePathname()
    
    return (
        <TooltipProvider>
            {navItems.map((item) => (
                <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                         <Link
                            href={item.href}
                            className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors md:h-8 md:w-8 ${
                                pathname.startsWith(item.href)
                                ? "bg-accent text-accent-foreground"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            <item.icon className="h-5 w-5" />
                            <span className="sr-only">{item.label}</span>
                        </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
            ))}
        </TooltipProvider>
    )
}
