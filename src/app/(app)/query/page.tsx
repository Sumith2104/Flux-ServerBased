import { QueryForm } from '@/components/query-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const tableSchema = `
CREATE TABLE sales (
    id INT PRIMARY KEY,
    product VARCHAR(255),
    quantity INT,
    price DECIMAL(10, 2),
    sale_date DATE
);`

const mockData = `
[
  {"id":1,"product":"Laptop","quantity":5,"price":1200.00,"sale_date":"2023-10-01"},
  {"id":2,"product":"Mouse","quantity":10,"price":25.00,"sale_date":"2023-10-01"},
  {"id":3,"product":"Keyboard","quantity":7,"price":75.50,"sale_date":"2023-10-02"},
  {"id":4,"product":"Monitor","quantity":3,"price":300.00,"sale_date":"2023-10-02"},
  {"id":5,"product":"Laptop","quantity":2,"price":1150.00,"sale_date":"2023-10-03"}
]
`

export default function QueryPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">AI SQL Translator</h1>
                <p className="text-muted-foreground">
                    Convert your plain English questions into SQL queries and get instant insights.
                </p>
            </div>
            <QueryForm tableSchema={tableSchema} data={mockData} />
        </div>
    )
}
