import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createProjectAction } from '@/components/layout/actions';
import { redirect } from 'next/navigation';
import { SubmitButton } from '@/components/submit-button';
import { ArrowLeft } from 'lucide-react';

export default function CreateProjectPage() {

    async function handleCreateProject(formData: FormData) {
        'use server';
        const result = await createProjectAction(formData);
        if (result.success) {
            redirect(`/dashboard`);
        } else {
            console.error(result.error);
            redirect('/dashboard/projects/create?error=' + encodeURIComponent(result.error || ''));
        }
    }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
            <Button variant="ghost" asChild className="mb-4">
                <Link href="/dashboard">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Link>
            </Button>
            <Card>
                <CardHeader>
                <CardTitle className="text-2xl">Create New Project</CardTitle>
                <CardDescription>Enter a name for your new project to get started.</CardDescription>
                </CardHeader>
                <CardContent>
                <form action={handleCreateProject} className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="projectName">Project Name</Label>
                        <Input
                            id="projectName"
                            name="projectName"
                            placeholder="e.g., Q4 Marketing Analysis"
                            required
                        />
                    </div>
                    <SubmitButton type="submit" className="w-full">
                        Create Project
                    </SubmitButton>
                </form>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
