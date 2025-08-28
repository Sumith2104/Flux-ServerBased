
'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Plus } from 'lucide-react';
import { addRowAction } from '@/app/(app)/editor/actions';
import { useToast } from '@/hooks/use-toast';
import { type Column } from '@/lib/data';
import { SubmitButton } from './submit-button';
import { useState } from 'react';

type AddRowDialogProps = {
  projectId: string;
  tableId: string;
  tableName: string;
  columns: Column[];
};

export function AddRowDialog({ projectId, tableId, tableName, columns }: AddRowDialogProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const handleAction = async (formData: FormData) => {
    const result = await addRowAction(formData);
    if (result.success) {
      toast({
        title: 'Success',
        description: 'Row added successfully.',
      });
      setIsOpen(false);
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error || 'Failed to add row.',
      });
    }
  };

  const visibleColumns = columns.filter(col => col.data_type !== 'gen_random_uuid()' && col.data_type !== 'now_date()' && col.data_type !== 'now_time()');

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Insert Row
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Row to `{tableName}`</DialogTitle>
          <DialogDescription>
            Fill in the details for the new row.
          </DialogDescription>
        </DialogHeader>
        <form action={handleAction}>
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="tableId" value={tableId} />
          <input type="hidden" name="tableName" value={tableName} />

          <div className="grid gap-4 py-4">
            {visibleColumns.map((col) => (
              <div key={col.column_id} className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor={col.column_name} className="text-right">
                  {col.column_name}
                </Label>
                <Input
                  id={col.column_name}
                  name={col.column_name}
                  className="col-span-3"
                  type={col.data_type === 'number' ? 'number' : col.data_type === 'date' ? 'date' : 'text'}
                />
              </div>
            ))}
          </div>

          <DialogFooter>
            <SubmitButton type="submit">Add Row</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
