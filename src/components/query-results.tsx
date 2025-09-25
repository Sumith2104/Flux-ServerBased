'use client';

import { Card, CardContent, CardHeader } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Skeleton } from './ui/skeleton';
import { AlertCircle } from 'lucide-react';

interface QueryResultsProps {
    results: { rows: any[], columns: string[] } | null;
    error: string | null;
    isGenerating: boolean;
}

export function QueryResults({ results, error, isGenerating }: QueryResultsProps) {
  
  const renderContent = () => {
    if (isGenerating) {
        return (
            <div className="p-4 space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-4/5" />
                <Skeleton className="h-8 w-2/3" />
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="p-4 flex items-center gap-4 text-destructive">
                <AlertCircle className="h-6 w-6" />
                <div className='font-mono text-sm'>
                    <p className='font-semibold'>Execution Failed</p>
                    <p>{error}</p>
                </div>
            </div>
        )
    }
    
    if (results) {
        if(results.rows.length === 0) {
             return (
                <div className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">Query executed successfully, but returned no rows.</p>
                </div>
            );
        }

        return (
            <div className="overflow-auto h-full">
                <Table>
                    <TableHeader className="sticky top-0 bg-card">
                        <TableRow>
                            {results.columns.map(col => <TableHead key={col}>{col}</TableHead>)}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {results.rows.map((row, rowIndex) => (
                             <TableRow key={rowIndex}>
                                {results.columns.map(col => <TableCell key={`${rowIndex}-${col}`}>{row[col]}</TableCell>)}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        );
    }
    
    return (
        <div className="overflow-auto h-full">
            <Table>
                <TableHeader className="sticky top-0 bg-card">
                    <TableRow>
                    <TableHead>Column 1</TableHead>
                    <TableHead>Column 2</TableHead>
                    <TableHead>Column 3</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow>
                        <TableCell colSpan={3} className="h-32 text-center">
                            <p className="text-muted-foreground">Run a query to see the results here.</p>
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </div>
    );
  };


  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="p-0">
        <Tabs defaultValue="results" className="w-full">
            <div className="px-4 py-2 border-b">
                <TabsList>
                    <TabsTrigger value="results">Results ({results?.rows?.length ?? 0})</TabsTrigger>
                    <TabsTrigger value="messages">Messages</TabsTrigger>
                    <TabsTrigger value="plan">Execution Plan</TabsTrigger>
                </TabsList>
            </div>
            <CardContent className="p-0 flex-grow overflow-hidden">
                <TabsContent value="results" className="m-0 h-full">
                   {renderContent()}
                </TabsContent>
                <TabsContent value="messages" className="m-0">
                    <div className="p-4 text-center">
                        <p className="text-sm text-muted-foreground">Execution messages will appear here.</p>
                    </div>
                </TabsContent>
                <TabsContent value="plan" className="m-0">
                     <div className="p-4 text-center">
                        <p className="text-sm text-muted-foreground">The query execution plan will appear here.</p>
                    </div>
                </TabsContent>
            </CardContent>
        </Tabs>
      </CardHeader>
    </Card>
  );
}
