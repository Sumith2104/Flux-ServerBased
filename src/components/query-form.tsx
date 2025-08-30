
"use client";

import { useState } from "react";
import { generateSQL } from "@/ai/flows/generate-sql";
import { generateInsights } from "@/ai/flows/generate-insights";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BrainCircuit, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SubmitButton } from "./submit-button";

export function QueryForm() {
    const [query, setQuery] = useState("");
    const [sql, setSql] = useState("");
    const [insights, setInsights] = useState("");
    const [loading, setLoading] = useState(false);
    const [tableSchema, setTableSchema] = useState("");
    const [jsonData, setJsonData] = useState("");
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tableSchema || !jsonData || !query) {
            toast({
                variant: "destructive",
                title: "Missing Information",
                description: "Please provide a table schema, JSON data, and a question.",
            })
            return;
        }
        setLoading(true);
        setSql("");
        setInsights("");

        try {
            const sqlResult = await generateSQL({ userInput: query, tableSchema });
            setSql(sqlResult.sqlQuery);

            const insightsResult = await generateInsights({ data: jsonData, query });
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
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                     <Card>
                        <CardHeader>
                            <CardTitle>Table Schema</CardTitle>
                            <CardDescription>Provide the CREATE TABLE statement.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Textarea
                                placeholder="CREATE TABLE users (id INT, name VARCHAR(255), ...);"
                                value={tableSchema}
                                onChange={(e) => setTableSchema(e.target.value)}
                                rows={5}
                                className="text-sm font-mono"
                                required
                            />
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle>JSON Data</CardTitle>
                             <CardDescription>Provide the data as a JSON array.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                placeholder='[{"id": 1, "name": "Alice"}, ...]'
                                value={jsonData}
                                onChange={(e) => setJsonData(e.target.value)}
                                rows={5}
                                className="text-sm font-mono"
                                required
                            />
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Your Question</CardTitle>
                        <CardDescription>Ask a question in plain English about your data.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Textarea
                            placeholder="e.g., 'What are the total sales for each product?'"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            rows={3}
                            className="text-base"
                            required
                        />
                        <SubmitButton type="submit" disabled={loading}>
                            <BrainCircuit className="mr-2 h-4 w-4" />
                            Generate
                        </SubmitButton>
                    </CardContent>
                </Card>
            </form>
            
            {(sql || insights || loading) && (
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
            )}

        </div>
    );
}
