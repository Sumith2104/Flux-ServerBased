
'use client';

import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createTableAction } from './actions';
import { SubmitButton } from '@/components/submit-button';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';

type Column = {
    id: string;
    name: string;
    type: 'text' | 'number' | 'date' | 'gen_random_uuid()';
};

export default function CreateTablePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const projectId = searchParams.get('projectId');
    const { toast } = useToast();

    const [tableName, setTableName] = useState('');
    const [columns, setColumns] = useState<Column[]>([
        { id: uuidv4(), name: 'id', type: 'gen_random_uuid()' },
    ]);

    const addColumn = () => {
        setColumns([...columns, { id: uuidv4(), name: '', type: 'text' }]);
    };

    const removeColumn = (id: string) => {
        setColumns(columns.filter(col => col.id !== id));
    };

    const updateColumn = (id: string, field: 'name' | 'type', value: string) => {
        setColumns(columns.map(col => 
            col.id === id ? { ...col, [field]: value as Column['type'] } : col
        ));
    };

    async function handleCreateTable(formData: FormData) {
        if (!projectId) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Project ID is missing. Cannot create table.",
            });
            return;
        }

        // Validate columns
        for (const col of columns) {
            if (!col.name.trim() || !col.type) {
                 toast({
                    variant: "destructive",
                    title: "Invalid Column",
                    description: "All column names and types must be filled out.",
                });
                return;
            }
        }
        
        const columnsStr = columns.map(c => `${c.name}:${c.type}`).join(',');

        formData.set('columns', columnsStr);
        formData.append('projectId', projectId);

        const result = await createTableAction(formData);

        if (result.success) {
            toast({
                title: "Success",
                description: "Table created successfully.",
            });
            router.push(`/dashboard`);
        } else {
            toast({
                variant: "destructive",
                title: "Error",
                description: result.error || 'An unexpected error occurred.',
            });
        }
    }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="w-full max-w-2xl">
            <Button variant="ghost" asChild className="mb-4">
                <Link href="/dashboard">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Link>
            </Button>
            <form action={handleCreateTable}>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl">Create New Table</CardTitle>
                        <CardDescription>Define the schema for your new table.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <div className="grid gap-2">
                            <Label htmlFor="tableName">Table Name</Label>
                            <Input
                                id="tableName"
                                name="tableName"
                                placeholder="e.g., users"
                                required
                                className="font-mono"
                                value={tableName}
                                onChange={(e) => setTableName(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-4">
                           <div>
                                <Label>Columns</Label>
                                <p className="text-sm text-muted-foreground">
                                    Define the name and data type for each column.
                                </p>
                           </div>
                           <div className="space-y-4">
                            {columns.map((col, index) => (
                                <div key={col.id} className="flex items-center gap-2">
                                     <Input
                                        placeholder="Column name"
                                        value={col.name}
                                        onChange={(e) => updateColumn(col.id, 'name', e.target.value)}
                                        className="font-mono"
                                        required
                                    />
                                    <Select 
                                        value={col.type} 
                                        onValueChange={(value: 'text' | 'number' | 'date' | 'gen_random_uuid()') => updateColumn(col.id, 'type', value)}
                                    >
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="text">Text</SelectItem>
                                            <SelectItem value="number">Number</SelectItem>
                                            <SelectItem value="date">Date</SelectItem>
                                            <SelectItem value="gen_random_uuid()">UUID</SelectItem>
                                        </SelectContent>
                                    </Select>
                                     <Button 
                                        variant="destructive" 
                                        size="icon" 
                                        onClick={() => removeColumn(col.id)} 
                                        type="button"
                                        disabled={index === 0}
                                    >
                                        <Trash2 className="h-4 w-4"/>
                                        <span className="sr-only">Remove column</span>
                                    </Button>
                                </div>
                            ))}
                           </div>
                             <Button variant="outline" onClick={addColumn} type="button">
                                <Plus className="mr-2 h-4 w-4"/>
                                Add Column
                            </Button>
                        </div>
                    </CardContent>
                    <CardFooter>
                         <SubmitButton type="submit" className="w-full">
                            Create Table
                        </SubmitButton>
                    </CardFooter>
                </Card>
            </form>
        </div>
    </div>
  );
}
