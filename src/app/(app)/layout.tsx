import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { Nav } from "@/components/nav";
import { TableProperties } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <Sidebar>
                <SidebarHeader>
                    <div className="flex items-center gap-2 p-2">
                        <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0" asChild>
                           <Link href="/dashboard">
                            <TableProperties className="h-6 w-6 text-primary" />
                           </Link>
                        </Button>
                        <h1 className="text-xl font-semibold truncate">Spreadsheet AI</h1>
                    </div>
                </SidebarHeader>
                <SidebarContent>
                    <Nav />
                </SidebarContent>
            </Sidebar>
            <SidebarInset>
                <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm">
                    <SidebarTrigger />
                    <Avatar className="h-8 w-8">
                        <AvatarImage src="https://picsum.photos/32" data-ai-hint="profile picture" alt="User" />
                        <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                </header>
                <main className="flex-1 overflow-auto p-4 md:p-6">
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
