
'use client';

import { usePathname, useRouter } from "next/navigation";
import { Nav } from "@/components/nav";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getCurrentUserId, User } from "@/lib/auth";
import { findUserById } from "@/lib/auth-actions";
import { getProjectsForCurrentUser, Project } from "@/lib/data";
import { ProjectSwitcher } from "@/components/project-switcher";
import { useEffect, useState, useContext } from "react";
import { cn } from "@/lib/utils";
import { logoutAction } from "./actions";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectProvider, ProjectContext } from "@/contexts/project-context";

function AppLayoutContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();

    const [user, setUser] = useState<User | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const { project: selectedProject } = useContext(ProjectContext);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const id = await getCurrentUserId();
                setUserId(id);

                if (id) {
                    const userData = await findUserById(id);
                    setUser(userData);
                    const projectsData = await getProjectsForCurrentUser();
                    setProjects(projectsData);
                }
            } catch (error) {
                console.error("Failed to fetch layout data:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [pathname]);

    // Redirect logic
    useEffect(() => {
        if (loading || !userId) return;

        const isProjectSelectionPage = pathname.startsWith('/dashboard/projects');
        
        if (!selectedProject && !isProjectSelectionPage) {
            router.push('/dashboard/projects');
        }

    }, [loading, userId, selectedProject, pathname, router]);

    const isEditorPage = pathname.startsWith('/editor');

    if (loading) {
        return (
            <div className="flex min-h-screen w-full flex-col bg-background">
                <header className="sticky top-0 flex h-14 items-center gap-4 border-b bg-background px-4 md:px-6 z-50">
                   <Skeleton className="h-8 w-8 rounded-full" />
                   <Skeleton className="h-6 w-40" />
                   <div className="flex-1"></div>
                   <Skeleton className="h-8 w-20" />
                </header>
                 <div className="flex flex-1 overflow-hidden">
                    <aside className="hidden w-14 flex-col border-r bg-background sm:flex">
                        <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
                            <Skeleton className="h-8 w-8 rounded-lg" />
                            <Skeleton className="h-8 w-8 rounded-lg" />
                            <Skeleton className="h-8 w-8 rounded-lg" />
                        </nav>
                    </aside>
                    <main className="flex-1 overflow-auto p-4 md:p-8">
                         <div className="flex items-center justify-center h-full">
                            <p>Loading...</p>
                         </div>
                    </main>
                </div>
            </div>
        );
    }
    
    if (!loading && !userId && !pathname.startsWith('/login') && !pathname.startsWith('/signup')) {
        if (typeof window !== 'undefined') {
            router.push('/login');
        }
        return <div className="flex items-center justify-center h-screen">Redirecting to login...</div>;
    }

    const orgName = user ? `${user.email.split('@')[0]}'s Org` : "My Org";
    const avatarFallback = user ? user.email.charAt(0).toUpperCase() : "M";
    const headerTitle = selectedProject 
        ? `${orgName} / ${selectedProject.display_name}`
        : orgName;

    return (
        <div className="flex min-h-screen w-full flex-col bg-background">
            <header className="sticky top-0 flex h-14 items-center gap-4 border-b bg-background px-4 md:px-6 z-50">
                <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                        <AvatarFallback>{avatarFallback}</AvatarFallback>
                    </Avatar>
                     <ProjectSwitcher 
                        headerTitle={headerTitle}
                        orgName={orgName}
                        projects={projects}
                        selectedProject={selectedProject}
                    />
                    {selectedProject && <Badge variant="outline">Free</Badge>}
                </div>
                <div className="flex-1"></div>
                 {userId ? (
                    <div className="flex items-center">
                        <form action={logoutAction}>
                            <Button variant="outline" size="sm">Logout</Button>
                        </form>
                    </div>
                ) : (
                     <Button asChild variant="outline" size="sm">
                        <Link href="/login">Login</Link>
                    </Button>
                )}
            </header>
            <div className="flex flex-1 overflow-hidden">
                <aside className="hidden w-14 flex-col border-r bg-background sm:flex">
                    <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
                       <Nav projectId={selectedProject?.project_id} />
                    </nav>
                </aside>
                <main className={cn("flex-1 overflow-auto", {
                    "p-0": isEditorPage,
                    "p-4 md:p-8": !isEditorPage,
                })}>
                    {children}
                </main>
            </div>
        </div>
    );
}

export default function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
    return (
        <ProjectProvider>
            <AppLayoutContent>{children}</AppLayoutContent>
        </ProjectProvider>
    );
}
