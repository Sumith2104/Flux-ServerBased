
"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import type { Column } from '@/lib/data';
import { addRowAction } from '@/app/(app)/editor/actions';
import { useToast } from "@/hooks/use-toast";
import { SubmitButton } from './submit-button';

interface AddRowDialogProps {
    columns: Column[];
    projectId: string;
    tableName: string;
}

export function AddRowDialog({ columns, projectId, tableName }: AddRowDialogProps) {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();

    const handleFormAction = async (formData: FormData) => {
        const result = await addRowAction(formData);
        if (result.success) {
            toast({ title: "Success", description: "Row added successfully." });
            setOpen(false);
        } else {
            toast({
                variant: "destructive",
                title: "Error",
                description: result.error || "Failed to add row.",
            });
        }
    };

    const getInputType = (dataType: string) => {
        switch (dataType) {
            case 'number':
                return 'number';
            case 'date':
                return 'date';
            default:
                return 'text';
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Row
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Row to &quot;{tableName}&quot;</DialogTitle>
                    <DialogDescription>
                        Fill in the details for the new row. Click save when you&apos;re done.
                    </DialogDescription>
                </DialogHeader>
                <form action={handleFormAction}>
                    <input type="hidden" name="projectId" value={projectId} />
                    <input type="hidden" name="tableName" value={tableName} />
                    <input type="hidden" name="columns" value={JSON.stringify(columns)} />
                    <div className="grid gap-4 py-4">
                        {columns.map((col) => (
                            <div className="grid grid-cols-4 items-center gap-4" key={col.column_id}>
                                <Label htmlFor={col.column_name} className="text-right">
                                    {col.column_name}
                                </Label>
                                <Input
                                    id={col.column_name}
                                    name={col.column_name}
                                    type={getInputType(col.data_type)}
                                    className="col-span-3"
                                    required
                                />
                            </div>
                        ))}
                    </div>
                    <DialogFooter>
                        <SubmitButton type="submit">Save changes</SubmitButton>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
