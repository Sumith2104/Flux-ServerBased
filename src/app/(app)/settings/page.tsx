import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"

export default function SettingsPage() {
    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold">Settings</h1>
                <p className="text-muted-foreground">
                    Manage project settings and view logs.
                </p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Project Configuration</CardTitle>
                    <CardDescription>Adjust settings for the current project.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="project-name">Project Name</Label>
                        <Input id="project-name" defaultValue="Q3 Sales Report" />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                            <Label htmlFor="public-access">Enable Public Access</Label>
                            <p className="text-sm text-muted-foreground">Allow anyone with the link to view this project.</p>
                        </div>
                        <Switch id="public-access" />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                            <Label htmlFor="ai-assist">Enable AI Assistance</Label>
                             <p className="text-sm text-muted-foreground">Use AI to generate SQL, insights, and more.</p>
                        </div>
                        <Switch id="ai-assist" defaultChecked />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button>Save Changes</Button>
                </CardFooter>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Event Logs</CardTitle>
                    <CardDescription>A simple log display of recent activities.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="font-mono text-sm space-y-2 bg-secondary p-4 rounded-md max-h-60 overflow-y-auto">
                        <p><span className="text-primary">[INFO]</span> User logged in.</p>
                        <p><span className="text-primary">[INFO]</span> Opened project 'Q3 Sales Report'.</p>
                        <p><span className="text-primary">[SUCCESS]</span> Ran AI query: 'total sales'.</p>
                        <p><span className="text-muted-foreground">[WARN]</span> High memory usage detected.</p>
                        <p><span className="text-destructive">[ERROR]</span> Failed to connect to database.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
