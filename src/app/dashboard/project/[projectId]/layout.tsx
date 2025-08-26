import { getTablesForProject, Table } from "@/lib/data";
import { getCurrentUserId } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Nav } from "./nav";

export default async function ProjectLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: { projectId: string };
}) {
    const userId = await getCurrentUserId();
    let tables: Table[] = [];
    if (userId) {
        try {
            tables = await getTablesForProject(params.projectId);
        } catch (error) {
            console.error("Failed to fetch tables:", error);
        }
    }

    return (
        <div className="grid h-full w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
            <div className="hidden border-r bg-muted/40 md:block">
                <div className="flex h-full max-h-screen flex-col gap-2">
                    <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="h-6 w-6"><rect width="256" height="256" fill="none"></rect><line x1="208" y1="128" x2="48" y2="128" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></line><line x1="128" y1="208" x2="128" y2="48" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></line></svg>
                            <span className="">Project Home</span>
                        </Link>
                    </div>
                    <div className="flex-1">
                       <Nav projectId={params.projectId} tables={tables} />
                    </div>
                </div>
            </div>
            <div className="flex flex-col">
                <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
