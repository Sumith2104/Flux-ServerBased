
'use client';

import { useState, useContext, useEffect, useCallback } from 'react';
import { PanelLeftClose, PanelLeftOpen, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { SqlEditor } from '@/components/sql-editor';
import { QueryResults } from '@/components/query-results';
import { BackButton } from '@/components/back-button';
import { ProjectContext } from '@/contexts/project-context';
import { useToast } from '@/hooks/use-toast';
import { getTablesForProject, getColumnsForTable, Table as DbTable, Column as DbColumn } from '@/lib/data';
import { generateSQL, GenerateSQLInput } from '@/ai/flows/generate-sql';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function QueryPage() {
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [query, setQuery] = useState('SELECT * FROM your_table_name LIMIT 100;');
  const [results, setResults] = useState<{ rows: any[], columns: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [tables, setTables] = useState<DbTable[]>([]);
  const [columns, setColumns] = useState<DbColumn[]>([]);

  const { project } = useContext(ProjectContext);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchSchema() {
      if (project) {
        const projectTables = await getTablesForProject(project.project_id);
        setTables(projectTables);
        const allColumns = await Promise.all(
          projectTables.map(t => getColumnsForTable(project.project_id, t.table_id))
        );
        setColumns(allColumns.flat());
      }
    }
    fetchSchema();
  }, [project]);

  const handleRunQuery = useCallback(async () => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      toast({ variant: 'destructive', title: 'Error', description: 'Query cannot be empty.' });
      return;
    }
    if (!project) {
      toast({ variant: 'destructive', title: 'Error', description: 'No project selected.' });
      return;
    }
    
    setIsGenerating(true);
    setResults(null);
    setError(null);
    
    let queryToExecute = trimmedQuery;

    // Basic check if it's natural language (doesn't start with SELECT, INSERT, etc.)
    const isNaturalLanguage = !/^(select|insert|update|delete|create|alter|drop|with)\s/i.test(trimmedQuery);

    try {
        if (isNaturalLanguage) {
            toast({ title: 'AI Generating SQL...', description: 'Please wait while we convert your question to SQL.' });
            
            const tableSchema = tables.map(table => {
                const tableColumns = columns
                    .filter(c => c.table_id === table.table_id)
                    .map(c => `${c.column_name} ${c.data_type}`)
                    .join(', ');
                return `Table ${table.table_name} (${tableColumns})`;
            }).join('\n');

            const input: GenerateSQLInput = {
                userInput: trimmedQuery,
                tableSchema: tableSchema
            };
            const result = await generateSQL(input);
            queryToExecute = result.sqlQuery;
            setQuery(queryToExecute); // Update editor with generated SQL
        }

        const response = await fetch('/api/execute-sql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectId: project.project_id, query: queryToExecute }),
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'An unknown error occurred.');
        setResults(result);

    } catch (e: any) {
        console.error("Failed to execute query:", e);
        const errorMessage = e.message || "An unexpected error occurred.";
        setError(errorMessage);
        toast({ variant: 'destructive', title: 'Execution Error', description: errorMessage });
    } finally {
        setIsGenerating(false);
    }
  }, [query, project, toast, tables, columns]);

  return (
    <div className="h-[calc(100vh-57px)] flex flex-col">
       <header className="flex-shrink-0 flex items-center gap-4 px-4 py-2 border-b">
        <BackButton />
        <div>
            <h1 className="text-xl font-bold">SQL Editor</h1>
        </div>
        <div className="ml-auto">
             <Sheet open={isAiAssistantOpen} onOpenChange={setIsAiAssistantOpen}>
                <SheetTrigger asChild>
                    <Button variant="outline">
                        <Bot className="mr-2 h-4 w-4" />
                        AI Assistant
                    </Button>
                </SheetTrigger>
                <SheetContent className="w-[400px] sm:w-[540px]">
                    <SheetHeader>
                        <SheetTitle>AI Assistant</SheetTitle>
                    </SheetHeader>
                    <div className="py-4 h-full flex flex-col">
                        <Alert>
                          <Bot className="h-4 w-4" />
                          <AlertTitle>How can I help?</AlertTitle>
                          <AlertDescription>
                            You can ask me to generate a query, explain an error, or optimize your SQL. Just type in the main editor!
                          </AlertDescription>
                        </Alert>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
      </header>
      
      <div className="flex-grow p-4 grid grid-cols-1 lg:grid-cols-3 gap-4 h-full overflow-hidden">
        {/* Main content area */}
        <div className="lg:col-span-3 flex flex-col gap-4 h-full">
            {/* Top part for the SQL editor */}
            <div className="flex-grow flex flex-col h-[40%]">
                <SqlEditor 
                  onRun={handleRunQuery}
                  query={query}
                  setQuery={setQuery}
                  isGenerating={isGenerating}
                  results={results}
                />
            </div>

            {/* Bottom part for the results */}
            <div className="flex-grow flex flex-col h-[60%]">
                <QueryResults
                  results={results}
                  error={error}
                  isGenerating={isGenerating}
                />
            </div>
        </div>
      </div>
    </div>
  );
}
