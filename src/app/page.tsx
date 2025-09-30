import { Button } from '@/components/ui/button';
import { Database } from 'lucide-react';
import Link from 'next/link';
import { GridBackground } from '@/components/background';

export default function Home() {
  return (
    <GridBackground>
      <div className="text-center space-y-6 max-w-2xl mx-auto px-4">
        <div className="inline-block p-4 bg-primary/10 rounded-xl">
          <Database className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-5xl font-bold tracking-tighter sm:text-6xl md:text-7xl">
          Welcome to <span className="text-primary">Fluxbase</span>
        </h1>
        <p className="text-lg text-muted-foreground md:text-xl">
          The modern, AI-powered spreadsheet and data analysis tool. Manage projects, create tables, and unlock insights with natural language queries.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/signup">Sign Up</Link>
          </Button>
        </div>
      </div>
    </GridBackground>
  );
}
