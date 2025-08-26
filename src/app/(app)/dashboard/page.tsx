import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, ChevronRight, LayoutGrid, List, Filter } from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { getProjectsForCurrentUser, Project } from "@/lib/data";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
    let projects: Project[] = [];
    try {
        projects = await getProjectsForCurrentUser();
    } catch (error) {
        console.error("Failed to fetch projects:", error);
        // Handle case where user is not logged in or projects file doesn't exist
    }

    return (
        <div className="container mx-auto px-0">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Projects</h1>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon">
                        <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                        <List className="h-4 w-4" />
                    </Button>
                    <Button style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
                        <Plus className="mr-2 h-4 w-4" />
                        New project
                    </Button>
                </div>
            </div>
            <div className="mb-6 flex items-center gap-2">
                <div className="relative flex-1">
                    <Input placeholder="Search for a project" className="pr-10" />
                </div>
                <Button variant="outline">
                    <Filter className="mr-2 h-4 w-4" />
                    Filter
                </Button>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {projects.map((project) => (
                    <Link href={`/dashboard/project/${project.project_id}`} key={project.project_id} className="group">
                        <Card className="flex flex-col h-full">
                           <CardHeader className="flex-row items-center justify-between pb-2">
                                <CardTitle className="text-base font-medium">{project.display_name}</CardTitle>
                                <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                            </CardHeader>
                            <CardContent className="flex-grow pt-0 flex flex-col justify-between">
                                <p className="text-sm text-muted-foreground">Created: {new Date(project.created_at).toLocaleDateString()}</p>
                                <Badge variant="secondary" className="mt-4 w-fit">Project</Badge>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
                 {projects.length === 0 && (
                    <div className="col-span-full text-center text-muted-foreground py-10">
                        <p>No projects yet.</p>
                        <Button variant="link" asChild>
                           <Link href="/dashboard/projects/create">Create your first project</Link>
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
