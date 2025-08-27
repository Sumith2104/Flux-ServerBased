

'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button"
import { Plus, Table2, TableIcon } from "lucide-react"
import Link from "next/link"
import { getColumnsForTable, getTableData, type Column, getTablesForProject, type Table } from "@/lib/data"
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar"
import { AddRowDialog } from "@/components/add-row-dialog"
import { DataTable } from '@/components/data-table';
import Cookies from 'js-cookie';

export default function EditorPage() {
    const searchParams = useSearchParams();
    const tableId = searchParams.get('tableId');
    const tableName = searchParams.get('tableName');
    
    const [columns, setColumns] = useState<Column[]>([]);
    const [data, setData] = useState<Record<string, string>[]>([]);
    const [tables, setTables] = useState<Table[]>([]);
    const [projectId, setProjectId] = useState<string | null>(null);

    // This effect runs once to get the project ID from the cookie.
    useEffect(() => {
        const selectedProjectCookie = Cookies.get('selectedProject');
        const selectedProject = selectedProjectCookie ? JSON.parse(selectedProjectCookie) : null;
        if (selectedProject) {
            setProjectId(selectedProject.project_id);
        }
    }, []);

    // This effect fetches the list of tables when the project ID is available.
    useEffect(() => {
        if (projectId) {
            getTablesForProject(projectId)
                .then(setTables)
                .catch(err => console.error("Failed to load tables:", err));
        }
    }, [projectId]);

    // This effect fetches the table columns and data when a table is selected.
    useEffect(() => {
        if (tableId && tableName && projectId) {
            getColumnsForTable(projectId, tableId)
                .then(cols => {
                    setColumns(cols);
                    // After getting columns, fetch data.
                    getTableData(projectId, tableName)
                        .then(tableData => {
                             // MUI DataGrid requires a unique `id` field for each row.
                             // We'll add one if it doesn't exist.
                             const dataWithIds = tableData.map((row, index) => ({
                                id: row.id || `${tableName}-row-${index}`, // Use existing id or create one
                                ...row,
                            }));
                            setData(dataWithIds);
                        })
                        .catch(err => console.error("Failed to load table data:", err));
                })
                .catch(err => console.error("Failed to load columns:", err));
        }
    }, [tableId, tableName, projectId]);
    
    const gridColumns = columns.map(col => ({
        field: col.column_name,
        headerName: col.column_name,
        width: 150,
        editable: true,
    }));

    const gridRows = data;

    return (
        <SidebarProvider>
            <Sidebar>
                 <SidebarHeader>
                    <h2 className="text-lg font-semibold">Tables</h2>
                </SidebarHeader>
                <SidebarContent>
                    <SidebarMenu>
                         {tables.map((table) => (
                            <SidebarMenuItem key={table.table_id}>
                                <SidebarMenuButton 
                                    asChild
                                    isActive={table.table_id === tableId}
                                >
                                     <Link href={`/editor?tableId=${table.table_id}&tableName=${table.table_name}`} className="flex items-center gap-2">
                                        <TableIcon className="h-4 w-4" />
                                        <span>{table.table_name}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                         ))}
                    </SidebarMenu>
                </SidebarContent>
                 <div className="p-2 border-t">
                    <Button asChild className="w-full" disabled={!projectId}>
                        <Link href={projectId ? `/dashboard/tables/create?projectId=${projectId}` : '#'}>
                            <Plus className="mr-2 h-4 w-4" />
                            New Table
                        </Link>
                    </Button>
                </div>
            </Sidebar>
            <div className="flex-1 flex flex-col">
                <div className="flex justify-between items-center p-4 md:p-6 border-b">
                    <h1 className="text-2xl font-bold">{tableName ? `Editing: ${tableName}` : 'Table Editor'}</h1>
                    {tableId && projectId ? (
                        <AddRowDialog columns={columns} projectId={projectId} tableName={tableName!} />
                    ) : (
                         <Button asChild disabled={!projectId}>
                            <Link href={projectId ? `/dashboard/tables/create?projectId=${projectId}` : '#'}>
                                <Plus className="mr-2 h-4 w-4" />
                                New Table
                            </Link>
                        </Button>
                    )}
                </div>
                <div className="p-4 md:p-6 flex-1 overflow-auto">
                    {tableId && columns.length > 0 ? (
                        <DataTable columns={gridColumns} rows={gridRows} />
                    ) : tableId ? (
                        <div className="h-full flex items-center justify-center text-center text-muted-foreground">
                            <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-12">
                                <Table2 className="h-12 w-12 mb-4" />
                                <p className="text-lg font-medium">This table is empty</p>
                                <p>Add some data to get started.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center text-center text-muted-foreground">
                           <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-12">
                                <Table2 className="h-12 w-12 mb-4" />
                                <p className="text-lg font-medium">No table selected</p>
                                <p>Select a table from the sidebar to start editing.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </SidebarProvider>
    )
}
