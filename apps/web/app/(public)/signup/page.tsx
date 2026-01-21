import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50">
      <div className="w-full max-w-md space-y-8 rounded-lg border bg-card p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Get Started</h1>
          <p className="mt-2 text-muted-foreground">
            Create your TrialForge AI account
          </p>
        </div>

        <div className="space-y-4">
          {/* Auth0 integration would go here */}
          <Link href="/dashboard">
            <Button className="w-full" size="lg">
              Sign up with Auth0
            </Button>
          </Link>

          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
