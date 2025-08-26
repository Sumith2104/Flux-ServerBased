import { SidebarProvider, Sidebar, SidebarContent, SidebarTrigger } from "@/components/ui/sidebar";
import { Nav } from "@/components/nav";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, HelpCircle, MessageSquare, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen w-full flex-col bg-background">
            <header className="sticky top-0 flex h-14 items-center gap-4 border-b bg-background px-4 md:px-6 z-50">
                <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src="https://picsum.photos/32" data-ai-hint="logo" />
                        <AvatarFallback>S</AvatarFallback>
                    </Avatar>
                    <h1 className="text-lg font-semibold">Sumith's Org</h1>
                    <Badge variant="outline">Free</Badge>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1"></div>
                <Button variant="outline" size="sm">Feedback</Button>
                <HelpCircle className="h-5 w-5 text-muted-foreground" />
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
                 <Avatar className="h-8 w-8">
                    <AvatarImage src="https://picsum.photos/32/32" data-ai-hint="profile picture" alt="User" />
                    <AvatarFallback>U</AvatarFallback>
                </Avatar>
            </header>
            <div className="flex flex-1">
                <aside className="hidden w-14 flex-col border-r bg-background sm:flex">
                    <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
                       <Nav />
                    </nav>
                </aside>
                <main className="flex-1 overflow-auto p-4 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
