
import { Nav } from "@/components/nav";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getCurrentUserId, login, logout, findUserById } from "@/lib/auth";
import { getProjectsForCurrentUser } from "@/lib/data";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ProjectSwitcher } from "@/components/project-switcher";

async function loginAction() {
    'use server';
    await login('123e4567-e89b-12d3-a456-426614174000');
    redirect('/dashboard');
}

async function logoutAction() {
    'use server';
    await logout();
    cookies().delete('selectedProject');
    redirect('/login');
}

export default async function AppLayout({ 
    children,
}: { 
    children: React.ReactNode,
}) {
    const userId = await getCurrentUserId();
    const user = userId ? await findUserById(userId) : null;
    const orgName = user ? `${user.email.split('@')[0]}'s Org` : "My Org";
    const avatarFallback = user ? user.email.charAt(0).toUpperCase() : "M";

    if (!userId) {
        return redirect('/login');
    }

    const projects = await getProjectsForCurrentUser();
    const selectedProjectCookie = cookies().get('selectedProject');
    const selectedProject = selectedProjectCookie ? JSON.parse(selectedProjectCookie.value) : null;

    return (
        <div className="flex min-h-screen w-full flex-col bg-background">
            <header className="sticky top-0 flex h-14 items-center gap-4 border-b bg-background px-4 md:px-6 z-50">
                <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src="https://picsum.photos/32" data-ai-hint="logo" />
                        <AvatarFallback>{avatarFallback}</AvatarFallback>
                    </Avatar>
                     <ProjectSwitcher 
                        orgName={orgName}
                        projects={projects}
                        selectedProject={selectedProject}
                    />
                    {selectedProject && <Badge variant="outline">Free</Badge>}
                </div>
                <div className="flex-1"></div>
                 {userId ? (
                    <div className="flex items-center gap-4">
                        <form action={logoutAction}>
                            <Button variant="outline" size="sm">Logout</Button>
                        </form>
                        <Avatar className="h-8 w-8">
                            <AvatarImage src="https://picsum.photos/32/32" data-ai-hint="profile picture" alt="User" />
                            <AvatarFallback>{avatarFallback}</AvatarFallback>
                        </Avatar>
                    </div>
                ) : (
                    <form action={loginAction}>
                        <Button variant="outline" size="sm">Login</Button>
                    </form>
                )}
            </header>
            <div className="flex flex-1">
                <aside className="hidden w-14 flex-col border-r bg-background sm:flex">
                    <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
                       <Nav projectId={selectedProject?.project_id} />
                    </nav>
                </aside>
                <main className="flex-1 overflow-auto p-4 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
