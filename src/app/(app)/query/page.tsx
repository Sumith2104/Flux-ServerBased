'use client';

import { useState, useContext, useEffect } from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { SqlEditor } from '@/components/sql-editor';
import { QueryResults } from '@/components/query-results';
import { BackButton } from '@/components/back-button';
import { ProjectContext } from '@/contexts/project-context';
import { getTablesForProject, getColumnsForTable, Table as DbTable, Column as DbColumn } from '@/lib/data';
import { generateSQL } from '@/ai/flows/generate-sql';
import { useToast } from '@/hooks/use-toast';

export default function QueryPage() {
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [generatedSql, setGeneratedSql] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [schema, setSchema] = useState('');
  const { project } = useContext(ProjectContext);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchSchema() {
      if (!project) return;

      try {
        const tables = await getTablesForProject(project.project_id);
        let fullSchema = '';
        for (const table of tables) {
          const columns = await getColumnsForTable(project.project_id, table.table_id);
          const columnDefs = columns.map(c => `${c.column_name} ${c.data_type}`).join(', ');
          fullSchema += `Table ${table.table_name} (${columnDefs});\n`;
        }
        setSchema(fullSchema);
      } catch (error) {
        console.error("Failed to fetch table schema:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load table schemas.' });
      }
    }

    fetchSchema();
  }, [project, toast]);

  const handleRunQuery = async () => {
    if (!query.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Query cannot be empty.' });
      return;
    }
    if (!schema) {
      toast({ variant: 'destructive', title: 'Error', description: 'Table schema is not loaded yet. Please wait and try again.' });
      return;
    }
    
    setIsGenerating(true);
    setGeneratedSql('');
    try {
      const result = await generateSQL({ userInput: query, tableSchema: schema });
      setGeneratedSql(result.sqlQuery);
    } catch (error) {
      console.error("Failed to generate SQL:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to generate SQL from your query.' });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-[calc(100vh-57px)] flex flex-col">
       <header className="flex-shrink-0 flex items-center gap-4 px-4 py-2 border-b">
        <BackButton />
        <div>
            <h1 className="text-xl font-bold">SQL Editor</h1>
        </div>
      </header>
      
      <div className="flex-grow p-4 grid grid-cols-1 lg:grid-cols-3 gap-4 h-full overflow-hidden">
        {/* Main content area */}
        <div className="lg:col-span-2 flex flex-col gap-4 h-full">
            {/* Top part for the SQL editor */}
            <div className="flex-grow flex flex-col h-[50%]">
                <SqlEditor 
                  onRun={handleRunQuery}
                  query={query}
                  setQuery={setQuery}
                  isGenerating={isGenerating}
                />
            </div>

            {/* Bottom part for the results */}
            <div className="flex-grow flex flex-col h-[50%]">
                <QueryResults
                  generatedSql={generatedSql}
                  isGenerating={isGenerating}
                />
            </div>
        </div>

        {/* AI Assistant Sidebar */}
        <div className="hidden lg:flex flex-col rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="p-4 border-b">
                <h3 className="font-semibold">AI Assistant</h3>
            </div>
            <div className="flex-grow p-4 flex items-center justify-center">
                 <p className="text-sm text-muted-foreground text-center">AI chat will be available here.</p>
            </div>
        </div>
      </div>
    </div>
  );
}
