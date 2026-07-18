'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BrainCircuit, History, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Button } from './ui/button';
import { ThemeToggle } from './theme-toggle';

export function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href={user ? '/upload' : '/'} className="flex items-center gap-2 font-semibold">
          <BrainCircuit className="h-5 w-5 text-primary" aria-hidden />
          <span>Interview IQ</span>
        </Link>
        <nav className="flex items-center gap-1">
          {user && (
            <Button variant="ghost" size="sm" onClick={() => router.push('/history')}>
              <History className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">History</span>
            </Button>
          )}
          <ThemeToggle />
          {user && (
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
