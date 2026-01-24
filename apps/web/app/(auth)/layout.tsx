import { Header } from '@/components/header';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto bg-filevine-gray-50">{children}</main>
      </div>
    </div>
  );
}
