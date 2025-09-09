
'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { editRowAction } from '@/app/(app)/editor/actions';
import { useToast } from '@/hooks/use-toast';
import { type Column } from '@/lib/data';
import { SubmitButton } from './submit-button';
import type React from 'react';
import { useRouter } from 'next/navigation';

type EditRowDialogProps = {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  projectId: string;
  tableId: string;
  tableName: string;
  columns: Column[];
  rowData: Record<string, any>;
};

export function EditRowDialog({
  isOpen,
  setIsOpen,
  projectId,
  tableId,
  tableName,
  columns,
  rowData,
}: EditRowDialogProps) {
  const { toast } = useToast();
  const router = useRouter();

  const handleAction = async (formData: FormData) => {
    const result = await editRowAction(formData);
    if (result.success) {
      toast({
        title: 'Success',
        description: 'Row updated successfully.',
      });
      setIsOpen(false);
      router.refresh();
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error || 'Failed to update row.',
      });
    }
  };

  const visibleColumns = columns.filter(
    (col) => col.column_name !== 'id' && col.data_type !== 'gen_random_uuid()'
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Row in `{tableName}`</DialogTitle>
          <DialogDescription>
            Modify the values and click save.
          </DialogDescription>
        </DialogHeader>
        <form action={handleAction}>
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="tableId" value={tableId} />
          <input type="hidden" name="tableName" value={tableName} />
          <input type="hidden" name="rowId" value={rowData.id} />

          <div className="grid gap-4 py-4">
            {visibleColumns.map((col) => (
              <div
                key={col.column_id}
                className="grid grid-cols-4 items-center gap-4"
              >
                <Label htmlFor={col.column_name} className="text-right">
                  {col.column_name}
                </Label>
                <Input
                  id={col.column_name}
                  name={col.column_name}
                  className="col-span-3"
                  type={
                    col.data_type === 'number'
                      ? 'number'
                      : col.data_type === 'date'
                      ? 'date'
                      : 'text'
                  }
                  defaultValue={rowData[col.column_name] || ''}
                />
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <SubmitButton type="submit">Save Changes</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
