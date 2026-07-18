import { AuthProvider } from '@/lib/auth-context';
import { Header } from '@/components/header';

// This subtree is the authenticated, client-driven app. Render on demand rather than
// statically prerendering pages that depend on client-only auth context.
export const dynamic = 'force-dynamic';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <Header />
      <main id="main" className="mx-auto max-w-5xl px-4 py-8">
        {children}
      </main>
    </AuthProvider>
  );
}
