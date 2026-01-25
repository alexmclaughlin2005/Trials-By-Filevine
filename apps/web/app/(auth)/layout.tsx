'use client';

import { useState } from 'react';
import { Header } from '@/components/header';
import { ApiChatPanel } from '@/components/api-chat-panel';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="flex h-screen flex-col">
      <Header onOpenChat={() => setIsChatOpen(true)} />
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto bg-filevine-gray-50">{children}</main>
      </div>
      <ApiChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}
