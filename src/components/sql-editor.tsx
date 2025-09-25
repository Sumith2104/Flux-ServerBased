'use client';

import { Play, Save, History, Download, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader } from './ui/card';

interface SqlEditorProps {
    query: string;
    setQuery: (query: string) => void;
    onRun: () => void;
    isGenerating: boolean;
}

export function SqlEditor({ query, setQuery, onRun, isGenerating }: SqlEditorProps) {
    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="p-2 border-b">
                 <div className="flex items-center gap-2">
                    <Button size="sm" onClick={onRun} disabled={isGenerating}>
                        {isGenerating ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Play className="h-4 w-4 mr-2" />
                        )}
                        Run
                    </Button>
                    <Separator orientation="vertical" className="h-6" />
                    <Button variant="ghost" size="sm">
                        <Save className="h-4 w-4 mr-2" />
                        Save
                    </Button>
                    <Button variant="ghost" size="sm">
                        <History className="h-4 w-4 mr-2" />
                        History
                    </Button>
                     <div className="flex-grow" />
                    <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0 flex-grow">
                <Textarea
                    placeholder="-- Ask a question about your data in plain English..."
                    className="h-full w-full border-none resize-none focus-visible:ring-0 focus-visible:ring-offset-0 font-mono text-base"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </CardContent>
        </Card>
    );
}
