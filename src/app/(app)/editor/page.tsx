import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { PlusCircle, Trash2 } from "lucide-react"

const data = [
  { id: 1, product: 'Laptop', quantity: 15, price: 1200 },
  { id: 2, product: 'Mouse', quantity: 150, price: 25 },
  { id: 3, product: 'Keyboard', quantity: 75, price: 70 },
  { id: 4, product: 'Monitor', quantity: 50, price: 300 },
]

export default function EditorPage() {
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Table Editor</h1>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Row
                </Button>
            </div>
            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">ID</TableHead>
                            <TableHead>Product</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Price ($)</TableHead>
                            <TableHead className="w-[100px] text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((row) => (
                            <TableRow key={row.id}>
                                <TableCell className="font-medium">{row.id}</TableCell>
                                <TableCell><Input defaultValue={row.product} className="bg-transparent border-0 focus-visible:ring-1 focus-visible:ring-ring" /></TableCell>
                                <TableCell><Input type="number" defaultValue={row.quantity} className="bg-transparent border-0 focus-visible:ring-1 focus-visible:ring-ring" /></TableCell>
                                <TableCell><Input type="number" defaultValue={row.price} className="bg-transparent border-0 focus-visible:ring-1 focus-visible:ring-ring" /></TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon">
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
