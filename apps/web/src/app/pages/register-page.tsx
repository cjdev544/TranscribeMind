import { Link } from "react-router-dom";
import { RegisterForm } from "../../features/auth/components/RegisterForm.js";
import { Brand } from "../../shared/ui/brand.js";

export function RegisterPage() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-6">
      <Brand />
      <RegisterForm />
      <p className="text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{" "}
        <Link to="/login" className="text-primary hover:underline">
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}
