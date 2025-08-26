
'use client';

import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createTableAction } from './actions';
import { SubmitButton } from '@/components/submit-button';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function CreateTablePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const projectId = searchParams.get('projectId');
    const { toast } = useToast();

    async function handleCreateTable(formData: FormData) {
        if (!projectId) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Project ID is missing. Cannot create table.",
            });
            return;
        }
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
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">Create New Table</CardTitle>
                    <CardDescription>Define the schema for your new table.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={handleCreateTable} className="grid gap-6">
                        <div className="grid gap-2">
                            <Label htmlFor="tableName">Table Name</Label>
                            <Input
                                id="tableName"
                                name="tableName"
                                placeholder="e.g., users"
                                required
                                className="font-mono"
                            />
                        </div>
                         <div className="grid gap-2">
                            <Label htmlFor="tableDescription">Description</Label>
                            <Textarea
                                id="tableDescription"
                                name="tableDescription"
                                placeholder="e.g., A table to store customer information."
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="columns">Columns</Label>
                             <Textarea
                                id="columns"
                                name="columns"
                                placeholder="id:number, name:text, email:text, created_at:date"
                                required
                                rows={4}
                                className="font-mono"
                            />
                            <p className="text-sm text-muted-foreground">
                                Enter column names and types, separated by commas. Supported types: text, number, date.
                            </p>
                        </div>
                        <SubmitButton type="submit" className="w-full">
                            Create Table
                        </SubmitButton>
                    </form>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
