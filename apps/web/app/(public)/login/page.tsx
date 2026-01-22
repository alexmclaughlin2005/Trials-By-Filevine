'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-filevine-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg border border-filevine-gray-200 bg-white p-8 shadow-lg">
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <Image
              src="/filevine-logo.jpeg"
              alt="Filevine"
              width={64}
              height={64}
              className="h-16 w-16 rounded-lg"
            />
          </div>
          <h1 className="text-3xl font-bold text-filevine-gray-900">Welcome Back</h1>
          <p className="mt-2 text-filevine-gray-600">
            Sign in to <span className="font-semibold">Juries by Filevine</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-filevine-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border border-filevine-gray-300 px-3 py-2 text-filevine-gray-900 placeholder-filevine-gray-400 focus:border-filevine-blue focus:outline-none focus:ring-1 focus:ring-filevine-blue"
              placeholder="attorney@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-filevine-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-filevine-gray-300 px-3 py-2 text-filevine-gray-900 placeholder-filevine-gray-400 focus:border-filevine-blue focus:outline-none focus:ring-1 focus:ring-filevine-blue"
              placeholder="••••••••"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Button>

          <div className="text-center text-sm text-filevine-gray-600">
            Don't have an account?{' '}
            <Link href="/signup" className="text-filevine-blue hover:underline">
              Sign up
            </Link>
          </div>

          <div className="mt-4 rounded-md bg-filevine-gray-50 p-4">
            <p className="text-xs text-filevine-gray-600">
              <strong>Demo Credentials:</strong><br />
              Email: attorney@example.com<br />
              Password: password
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
