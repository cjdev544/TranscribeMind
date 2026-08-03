import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useMe } from "../features/auth/api/use-me.js";
import { Brand } from "../shared/ui/brand.js";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { data: user, isLoading, isError } = useMe();

  if (isLoading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 text-muted-foreground">
        <Brand />
        Cargando...
      </div>
    );
  }

  if (isError || !user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
