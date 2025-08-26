
import { Table as ShadcnTable, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Plus, Table2 } from "lucide-react"
import Link from "next/link"
import { getColumnsForTable, getTableData, Column } from "@/lib/data"
import { cookies } from "next/headers"

export default async function EditorPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
    const tableId = searchParams.tableId as string;
    const tableName = searchParams.tableName as string;
    const selectedProjectCookie = cookies().get('selectedProject');
    const selectedProject = selectedProjectCookie ? JSON.parse(selectedProjectCookie.value) : null;
    const projectId = selectedProject?.project_id;

    let columns: Column[] = [];
    let data: Record<string, string>[] = [];

    if (projectId && tableId && tableName) {
        try {
            columns = await getColumnsForTable(projectId, tableId);
            data = await getTableData(projectId, tableName);
        } catch (error) {
            console.error("Failed to load table data:", error);
            // Handle error state, maybe show a toast or message
        }
    }


    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">{tableName ? `Editing: ${tableName}` : 'Table Editor'}</h1>
                 <Button asChild disabled={!projectId}>
                    <Link href={projectId ? `/dashboard/tables/create?projectId=${projectId}` : '#'}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Table
                    </Link>
                </Button>
            </div>
            <div className="rounded-lg border">
                <ShadcnTable>
                    <TableHeader>
                        <TableRow>
                            {columns.length > 0 ? (
                                <>
                                    {columns.map(col => <TableHead key={col.column_id}>{col.column_name}</TableHead>)}
                                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                                </>
                            ) : (
                                <TableHead>ID</TableHead>
                            )}
                           
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tableId && data.length > 0 ? (
                             data.map((row, rowIndex) => (
                                <TableRow key={rowIndex}>
                                    {columns.map(col => (
                                        <TableCell key={col.column_id}>{row[col.column_name]}</TableCell>
                                    ))}
                                    <TableCell className="text-right">
                                        {/* Action buttons can go here */}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : tableId && columns.length > 0 ? (
                            <TableRow>
                                <TableCell colSpan={columns.length + 1} className="h-48 text-center text-muted-foreground">
                                    <div className="flex flex-col items-center justify-center">
                                        <Table2 className="h-12 w-12 mb-4" />
                                        <p className="text-lg font-medium">This table is empty</p>
                                        <p>Add some data to get started.</p>
                                     </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                             <TableRow>
                                <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                                    <div className="flex flex-col items-center justify-center">
                                        <Table2 className="h-12 w-12 mb-4" />
                                        <p className="text-lg font-medium">No table selected</p>
                                        <p>Select a table from the dashboard to start editing.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </ShadcnTable>
            </div>
        </div>
    )
}
