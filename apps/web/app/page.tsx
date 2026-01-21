import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold">TrialForge AI</h1>
          </div>
          <nav className="flex items-center space-x-4">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="container mx-auto px-4 py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-6 text-5xl font-bold tracking-tight">
              Transform Jury Selection
              <br />
              <span className="text-primary">from Art to Science</span>
            </h2>
            <p className="mb-8 text-xl text-muted-foreground">
              AI-powered trial preparation platform that helps legal teams optimize jury
              selection and craft persuasive arguments with confidence.
            </p>
            <div className="flex justify-center space-x-4">
              <Link href="/signup">
                <Button size="lg">Start Free Trial</Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="outline">
                  View Demo
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="border-t bg-muted/50 py-24">
          <div className="container mx-auto px-4">
            <h3 className="mb-12 text-center text-3xl font-bold">Key Features</h3>
            <div className="grid gap-8 md:grid-cols-3">
              <FeatureCard
                title="Automated Juror Research"
                description="Reduce manual research time by 80% with AI-powered public records search and analysis."
              />
              <FeatureCard
                title="Persona Mapping"
                description="AI-driven behavioral classification to understand and predict juror reactions."
              />
              <FeatureCard
                title="Focus Group Simulations"
                description="Test arguments against simulated jury panels before trial to identify weaknesses."
              />
              <FeatureCard
                title="Voir Dire Questions"
                description="Generate strategic questions based on case facts and target personas."
              />
              <FeatureCard
                title="Real-Time Trial Support"
                description="Live analysis during proceedings with instant insights and recommendations."
              />
              <FeatureCard
                title="Team Collaboration"
                description="Multi-user workspace with real-time updates and shared decision-making."
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24">
          <div className="container mx-auto px-4 text-center">
            <h3 className="mb-6 text-3xl font-bold">Ready to Get Started?</h3>
            <p className="mb-8 text-xl text-muted-foreground">
              Join legal teams who are transforming their trial preparation.
            </p>
            <Link href="/signup">
              <Button size="lg">Create Your Account</Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2026 TrialForge AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <h4 className="mb-2 text-xl font-semibold">{title}</h4>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
