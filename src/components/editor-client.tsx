
'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import React, { useState, useEffect } from 'react';
import type { Table as DbTable, Column as DbColumn } from '@/lib/data';
import { 
    Plus, 
    Table,
    Search,
    ChevronDown,
    Filter,
    ArrowDownUp,
    Edit,
    Trash2,
    MoreHorizontal,
    Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { GridColDef, GridRowSelectionModel } from '@mui/x-data-grid';
import { AddRowDialog } from '@/components/add-row-dialog';
import { AddColumnDialog } from '@/components/add-column-dialog';
import { EditRowDialog } from '@/components/edit-row-dialog';
import { ImportCsvDialog } from '@/components/import-csv-dialog';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import {
  Table as ShadcnTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from '@/components/ui/skeleton';
import { deleteRowAction, deleteTableAction } from '@/app/(app)/editor/actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Progress } from './ui/progress';


const DataTable = dynamic(() => import('@/components/data-table').then(mod => mod.DataTable), {
    ssr: false,
    loading: () => <Skeleton className="h-96 w-full" />,
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
    const [selectionModel, setSelectionModel] = React.useState<GridRowSelectionModel>([]);
    const [isEditOpen, setIsEditOpen] = React.useState(false);
    const [isDeleteTableAlertOpen, setIsDeleteTableAlertOpen] = React.useState(false);
    const [tableToDelete, setTableToDelete] = React.useState<DbTable | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [progress, setProgress] = useState(10);

    useEffect(() => {
        setIsLoading(true);
        setProgress(10);
    }, [tableId]);

    useEffect(() => {
        if (isLoading) {
            const timer = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 95) {
                        clearInterval(timer);
                        return prev;
                    }
                    return prev + 5;
                });
            }, 200);

            return () => clearInterval(timer);
        }
    }, [isLoading]);
    
    useEffect(() => {
        if (rows && rawColumns) {
            setProgress(100);
            const timer = setTimeout(() => setIsLoading(false), 500);
            return () => clearTimeout(timer);
        }
    }, [rows, rawColumns]);


    const handleDeleteSelectedRows = async () => {
        if (!projectId || !tableId || !tableName || selectionModel.length === 0) return;

        const result = await deleteRowAction(projectId, tableId, tableName, selectionModel as string[]);
        
        if (result.success) {
            toast({ title: 'Success', description: `${result.deletedCount} row(s) deleted successfully.` });
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error || `Failed to delete rows.` });
        }
        setSelectionModel([]);
    };
    
    const columns: GridColDef[] = React.useMemo(() => {
        return rawColumns.map(col => ({
            field: col.column_name,
            headerName: col.column_name,
            minWidth: 150,
            flex: 1,
            align: col.alignment || 'left',
            headerAlign: col.alignment || 'left',
        }));
    }, [rawColumns]);
    
    const selectedRowData = React.useMemo(() => {
        if (selectionModel.length !== 1) return null;
        const selectedId = selectionModel[0];
        return rows.find(row => row.id === selectedId) || null;
    }, [selectionModel, rows]);

    const handleDeleteTable = async () => {
        if (!tableToDelete || !projectId) return;

        const result = await deleteTableAction(projectId, tableToDelete.table_id, tableToDelete.table_name);
        if (result.success) {
            toast({ title: 'Success', description: `Table '${tableToDelete.table_name}' deleted successfully.` });
            if (tableToDelete.table_id === tableId) {
                router.push(`/editor?projectId=${projectId}`);
            } else {
                router.refresh();
            }
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error || 'Failed to delete table.' });
        }
        setTableToDelete(null);
        setIsDeleteTableAlertOpen(false);
    };

    const openDeleteTableDialog = (table: DbTable) => {
        setTableToDelete(table);
        setIsDeleteTableAlertOpen(true);
    };

    return (
        <>
            <div className="flex w-full items-start">
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
                    <nav className="flex-1 px-2 space-y-1">
                        {allTables.map((table) => (
                             <div 
                                key={table.table_id} 
                                className={`group flex items-center justify-between rounded-md text-sm font-medium hover:bg-accent ${table.table_id === tableId ? 'bg-accent' : ''}`}
                            >
                                <Link 
                                    href={`/editor?projectId=${projectId}&tableId=${table.table_id}&tableName=${table.table_name}`}
                                    className="flex items-center gap-2 px-3 py-2 flex-grow"
                                >
                                    <Table className="h-4 w-4" />
                                    <span className="truncate">{table.table_name}</span>
                                </Link>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 mr-1 opacity-0 group-hover:opacity-100 flex-shrink-0">
                                            <MoreHorizontal className="h-4 w-4" />
                                            <span className="sr-only">Table options</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem disabled>
                                            <Edit className="mr-2 h-4 w-4" />
                                            <span>Edit</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => openDeleteTableDialog(table)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            <span>Delete</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
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
                    {currentTable && tableId && tableName ? (
                        <>
                            <header className="flex h-14 items-center gap-4 border-b bg-background px-6 flex-shrink-0">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Table className="h-4 w-4" />
                                    <span className="font-semibold text-foreground">{currentTable.table_name}</span>
                                </div>
                                <Separator orientation="vertical" className="h-6" />
                                 <div className="flex items-center gap-2">
                                    {tableId && tableName && projectId && rawColumns && (
                                        <>
                                            <AddRowDialog 
                                                projectId={projectId}
                                                tableId={tableId}
                                                tableName={tableName}
                                                columns={rawColumns}
                                            />
                                            <ImportCsvDialog
                                                projectId={projectId}
                                                tableId={tableId}
                                                tableName={tableName}
                                                columns={rawColumns}
                                            />
                                        </>
                                    )}
                                    <Button variant="outline" size="sm" disabled={selectionModel.length !== 1} onClick={() => setIsEditOpen(true)}>
                                        <Edit className="mr-2 h-4 w-4" /> Edit
                                    </Button>
                                    {selectedRowData && tableId && tableName && (
                                        <EditRowDialog
                                            isOpen={isEditOpen}
                                            setIsOpen={setIsEditOpen}
                                            projectId={projectId}
                                            tableId={tableId}
                                            tableName={tableName}
                                            columns={rawColumns}
                                            rowData={selectedRowData}
                                        />
                                    )}

                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" size="sm" disabled={selectionModel.length === 0}>
                                                <Trash2 className="mr-2 h-4 w-4" /> Delete ({selectionModel.length})
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action cannot be undone. This will permanently delete the selected
                                                {selectionModel.length > 1 ? ` ${selectionModel.length} rows` : ' row'} from the table.
                                            </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleDeleteSelectedRows}>Continue</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                                <div className="flex items-center gap-2 ml-auto">
                                    <Button variant="outline" size="sm"><Filter className="mr-2 h-4 w-4" /> Filter</Button>
                                    <Button variant="outline" size="sm"><ArrowDownUp className="mr-2 h-4 w-4" /> Sort</Button>
                                </div>
                            </header>

                            <div className="p-6 overflow-y-auto">
                                <Tabs defaultValue="data" className="w-full">
                                    <TabsList>
                                        <TabsTrigger value="data">Data</TabsTrigger>
                                        <TabsTrigger value="structure">Structure</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="data" className="mt-4">
                                        <DataTable 
                                            tableId={tableId}
                                            columns={columns} 
                                            rows={rows} 
                                            selectionModel={selectionModel}
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
                                                    {currentTable.description ? (
                                                        currentTable.description
                                                    ) : (
                                                        `This is the schema for the '${currentTable.table_name}' table.`
                                                    )}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="border rounded-lg">
                                                    <ShadcnTable>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>Column Name</TableHead>
                                                                <TableHead>Data Type</TableHead>
                                                                <TableHead>Alignment</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {rawColumns.map(col => (
                                                                <TableRow key={col.column_id}>
                                                                    <TableCell className="font-mono">{col.column_name}</TableCell>
                                                                    <TableCell className="font-mono">{col.data_type}</TableCell>
                                                                    <TableCell className="font-mono capitalize">{col.alignment || 'left'}</TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </ShadcnTable>
                                                </div>
                                            </CardContent>
                                            <CardFooter>
                                                <AddColumnDialog
                                                    projectId={projectId}
                                                    tableId={tableId}
                                                    tableName={tableName}
                                                />
                                            </CardFooter>
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
            {isLoading && (
                 <div className="fixed bottom-4 right-4 w-64 z-50">
                    <div className="p-3 bg-card border rounded-lg shadow-lg">
                        <p className="text-sm font-medium text-foreground mb-2">Loading table data...</p>
                        <Progress value={progress} className="w-full" />
                    </div>
                </div>
            )}
            <AlertDialog open={isDeleteTableAlertOpen} onOpenChange={setIsDeleteTableAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the 
                            <strong> {tableToDelete?.table_name}</strong> table and all of its data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setTableToDelete(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteTable}>Continue</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
