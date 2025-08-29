
'use client';

import { useState, useRef, ChangeEvent } from 'react';
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
import { Upload } from 'lucide-react';
import { importCsvAction } from '@/app/(app)/editor/actions';
import { useToast } from '@/hooks/use-toast';
import { type Column } from '@/lib/data';
import { SubmitButton } from './submit-button';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

type ImportCsvDialogProps = {
  projectId: string;
  tableId: string;
  tableName: string;
  columns: Column[];
};

export function ImportCsvDialog({ projectId, tableId, tableName, columns }: ImportCsvDialogProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [csvContent, setCsvContent] = useState<string | null>(null);
  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setCsvContent(text);
        setCsvFileName(file.name);
      };
      reader.readAsText(file);
    }
  };

  const handleAction = async (formData: FormData) => {
    if (!csvContent) {
      toast({
        variant: 'destructive',
        title: 'No File Selected',
        description: 'Please select a CSV file to import.',
      });
      return;
    }
    formData.set('csvContent', csvContent);

    const result = await importCsvAction(formData);
    if (result.success) {
      toast({
        title: 'Success',
        description: `${result.importedCount} rows imported successfully.`,
      });
      setIsOpen(false);
      setCsvContent(null);
      setCsvFileName(null);
    } else {
      toast({
        variant: 'destructive',
        title: 'Import Failed',
        description: result.error || 'An unexpected error occurred.',
        duration: 10000, // Show error for longer
      });
    }
  };

  const expectedHeader = columns.map(c => c.column_name).join(', ');

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="mr-2 h-4 w-4" />
          Import
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Data into `{tableName}`</DialogTitle>
          <DialogDescription>
            Upload a CSV file to add new rows to this table. The file must have a header row that matches the table structure exactly.
          </DialogDescription>
        </DialogHeader>
        <form action={handleAction}>
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="tableId" value={tableId} />
          <input type="hidden" name="tableName" value={tableName} />

          <div className="grid gap-4 py-4">
             <Alert>
                <AlertTitle>Required CSV Header</AlertTitle>
                <AlertDescription className="font-mono text-xs">
                    {expectedHeader}
                </AlertDescription>
            </Alert>
            <div>
              <Label htmlFor="csvFile" className="sr-only">
                CSV File
              </Label>
              <Input
                id="csvFile"
                type="file"
                accept=".csv"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
              />
              <Button type="button" variant="outline" className='w-full' onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                {csvFileName ? `Selected: ${csvFileName}` : "Choose a CSV file"}
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <SubmitButton type="submit" disabled={!csvContent}>Import Data</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
