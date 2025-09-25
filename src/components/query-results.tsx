'use client';

import { Card, CardContent, CardHeader } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Skeleton } from './ui/skeleton';

interface QueryResultsProps {
    generatedSql: string;
    isGenerating: boolean;
}

export function QueryResults({ generatedSql, isGenerating }: QueryResultsProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="p-0">
        <Tabs defaultValue="results" className="w-full">
            <div className="px-4 py-2 border-b">
                <TabsList>
                    <TabsTrigger value="results">Results</TabsTrigger>
                    <TabsTrigger value="messages">Messages</TabsTrigger>
                    <TabsTrigger value="plan">Execution Plan</TabsTrigger>
                </TabsList>
            </div>
            <CardContent className="p-0 flex-grow overflow-hidden">
                <TabsContent value="results" className="m-0 h-full">
                    {isGenerating ? (
                        <div className="p-4 space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-2/3" />
                            <Skeleton className="h-4 w-1/2" />
                        </div>
                    ) : generatedSql ? (
                        <div className="font-mono text-sm p-4 overflow-auto h-full bg-muted/50 rounded-b-lg">
                           <pre><code>{generatedSql}</code></pre>
                        </div>
                    ) : (
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
                    )}
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
