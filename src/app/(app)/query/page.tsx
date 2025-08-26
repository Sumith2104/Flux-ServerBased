import { QueryForm } from '@/components/query-form'

export default function QueryPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">AI SQL Translator</h1>
                <p className="text-muted-foreground">
                    Convert your plain English questions into SQL queries and get instant insights.
                </p>
            </div>
            <QueryForm />
        </div>
    )
}
