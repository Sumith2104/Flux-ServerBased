"use client";

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Plus, Table as TableIcon, Database, LayoutDashboard, Folder } from "lucide-react"
import { Table } from "@/lib/data";

export function Nav({ projectId, tables }: { projectId: string, tables: Table[] }) {
    const pathname = usePathname();

    const navLinks = [
        { href: `/dashboard/project/${projectId}`, label: "Project Dashboard", icon: LayoutDashboard },
        { href: `/dashboard/project/${projectId}/storage`, label: "Storage", icon: Folder },
    ];
    
    return (
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {navLinks.map(link => (
                 <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${pathname === link.href ? 'bg-muted text-primary' : ''}`}
                >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                </Link>
            ))}
            
            <div className="my-4 border-t border-muted"></div>

            <div className="px-3 py-2 flex justify-between items-center">
                <h2 className="text-lg font-semibold tracking-tight">
                    Tables
                </h2>
                <Button asChild variant="outline" size="sm">
                   <Link href={`/dashboard/tables/create?projectId=${projectId}`}>
                        <Plus className="h-4 w-4 mr-2" /> New
                   </Link>
                </Button>
            </div>
             <div className="flex-1 mt-2">
                {tables.length > 0 ? (
                    tables.map(table => (
                        <Link
                            key={table.table_id}
                            href={`/dashboard/project/${projectId}/table/${table.table_name}`}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${pathname.endsWith(`/table/${table.table_name}`) ? 'bg-muted text-primary' : ''}`}
                        >
                            <TableIcon className="h-4 w-4" />
                            {table.table_name}
                        </Link>
                    ))
                ) : (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                        No tables created yet.
                    </div>
                )}
            </div>
        </nav>
    )
}
