
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
import { type Column, type Constraint, type Table as DbTable } from '@/lib/data';
import { SubmitButton } from './submit-button';
import type React from 'react';
import { ForeignKeySelect } from './foreign-key-select';

type EditRowDialogProps = {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  projectId: string;
  tableId: string;
  tableName: string;
  columns: Column[];
  rowData: Record<string, any>;
  onRowUpdated: () => void;
  foreignKeyData: Record<string, any[]>;
  allTables: DbTable[];
  constraints: Constraint[];
};

export function EditRowDialog({
  isOpen,
  setIsOpen,
  projectId,
  tableId,
  tableName,
  columns,
  rowData,
  onRowUpdated,
  foreignKeyData,
  allTables,
  constraints,
}: EditRowDialogProps) {
  const { toast } = useToast();

  const handleAction = async (formData: FormData) => {
    const result = await editRowAction(formData);
    if (result.success) {
      toast({
        title: 'Success',
        description: 'Row updated successfully.',
      });
      setIsOpen(false);
      onRowUpdated();
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error || 'Failed to update row.',
      });
    }
  };

  const fkConstraints = constraints.filter(c => c.type === 'FOREIGN_KEY');

  const renderInput = (col: Column) => {
    const fkConstraint = fkConstraints.find(c => c.columnNames === col.name);

    if (fkConstraint && foreignKeyData[col.name]) {
        const refTable = allTables.find(t => t.id === fkConstraint.referencedTableId);
        const refColumn = fkConstraint.referencedColumnNames || 'id';

        let displayColumn = 'name'; // default
        const firstRow = foreignKeyData[col.name][0];
        if (firstRow) {
            if ('name' in firstRow) displayColumn = 'name';
            else if ('title' in firstRow) displayColumn = 'title';
            else if ('label' in firstRow) displayColumn = 'label';
            else if ('email' in firstRow) displayColumn = 'email';
        }

        return (
             <ForeignKeySelect
                name={col.name}
                data={foreignKeyData[col.name]}
                refTable={refTable}
                valueColumn={refColumn}
                displayColumn={displayColumn}
                defaultValue={rowData[col.name]}
            />
        )
    }

     return (
        <Input
            id={col.name}
            name={col.name}
            className="col-span-3"
            type={
            col.dataType === 'number'
                ? 'number'
                : col.dataType === 'date'
                ? 'date'
                : 'text'
            }
            defaultValue={rowData[col.name] || ''}
        />
     )
  }

  const visibleColumns = columns.filter(col => col.name !== 'id');

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
                key={col.id}
                className="grid grid-cols-4 items-center gap-4"
              >
                <Label htmlFor={col.name} className="text-right">
                  {col.name}
                </Label>
                {renderInput(col)}
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
