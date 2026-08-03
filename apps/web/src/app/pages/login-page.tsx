import { Link } from "react-router-dom";
import { LoginForm } from "../../features/auth/components/LoginForm.js";
import { Brand } from "../../shared/ui/brand.js";

export function LoginPage() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-6">
      <Brand />
      <LoginForm />
      <p className="text-sm text-muted-foreground">
        ¿No tienes cuenta?{" "}
        <Link to="/register" className="text-primary hover:underline">
          Regístrate
        </Link>
      </p>
    </div>
  );
}
