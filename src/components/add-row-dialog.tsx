
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
import { Plus } from 'lucide-react';
import { addRowAction } from '@/app/(app)/editor/actions';
import { useToast } from '@/hooks/use-toast';
import { type Column, type Constraint, type Table as DbTable } from '@/lib/data';
import { SubmitButton } from './submit-button';
import { useState }from 'react';
import { ForeignKeySelect } from './foreign-key-select';

type AddRowDialogProps = {
  projectId: string;
  tableId: string;
  tableName: string;
  columns: Column[];
  onRowAdded: () => void;
  foreignKeyData: Record<string, any[]>;
  allTables: DbTable[];
  constraints: Constraint[];
};

export function AddRowDialog({
  projectId,
  tableId,
  tableName,
  columns,
  onRowAdded,
  foreignKeyData,
  allTables,
  constraints
}: AddRowDialogProps) {
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
      onRowAdded();
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error || 'Failed to add row.',
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
        // A simple heuristic to find a good display column
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
            />
        )
    }
    return (
        <Input
            id={col.name}
            name={col.name}
            className="col-span-3"
            type={col.dataType === 'number' ? 'number' : col.dataType === 'date' ? 'date' : 'text'}
        />
    )
  }

  const visibleColumns = columns.filter(col => col.name !== 'id');

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
            Fill in the details for the new row. The 'id' will be generated automatically.
          </DialogDescription>
        </DialogHeader>
        <form action={handleAction}>
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="tableId" value={tableId} />
          <input type="hidden" name="tableName" value={tableName} />

          <div className="grid gap-4 py-4">
            {visibleColumns.map((col) => (
              <div key={col.id} className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor={col.name} className="text-right">
                  {col.name}
                </Label>
                {renderInput(col)}
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <SubmitButton type="submit">Add Row</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
