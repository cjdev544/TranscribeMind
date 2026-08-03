import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../../shared/ui/button.js";
import { Input } from "../../../shared/ui/input.js";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../shared/ui/card.js";
import { useRegister } from "../api/use-register.js";
import { GoogleSignInButton } from "./GoogleSignInButton.js";

export function RegisterForm() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const register = useRegister();
  const navigate = useNavigate();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    register.mutate({ email, username, password }, { onSuccess: () => navigate("/dashboard") });
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Crea tu cuenta</CardTitle>
        <CardDescription>Empieza a transcribir y resumir tus videos con IA.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <GoogleSignInButton onSuccess={() => navigate("/dashboard")} />
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          o con tu correo
          <div className="h-px flex-1 bg-border" />
        </div>
        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          <Input
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <Input
            type="text"
            placeholder="Nombre de usuario"
            minLength={3}
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Contraseña"
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          {register.isError && (
            <p className="text-sm text-destructive">
              No se pudo crear la cuenta. ¿El email o nombre de usuario ya existen?
            </p>
          )}
          <Button type="submit" disabled={register.isPending}>
            {register.isPending ? "Creando..." : "Crear cuenta"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
