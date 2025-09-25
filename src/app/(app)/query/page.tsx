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
import { useToast } from '@/hooks/use-toast';

export default function QueryPage() {
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [query, setQuery] = useState('SELECT * FROM your_table_name LIMIT 100;');
  const [results, setResults] = useState<{ rows: any[], columns: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { project } = useContext(ProjectContext);
  const { toast } = useToast();

  const handleRunQuery = async () => {
    if (!query.trim()) {
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
    try {
      const response = await fetch('/api/execute-sql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: project.project_id,
          query: query,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'An unknown error occurred.');
      }
      
      setResults(result);

    } catch (e: any) {
      console.error("Failed to execute SQL:", e);
      setError(e.message);
      toast({ variant: 'destructive', title: 'Execution Error', description: e.message });
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
                  results={results}
                  error={error}
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
