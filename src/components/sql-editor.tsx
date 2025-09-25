
'use client';

import { Play, Save, History, Download } from 'lucide-react';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader } from './ui/card';

export function SqlEditor() {
    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="p-2 border-b">
                 <div className="flex items-center gap-2">
                    <Button size="sm">
                        <Play className="h-4 w-4 mr-2" />
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
                    placeholder="-- Write your SQL query here..."
                    className="h-full w-full border-none resize-none focus-visible:ring-0 focus-visible:ring-offset-0 font-mono text-base"
                />
            </CardContent>
        </Card>
    );
}
