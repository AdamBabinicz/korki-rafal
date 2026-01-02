import { useUser } from "@/hooks/use-auth";
import { Route, useLocation } from "wouter";
import { Loader2 } from "lucide-react";

type Props = {
  path: string;
  component: React.ComponentType<any>;
  role?: "admin" | "student";
};

export function ProtectedRoute({ path, component: Component, role }: Props) {
  const { data: user, isLoading } = useUser();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) {
    setLocation("/login");
    return null;
  }

  if (role && user.role !== role) {
    // Redirect if role doesn't match
    setLocation(user.role === "admin" ? "/admin" : "/dashboard");
    return null;
  }

  return <Route path={path} component={Component} />;
}
