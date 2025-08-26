import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import Link from "next/link"

const projects = [
  { name: "Q3 Sales Report", description: "Analysis of sales data for the third quarter.", lastUpdated: "2 hours ago" },
  { name: "User Engagement Metrics", description: "Tracking user activity and engagement.", lastUpdated: "1 day ago" },
  { name: "Inventory Management", description: "Spreadsheet for tracking product inventory.", lastUpdated: "5 days ago" },
]

export default function DashboardPage() {
    return (
        <div className="container mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Projects</h1>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Project
                </Button>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                    <Card key={project.name} className="flex flex-col">
                        <CardHeader>
                            <CardTitle>{project.name}</CardTitle>
                            <CardDescription>{project.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <p className="text-sm text-muted-foreground">Last updated: {project.lastUpdated}</p>
                        </CardContent>
                        <CardFooter>
                            <Button variant="secondary" className="w-full" asChild>
                                <Link href="/editor">Open</Link>
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    )
}
