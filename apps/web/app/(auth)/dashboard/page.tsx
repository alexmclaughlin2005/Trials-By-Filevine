import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Briefcase, Users, TrendingUp, Clock } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your trial preparation.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <StatCard
          title="Active Cases"
          value="3"
          icon={<Briefcase className="h-4 w-4" />}
          trend="+1 this month"
        />
        <StatCard
          title="Total Jurors"
          value="45"
          icon={<Users className="h-4 w-4" />}
          trend="Across all panels"
        />
        <StatCard
          title="Personas"
          value="12"
          icon={<TrendingUp className="h-4 w-4" />}
          trend="3 system, 9 custom"
        />
        <StatCard
          title="Upcoming Trials"
          value="2"
          icon={<Clock className="h-4 w-4" />}
          trend="Next in 14 days"
        />
      </div>

      {/* Recent Cases */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Recent Cases</h2>
          <Link href="/cases">
            <Button variant="outline">View All Cases</Button>
          </Link>
        </div>
        <div className="space-y-4">
          <CaseCard
            name="Johnson v. TechCorp Industries"
            caseNumber="2024-CV-12345"
            trialDate="March 15, 2026"
            status="active"
            jurorCount={5}
          />
          <CaseCard
            name="Smith v. Medical Center"
            caseNumber="2024-CV-11234"
            trialDate="April 22, 2026"
            status="active"
            jurorCount={8}
          />
          <CaseCard
            name="Davis Employment Dispute"
            caseNumber="2024-CV-10123"
            trialDate="May 10, 2026"
            status="active"
            jurorCount={12}
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 text-2xl font-semibold">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Link href="/cases/new">
            <Button variant="outline" className="h-24 w-full">
              <div className="text-center">
                <Briefcase className="mx-auto mb-2 h-6 w-6" />
                <div className="font-semibold">Create New Case</div>
              </div>
            </Button>
          </Link>
          <Link href="/personas">
            <Button variant="outline" className="h-24 w-full">
              <div className="text-center">
                <Users className="mx-auto mb-2 h-6 w-6" />
                <div className="font-semibold">Manage Personas</div>
              </div>
            </Button>
          </Link>
          <Link href="/focus-groups/new">
            <Button variant="outline" className="h-24 w-full">
              <div className="text-center">
                <TrendingUp className="mx-auto mb-2 h-6 w-6" />
                <div className="font-semibold">Run Focus Group</div>
              </div>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  trend,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        {icon}
      </div>
      <div className="text-3xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{trend}</p>
    </div>
  );
}

function CaseCard({
  name,
  caseNumber,
  trialDate,
  status,
  jurorCount,
}: {
  name: string;
  caseNumber: string;
  trialDate: string;
  status: string;
  jurorCount: number;
}) {
  return (
    <Link href={`/cases/${caseNumber}`}>
      <div className="rounded-lg border bg-card p-6 transition-colors hover:bg-accent">
        <div className="mb-2 flex items-start justify-between">
          <div>
            <h3 className="font-semibold">{name}</h3>
            <p className="text-sm text-muted-foreground">{caseNumber}</p>
          </div>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            {status}
          </span>
        </div>
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <span>Trial: {trialDate}</span>
          <span>•</span>
          <span>{jurorCount} jurors</span>
        </div>
      </div>
    </Link>
  );
}
