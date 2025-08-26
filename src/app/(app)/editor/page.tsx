
'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Plus, Table2 } from "lucide-react"
import Link from "next/link"
import { useSelectedProject } from "@/hooks/use-selected-project";

export default function EditorPage() {
    const { getSelectedProject } = useSelectedProject();
    const selectedProject = getSelectedProject();
    const projectId = selectedProject?.project_id;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Table Editor</h1>
                <Button asChild disabled={!projectId}>
                    <Link href={projectId ? `/dashboard/tables/create?projectId=${projectId}` : '#'}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Table
                    </Link>
                </Button>
            </div>
            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">ID</TableHead>
                            <TableHead>Product</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Price ($)</TableHead>
                            <TableHead className="w-[100px] text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                                <div className="flex flex-col items-center justify-center">
                                    <Table2 className="h-12 w-12 mb-4" />
                                    <p className="text-lg font-medium">No data to display</p>
                                    <p>Select a table from the dashboard to start editing.</p>
                                </div>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
