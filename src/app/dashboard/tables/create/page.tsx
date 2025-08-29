
'use client';

import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useRef, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createTableAction } from './actions';
import { SubmitButton } from '@/components/submit-button';
import { ArrowLeft, Plus, Trash2, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ColumnType = 'text' | 'number' | 'date' | 'gen_random_uuid()' | 'now_date()' | 'now_time()';
type Alignment = 'left' | 'center' | 'right';

type Column = {
    id: string;
    name: string;
    type: ColumnType;
    alignment: Alignment;
};

export default function CreateTablePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const projectId = searchParams.get('projectId');
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [tableName, setTableName] = useState('');
    const [description, setDescription] = useState('');
    const [columns, setColumns] = useState<Column[]>([
        { id: uuidv4(), name: 'id', type: 'gen_random_uuid()', alignment: 'left' },
    ]);
    const [csvContent, setCsvContent] = useState<string | null>(null);
    const [csvFileName, setCsvFileName] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('manual');

    const addColumn = () => {
        setColumns([...columns, { id: uuidv4(), name: '', type: 'text', alignment: 'left' }]);
    };

    const removeColumn = (id: string) => {
        setColumns(columns.filter(col => col.id !== id));
    };

    const updateColumn = (id: string, field: keyof Column, value: string) => {
        setColumns(columns.map(col => 
            col.id === id ? { ...col, [field]: value } : col
        ));
    };
    
    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result as string;
                setCsvContent(text);
                setCsvFileName(file.name);

                const lines = text.trim().split('\n');
                if (lines.length > 0) {
                    const header = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
                    const newColumns: Column[] = header.map(name => ({
                        id: uuidv4(),
                        name: name,
                        type: 'text',
                        alignment: 'left'
                    }));

                    if (!header.some(h => h.toLowerCase() === 'id')) {
                        newColumns.unshift({ id: uuidv4(), name: 'id', type: 'gen_random_uuid()', alignment: 'left' });
                        const rows = lines.slice(1).map(line => `,${line}`);
                        const updatedCsv = [ `id,${lines[0]}`, ...rows ].join('\n');
                        setCsvContent(updatedCsv);
                    }
                    setColumns(newColumns);
                }
            };
            reader.readAsText(file);
        }
    };
    
    const handleTabChange = (value: string) => {
        setActiveTab(value);
        setColumns([{ id: uuidv4(), name: 'id', type: 'gen_random_uuid()', alignment: 'left' }]);
        setCsvContent(null);
        setCsvFileName(null);
        setTableName('');
        setDescription('');
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
        
        const columnsStr = columns.map(c => `${c.name}:${c.type}:${c.alignment}`).join(',');
        formData.set('columns', columnsStr);
        formData.append('projectId', projectId);
        if (csvContent && activeTab === 'import') {
            formData.append('csvContent', csvContent);
        }

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
        <div className="w-full max-w-3xl">
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
                        <CardDescription>Define the schema for your new table manually or by importing a CSV file.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="manual">Create Manually</TabsTrigger>
                                <TabsTrigger value="import">Import from CSV</TabsTrigger>
                            </TabsList>
                            <div className="grid gap-6 pt-6">
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
                                 <div className="grid gap-2">
                                    <Label htmlFor="description">Description (Optional)</Label>
                                    <Textarea
                                        id="description"
                                        name="description"
                                        placeholder="e.g., A table to store customer information."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                </div>
                            </div>

                            <TabsContent value="manual" className="mt-6">
                               <div className="grid gap-4">
                                   <div>
                                        <Label>Columns</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Define the name, data type, and alignment for each column.
                                        </p>
                                   </div>
                                   <div className="space-y-4">
                                    {columns.map((col, index) => (
                                        <div key={col.id} className="grid grid-cols-1 md:grid-cols-[1fr_150px_120px_auto] items-center gap-2">
                                             <Input
                                                placeholder="Column name"
                                                value={col.name}
                                                onChange={(e) => updateColumn(col.id, 'name', e.target.value)}
                                                className="font-mono"
                                                required
                                            />
                                            <Select 
                                                value={col.type} 
                                                onValueChange={(value: ColumnType) => updateColumn(col.id, 'type', value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="text">Text</SelectItem>
                                                    <SelectItem value="number">Number</SelectItem>
                                                    <SelectItem value="date">Date</SelectItem>
                                                    <SelectItem value="gen_random_uuid()">UUID</SelectItem>
                                                    <SelectItem value="now_date()">Creation Date</SelectItem>
                                                    <SelectItem value="now_time()">Creation Time</SelectItem>
                                                </SelectContent>
                                            </Select>
                                             <Select 
                                                value={col.alignment} 
                                                onValueChange={(value: Alignment) => updateColumn(col.id, 'alignment', value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Alignment" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="left">Left</SelectItem>
                                                    <SelectItem value="center">Center</SelectItem>
                                                    <SelectItem value="right">Right</SelectItem>
                                                </SelectContent>
                                            </Select>
                                             <Button 
                                                variant="destructive" 
                                                size="icon" 
                                                onClick={() => removeColumn(col.id)} 
                                                type="button"
                                                disabled={index === 0}
                                                className="justify-self-end"
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
                            </TabsContent>
                            <TabsContent value="import" className="mt-6">
                                <div className="grid gap-4">
                                     <div>
                                        <Label>Upload CSV</Label>
                                        <p className="text-sm text-muted-foreground">
                                            The first row of the CSV will be used as column headers.
                                        </p>
                                    </div>
                                    <Input 
                                        type="file" 
                                        accept=".csv"
                                        ref={fileInputRef}
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                                        <Upload className="mr-2 h-4 w-4" />
                                        {csvFileName ? `Selected: ${csvFileName}` : "Choose a CSV file"}
                                    </Button>

                                    {csvContent && (
                                        <div className="grid gap-4">
                                            <div>
                                                <Label>Columns Detected</Label>
                                                <p className="text-sm text-muted-foreground">
                                                    Adjust data types and alignment as needed.
                                                </p>
                                            </div>
                                            <div className="space-y-4">
                                                {columns.map((col) => (
                                                    <div key={col.id} className="grid grid-cols-1 md:grid-cols-[1fr_150px_120px_auto] items-center gap-2">
                                                        <Input
                                                            value={col.name}
                                                            readOnly
                                                            className="font-mono bg-muted"
                                                        />
                                                        <Select 
                                                            value={col.type} 
                                                            onValueChange={(value: ColumnType) => updateColumn(col.id, 'type', value)}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Type" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="text">Text</SelectItem>
                                                                <SelectItem value="number">Number</SelectItem>
                                                                <SelectItem value="date">Date</SelectItem>
                                                                <SelectItem value="gen_random_uuid()">UUID</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <Select 
                                                            value={col.alignment} 
                                                            onValueChange={(value: Alignment) => updateColumn(col.id, 'alignment', value)}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Alignment" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="left">Left</SelectItem>
                                                                <SelectItem value="center">Center</SelectItem>
                                                                <SelectItem value="right">Right</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                         <div className="w-10 h-10 justify-self-end" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>
                        </Tabs>
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
