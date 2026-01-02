import { Link, useLocation } from "wouter";
import { useUser, useLogout } from "@/hooks/use-auth";
import { Button } from "./ui-button";
import { LogOut, Calendar, Home, Settings } from "lucide-react";

export function NavBar() {
  const { data: user } = useUser();
  const { mutate: logout } = useLogout();
  const [location] = useLocation();

  if (!user) return null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href={user.role === 'admin' ? '/admin' : '/dashboard'} className="flex items-center space-x-2 text-2xl font-bold font-display tracking-tight hover:opacity-80 transition-opacity">
            <span className="text-primary">Math</span>
            <span className="text-orange-500">Mentor</span>
          </Link>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
              <Link
                href={user.role === 'admin' ? '/admin' : '/dashboard'}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.includes('dashboard') || location.includes('admin')
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/booking"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location === '/booking'
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                }`}
              >
                Schedule
              </Link>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => logout()}
              title="Logout"
              className="hover:text-destructive transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
