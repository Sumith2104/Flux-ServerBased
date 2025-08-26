import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function ApiPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">API Generation</h1>
                <p className="text-muted-foreground">
                    Automatically generated REST API endpoints for your tables.
                </p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Sales Table API</CardTitle>
                    <CardDescription>Endpoints for the 'sales' table.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <h3 className="font-semibold">GET /api/sales</h3>
                        <p className="text-sm text-muted-foreground">Retrieve all records from the sales table.</p>
                        <pre className="mt-2 p-4 rounded-md bg-secondary text-secondary-foreground text-sm overflow-x-auto"><code>curl https://api.spreadsheetai.app/v1/sales</code></pre>
                    </div>
                    <div>
                        <h3 className="font-semibold">GET /api/sales/:id</h3>
                        <p className="text-sm text-muted-foreground">Retrieve a single record by ID.</p>
                        <pre className="mt-2 p-4 rounded-md bg-secondary text-secondary-foreground text-sm overflow-x-auto"><code>curl https://api.spreadsheetai.app/v1/sales/1</code></pre>
                    </div>
                    <div>
                        <h3 className="font-semibold">POST /api/sales</h3>
                        <p className="text-sm text-muted-foreground">Create a new record.</p>
                        <pre className="mt-2 p-4 rounded-md bg-secondary text-secondary-foreground text-sm overflow-x-auto"><code>{`curl -X POST \\
-H "Content-Type: application/json" \\
-d '{"product":"New Item","quantity":10}' \\
https://api.spreadsheetai.app/v1/sales`}</code></pre>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
