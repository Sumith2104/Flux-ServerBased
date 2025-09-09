
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signupAction } from '../actions';
import { SubmitButton } from '@/components/submit-button';
import { useToast } from '@/hooks/use-toast';


export default function SignupPage() {
    const router = useRouter();
    const { toast } = useToast();

    async function handleSignup(formData: FormData) {
        const result = await signupAction(formData);
        if (result.success) {
            router.push('/dashboard');
            router.refresh();
        } else {
            toast({
                variant: 'destructive',
                title: 'Signup Failed',
                description: result.error,
            });
        }
    }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="mx-auto w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Sign Up</CardTitle>
          <CardDescription>Enter your information to create an account</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSignup} className="grid gap-4">
            <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                id="email"
                type="email"
                name="email"
                placeholder="m@example.com"
                required
                />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" required/>
            </div>
            <SubmitButton type="submit" className="w-full">
                Create an account
            </SubmitButton>
            </form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link href="/login" className="underline">
              Log in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
