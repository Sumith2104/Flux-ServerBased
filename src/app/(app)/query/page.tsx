import { BackButton } from '@/components/back-button';

export default function QueryPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <BackButton />
        <div>
          <h1 className="text-3xl font-bold">AI SQL Translator</h1>
          <p className="text-muted-foreground">
            Convert your plain English questions into SQL queries and get
            instant insights.
          </p>
        </div>
      </div>
      {/* The new design for the AI SQL Translator will go here. */}
      <div className="flex h-96 w-full items-center justify-center rounded-lg border-2 border-dashed">
        <p className="text-muted-foreground">
          AI SQL Translator content goes here.
        </p>
      </div>
    </div>
  );
}
