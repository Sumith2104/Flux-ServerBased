
'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import React, { useState } from 'react';
import type { Table as DbTable, Column as DbColumn } from '@/lib/data';
import { 
    Plus, 
    Table,
    Search,
    ChevronDown,
    Filter,
    ArrowDownUp,
    Edit,
    Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { GridColDef, GridRowSelectionModel } from '@mui/x-data-grid';
import { AddRowDialog } from '@/components/add-row-dialog';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table as ShadcnTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from '@/components/ui/skeleton';
import { deleteRowAction } from '@/app/(app)/editor/actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

const DataTable = dynamic(() => import('@/components/data-table').then(mod => mod.DataTable), {
    ssr: false,
    loading: () => <Skeleton className="h-full w-full" />,
});

interface EditorClientProps {
    projectId: string;
    tableId?: string;
    tableName?: string;
    allTables: DbTable[];
    currentTable: DbTable | null | undefined;
    columns: DbColumn[];
    rows: any[];
}

export function EditorClient({
    projectId,
    tableId,
    tableName,
    allTables,
    currentTable,
    columns: rawColumns,
    rows,
}: EditorClientProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>([]);

    const handleDeleteSelected = async () => {
        if (!projectId || !tableId || !tableName || selectionModel.length === 0) return;

        if (window.confirm(`Are you sure you want to delete ${selectionModel.length} row(s)?`)) {
            let successCount = 0;
            let errorCount = 0;

            for (const id of selectionModel) {
                const result = await deleteRowAction(projectId, tableId, tableName, id as string);
                if (result.success) {
                    successCount++;
                } else {
                    errorCount++;
                    console.error(`Failed to delete row ${id}: ${result.error}`);
                }
            }

            if (successCount > 0) {
                 toast({ title: 'Success', description: `${successCount} row(s) deleted successfully.` });
            }
            if (errorCount > 0) {
                toast({ variant: 'destructive', title: 'Error', description: `Failed to delete ${errorCount} row(s).` });
            }
            router.refresh();
            setSelectionModel([]);
        }
    };
    
    const columns: GridColDef[] = React.useMemo(() => {
        return rawColumns.map(col => ({
            field: col.column_name,
            headerName: col.column_name,
            width: 150,
            editable: true,
        }));
    }, [rawColumns]);


    return (
        <div className="flex h-full w-full">
            {/* Sidebar */}
            <aside className="w-64 flex-shrink-0 border-r bg-background flex flex-col">
                <div className="p-4">
                    <h2 className="text-lg font-semibold">Table Editor</h2>
                </div>
                <div className="p-2">
                    <Button variant="outline" className="w-full justify-start text-muted-foreground">
                        <span className="truncate">schema <strong>public</strong></span>
                        <ChevronDown className="ml-auto h-4 w-4" />
                    </Button>
                </div>
                <div className="p-2 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search tables..." className="pl-8" />
                </div>
                <nav className="flex-1 overflow-y-auto px-2">
                    {allTables.map((table) => (
                         <Link 
                            key={table.table_id} 
                            href={`/editor?projectId=${projectId}&tableId=${table.table_id}&tableName=${table.table_name}`}
                            className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent ${table.table_id === tableId ? 'bg-accent' : ''}`}
                        >
                            <Table className="h-4 w-4" />
                            <span className="truncate">{table.table_name}</span>
                        </Link>
                    ))}
                </nav>
                 <div className="p-2 border-t">
                    <Button asChild className="w-full">
                        <Link href={projectId ? `/dashboard/tables/create?projectId=${projectId}` : '#'}>
                            <Plus className="mr-2 h-4 w-4" />
                            New Table
                        </Link>
                    </Button>
                </div>
            </aside>
            
            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {currentTable ? (
                    <>
                        <header className="flex h-14 items-center gap-4 border-b bg-background px-6 flex-shrink-0">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Table className="h-4 w-4" />
                                <span className="font-semibold text-foreground">{currentTable.table_name}</span>
                            </div>
                            <Separator orientation="vertical" className="h-6" />
                             <div className="flex items-center gap-2">
                                {tableId && tableName && projectId && rawColumns && (
                                    <AddRowDialog 
                                        projectId={projectId}
                                        tableId={tableId}
                                        tableName={tableName}
                                        columns={rawColumns}
                                    />
                                )}
                                <Button variant="outline" size="sm" disabled={selectionModel.length !== 1}>
                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                </Button>
                                <Button variant="destructive" size="sm" disabled={selectionModel.length === 0} onClick={handleDeleteSelected}>
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete ({selectionModel.length})
                                </Button>
                            </div>
                            <div className="flex items-center gap-2 ml-auto">
                                <Button variant="outline" size="sm"><Filter className="mr-2 h-4 w-4" /> Filter</Button>
                                <Button variant="outline" size="sm"><ArrowDownUp className="mr-2 h-4 w-4" /> Sort</Button>
                            </div>
                        </header>

                        <div className="flex-1 p-6 overflow-y-auto">
                            <Tabs defaultValue="data" className="flex flex-col h-full">
                                <TabsList>
                                    <TabsTrigger value="data">Data</TabsTrigger>
                                    <TabsTrigger value="structure">Structure</TabsTrigger>
                                </TabsList>
                                <TabsContent value="data" className="mt-4 flex-1">
                                    <DataTable 
                                        columns={columns} 
                                        rows={rows} 
                                        onRowSelectionModelChange={(newSelectionModel) => {
                                            setSelectionModel(newSelectionModel);
                                        }}
                                    />
                                </TabsContent>
                                <TabsContent value="structure" className="mt-4">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Table Structure</CardTitle>
                                            <CardDescription>
                                                This is the schema for the '{currentTable.table_name}' table.
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="border rounded-lg">
                                                <ShadcnTable>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Column Name</TableHead>
                                                            <TableHead>Data Type</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {rawColumns.map(col => (
                                                            <TableRow key={col.column_id}>
                                                                <TableCell className="font-mono">{col.column_name}</TableCell>
                                                                <TableCell className="font-mono">{col.data_type}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </ShadcnTable>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <Table className="h-16 w-16 text-muted-foreground" />
                        <h2 className="mt-4 text-xl font-semibold">Select a table to begin</h2>
                        <p className="mt-2 text-muted-foreground">Choose a table from the sidebar to view its data and structure.</p>
                         <Button asChild className="mt-4">
                            <Link href={projectId ? `/dashboard/tables/create?projectId=${projectId}` : '#'}>
                                <Plus className="mr-2 h-4 w-4" />
                                Create New Table
                            </Link>
                        </Button>
                    </div>
                )}
            </main>
        </div>
    );
}
