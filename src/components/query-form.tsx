"use client";

import { useState } from "react";
import { generateSQL } from "@/ai/flows/generate-sql";
import { generateInsights } from "@/ai/flows/generate-insights";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BrainCircuit, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Props = {
    tableSchema: string;
    data: string;
}

export function QueryForm({ tableSchema, data }: Props) {
    const [query, setQuery] = useState("");
    const [sql, setSql] = useState("");
    const [insights, setInsights] = useState("");
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    // Mock results for demonstration purposes
    const mockResults = [
        { product: 'Laptop', total_quantity: 7, total_revenue: 8350.00 },
        { product: 'Mouse', total_quantity: 10, total_revenue: 250.00 },
        { product: 'Keyboard', total_quantity: 7, total_revenue: 528.50 },
        { product: 'Monitor', total_quantity: 3, total_revenue: 900.00 },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setSql("");
        setInsights("");

        try {
            const sqlResult = await generateSQL({ userInput: query, tableSchema });
            setSql(sqlResult.sqlQuery);

            const insightsResult = await generateInsights({ data, query });
            setInsights(insightsResult.insights);
        } catch (err) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to generate SQL or insights. Please try again.",
            })
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Your Question</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Textarea
                            placeholder="e.g., 'What are the total sales for each product?'"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            rows={3}
                            className="text-base"
                        />
                        <Button type="submit" disabled={loading || !query}>
                            {loading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <BrainCircuit className="mr-2 h-4 w-4" />
                            )}
                            Generate
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Generated SQL</CardTitle>
                        <CardDescription>The AI-generated SQL query.</CardDescription>
                    </CardHeader>
                    <CardContent className="min-h-[100px]">
                        {loading && !sql && <div className="text-muted-foreground flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating...</div>}
                        {sql && <pre className="p-4 rounded-md bg-secondary text-secondary-foreground text-sm overflow-x-auto"><code>{sql}</code></pre>}
                        {!loading && !sql && <div className="text-muted-foreground">SQL will appear here.</div>}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>AI Insights</CardTitle>
                        <CardDescription>Analysis based on your query.</CardDescription>
                    </CardHeader>
                    <CardContent className="min-h-[100px]">
                        {loading && !insights && <div className="text-muted-foreground flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating...</div>}
                        {insights && <p className="text-sm">{insights}</p>}
                        {!loading && !insights && <div className="text-muted-foreground">Insights will appear here.</div>}
                    </CardContent>
                </Card>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Query Results</CardTitle>
                    <CardDescription>The data returned from your query.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Total Quantity</TableHead>
                                    <TableHead>Total Revenue</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {mockResults.map((row, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{row.product}</TableCell>
                                        <TableCell>{row.total_quantity}</TableCell>
                                        <TableCell>${row.total_revenue.toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    <p className="text-sm text-muted-foreground mt-4">Note: Query result display is mocked for demonstration.</p>
                </CardContent>
            </Card>
        </div>
    );
}
