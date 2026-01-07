import { useUser } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import React, { ComponentType } from "react";

type ProtectedRouteProps = {
  path: string;
  // ZMIANA: Używamy ComponentType<any> zamiast funkcji, aby obsłużyć React.lazy
  component: ComponentType<any>;
  role?: string;
};

export function ProtectedRoute({
  path,
  component: Component,
  role,
}: ProtectedRouteProps) {
  const { data: user, isLoading } = useUser();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  // Jeśli brak użytkownika -> przekieruj do logowania
  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/login" />
      </Route>
    );
  }

  // Jeśli wymagana jest rola (np. "admin"), a użytkownik jej nie ma -> przekieruj na pulpit
  if (role && user.role !== role) {
    return (
      <Route path={path}>
        <Redirect to="/dashboard" />
      </Route>
    );
  }

  // Jeśli wszystko ok -> wyświetl komponent
  return <Route path={path} component={Component} />;
}
