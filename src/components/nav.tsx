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
    SidebarMenu, 
    SidebarMenuItem, 
    SidebarMenuButton 
} from "@/components/ui/sidebar"

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
        <SidebarMenu>
            {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                        asChild
                        isActive={pathname.startsWith(item.href)}
                        tooltip={item.label}
                    >
                        <Link href={item.href}>
                            <item.icon className="h-4 w-4" />
                            <span>{item.label}</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            ))}
        </SidebarMenu>
    )
}
