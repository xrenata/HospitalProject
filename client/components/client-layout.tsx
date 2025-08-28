"use client";

import { usePathname } from "next/navigation";

interface ClientLayoutProps {
  children: React.ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith('/dashboard');
  
  return (
    <div className="relative flex flex-col h-screen">
      <main className={`flex-grow ${!isDashboard ? 'container mx-auto max-w-7xl pt-16 px-6' : ''}`}>
        {children}
      </main>
    </div>
  );
}