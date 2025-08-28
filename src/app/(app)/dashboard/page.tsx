

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, ChevronRight, LayoutGrid, List, Filter, Table, Edit } from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { getProjectsForCurrentUser, Project, getTablesForProject, Table as DbTable } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { cookies } from "next/headers";
import { redirect } from 'next/navigation';
import {
  Table as ShadcnTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"


async function selectProjectAction(formData: FormData) {
    'use server';
    const projectString = formData.get('project') as string;
    if (projectString) {
        cookies().set('selectedProject', projectString, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 365, // 1 year
            path: '/',
        });
    }
    redirect('/dashboard');
}

export default async function DashboardPage() {
    let projects: Project[] = [];
    try {
        projects = await getProjectsForCurrentUser();
    } catch (error) {
        console.error("Failed to fetch projects:", error);
    }

    const selectedProjectCookie = cookies().get('selectedProject');
    const selectedProject = selectedProjectCookie ? JSON.parse(selectedProjectCookie.value) : null;
    const tables = selectedProject ? await getTablesForProject(selectedProject.project_id) : [];


    return (
        <div className="container mx-auto px-0">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <div className="flex items-center gap-2">
                    {selectedProject && (
                        <Button asChild>
                           <Link href={`/dashboard/tables/create?projectId=${selectedProject.project_id}`}>
                                <Plus className="mr-2 h-4 w-4" />
                                New Table
                           </Link>
                        </Button>
                    )}
                    <Button asChild variant="outline">
                       <Link href="/dashboard/projects/create">
                            <Plus className="mr-2 h-4 w-4" />
                            New project
                       </Link>
                    </Button>
                </div>
            </div>

            {!selectedProject ? (
                 <Card>
                    <CardHeader>
                        <CardTitle>Welcome to Spreadsheet AI</CardTitle>
                        <CardDescription>Select a project to get started or create a new one.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {projects.map((project) => (
                                <form action={selectProjectAction} key={project.project_id}>
                                    <input type="hidden" name="project" value={JSON.stringify(project)} />
                                    <button type="submit" className="w-full text-left group">
                                        <Card className="flex flex-col h-full">
                                            <CardHeader className="flex-row items-center justify-between pb-2">
                                                <CardTitle className="text-base font-medium">{project.display_name}</CardTitle>
                                                <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                                            </CardHeader>
                                            <CardContent className="flex-grow pt-0 flex flex-col justify-between">
                                                <div>
                                                    <p className="text-sm text-muted-foreground">
                                                        Created: {new Date(project.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <Badge variant="secondary" className="mt-4 w-fit">Project</Badge>
                                            </CardContent>
                                        </Card>
                                    </button>
                                </form>
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
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                              Total Tables
                            </CardTitle>
                            <Table className="h-4 w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{tables.length}</div>
                            <p className="text-xs text-muted-foreground">
                              Tables in this project
                            </p>
                          </CardContent>
                        </Card>
                    </div>
                    <Card>
                        <CardHeader>
                            <CardTitle>Tables</CardTitle>
                            <CardDescription>
                                A list of tables in your project.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {tables.length > 0 ? (
                                <div className="border rounded-lg">
                                    <ShadcnTable>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Description</TableHead>
                                                <TableHead>Created</TableHead>
                                                <TableHead></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {tables.map((table: DbTable) => (
                                                <TableRow key={table.table_id}>
                                                    <TableCell className="font-medium">{table.table_name}</TableCell>
                                                    <TableCell className="text-muted-foreground">{table.description}</TableCell>
                                                    <TableCell>{new Date(table.created_at).toLocaleDateString()}</TableCell>
                                                    <TableCell>
                                                        <Button asChild variant="outline" size="sm">
                                                            <Link href={`/editor?projectId=${selectedProject.project_id}&tableId=${table.table_id}&tableName=${table.table_name}`}>
                                                                <Edit className="mr-2 h-4 w-4"/>
                                                                Edit
                                                            </Link>
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </ShadcnTable>
                                </div>
                            ) : (
                                 <div className="text-center text-muted-foreground py-10 border-2 border-dashed rounded-lg">
                                    <p>No tables yet.</p>
                                    <Button variant="link" asChild>
                                       <Link href={`/dashboard/tables/create?projectId=${selectedProject.project_id}`}>Create your first table</Link>
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
