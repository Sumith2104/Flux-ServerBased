
'use client';

import { useState } from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { SqlEditor } from '@/components/sql-editor';
import { QueryResults } from '@/components/query-results';
import { BackButton } from '@/components/back-button';

export default function QueryPage() {
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);

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
                <SqlEditor />
            </div>

            {/* Bottom part for the results */}
            <div className="flex-grow flex flex-col h-[50%]">
                <QueryResults />
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
