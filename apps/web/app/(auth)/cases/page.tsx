import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export default function CasesPage() {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cases</h1>
          <p className="text-muted-foreground">Manage all your trial cases</p>
        </div>
        <Link href="/cases/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Case
          </Button>
        </Link>
      </div>

      {/* Cases List */}
      <div className="space-y-4">
        <div className="rounded-lg border bg-card p-6">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold">Johnson v. TechCorp Industries</h3>
              <p className="text-sm text-muted-foreground">Case #2024-CV-12345</p>
            </div>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              Active
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">Trial Date</p>
              <p className="font-medium">March 15, 2026</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Jurors</p>
              <p className="font-medium">5 in panel</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Last Updated</p>
              <p className="font-medium">2 hours ago</p>
            </div>
          </div>
          <div className="mt-4 flex space-x-2">
            <Link href="/cases/2024-CV-12345">
              <Button variant="outline" size="sm">
                View Details
              </Button>
            </Link>
            <Link href="/cases/2024-CV-12345/jury-panel">
              <Button variant="outline" size="sm">
                Jury Panel
              </Button>
            </Link>
          </div>
        </div>

        {/* More cases would be listed here */}
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          <p>Create your first case to get started with TrialForge AI</p>
          <Link href="/cases/new">
            <Button className="mt-4">Create Case</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
