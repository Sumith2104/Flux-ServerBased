import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Folder, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"

const files = [
    { name: "Q3_sales_data.csv", type: "file", size: "2.3 MB", modified: "2023-09-28" },
    { name: "Archived Reports", type: "folder", size: "15.1 MB", modified: "2023-09-15" },
    { name: "User_data_export.json", type: "file", size: "800 KB", modified: "2023-09-22" },
    { name: "Marketing Assets", type: "folder", size: "128 MB", modified: "2023-08-30" },
];

export default function StoragePage() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Mock Storage</h1>
                    <p className="text-muted-foreground">
                        A user-friendly interface for file and folder management.
                    </p>
                </div>
                <Button>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload File
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>File Explorer</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Size</TableHead>
                                    <TableHead>Last Modified</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {files.map(file => (
                                    <TableRow key={file.name} className="cursor-pointer hover:bg-muted/50">
                                        <TableCell className="flex items-center gap-3 font-medium">
                                            {file.type === 'folder' ? <Folder className="h-5 w-5 text-primary" /> : <FileText className="h-5 w-5 text-muted-foreground" />}
                                            <span>{file.name}</span>
                                        </TableCell>
                                        <TableCell>{file.size}</TableCell>
                                        <TableCell>{file.modified}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
