import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, ChevronRight, LayoutGrid, List, Filter } from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

const projects = [
  { name: "Dip_project", description: "aws | ap-south-1", tag: "NAND" },
  { name: "Sumith@gymtrack", description: "aws | ap-south-1", tag: "NAND" },
]

export default function DashboardPage() {
    return (
        <div className="container mx-auto px-0">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Projects</h1>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon">
                        <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                        <List className="h-4 w-4" />
                    </Button>
                    <Button style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
                        <Plus className="mr-2 h-4 w-4" />
                        New project
                    </Button>
                </div>
            </div>
            <div className="mb-6 flex items-center gap-2">
                <div className="relative flex-1">
                    <Input placeholder="Search for a project" className="pr-10" />
                </div>
                <Button variant="outline">
                    <Filter className="mr-2 h-4 w-4" />
                    Filter
                </Button>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {projects.map((project) => (
                    <Card key={project.name} className="flex flex-col group">
                       <CardHeader className="flex-row items-center justify-between pb-2">
                            <CardTitle className="text-base font-medium">{project.name}</CardTitle>
                            <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                        </CardHeader>
                        <CardContent className="flex-grow pt-0">
                            <p className="text-sm text-muted-foreground">{project.description}</p>
                            <Badge variant="secondary" className="mt-4">{project.tag}</Badge>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
