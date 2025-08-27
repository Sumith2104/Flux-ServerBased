import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { FileCode } from "lucide-react";
import { BackButton } from "@/components/back-button";

export default function ApiPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <BackButton />
                <div>
                    <h1 className="text-3xl font-bold">API Generation</h1>
                    <p className="text-muted-foreground">
                        Automatically generated REST API endpoints for your tables.
                    </p>
                </div>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>API Endpoints</CardTitle>
                    <CardDescription>Select a table to view its generated API endpoints.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-48 border-2 border-dashed rounded-lg">
                        <FileCode className="h-12 w-12 mb-4" />
                        <p className="text-lg font-medium">No Table Selected</p>
                        <p>Your API endpoints will appear here once you select a table.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
