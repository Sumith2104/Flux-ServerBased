
import { Suspense } from 'react';
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getTablesForProject, getColumnsForTable, getConstraintsForTable, getConstraintsForProject } from '@/lib/data';
import { EditorClient } from '@/components/editor-client';
import { Skeleton } from '@/components/ui/skeleton';


async function Editor({ projectId, tableId, tableName }: { projectId: string; tableId?: string; tableName?: string; }) {
    const allTables = await getTablesForProject(projectId);
    const currentTable = tableId ? allTables.find(t => t.table_id === tableId) : null;

    let columns: any[] = [];
    let constraints: any[] = [];
    let allProjectConstraints: any[] = [];


    if (currentTable && tableId) {
        columns = await getColumnsForTable(projectId, tableId);
        constraints = await getConstraintsForTable(projectId, tableId);
        allProjectConstraints = await getConstraintsForProject(projectId);
    }

    // Rows are now fetched on the client-side
    return (
        <EditorClient
            projectId={projectId}
            tableId={tableId}
            tableName={tableName}
            allTables={allTables}
            currentTable={currentTable}
            initialColumns={columns}
            initialConstraints={constraints}
            allProjectConstraints={allProjectConstraints}
            initialRows={[]} // Pass empty initial rows
        />
    );
}

function EditorSkeleton() {
    return (
        <div className="flex h-full w-full">
            <aside className="w-64 flex-shrink-0 border-r bg-background flex flex-col p-4 gap-4">
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-10 w-full" />
                <div className="space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                </div>
            </aside>
            <main className="flex-1 flex flex-col overflow-hidden">
                 <div className="flex flex-col items-center justify-center h-full text-center">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <Skeleton className="h-6 w-48 mt-4" />
                    <Skeleton className="h-4 w-64 mt-2" />
                    <Skeleton className="h-10 w-32 mt-4" />
                </div>
            </main>
        </div>
    )
}

export default function EditorPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
    const selectedProjectCookie = cookies().get('selectedProject');
    const selectedProject = selectedProjectCookie ? JSON.parse(selectedProjectCookie.value) : null;
    const projectId = searchParams?.projectId as string || selectedProject?.project_id;
    
    if (!projectId) {
        redirect('/dashboard');
    }

    const tableId = searchParams?.tableId as string | undefined;
    const tableName = searchParams?.tableName as string | undefined;

    return (
        <Suspense fallback={<EditorSkeleton />}>
            <Editor projectId={projectId} tableId={tableId} tableName={tableName} />
        </Suspense>
    );
}
