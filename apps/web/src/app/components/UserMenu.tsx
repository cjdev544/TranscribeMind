import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMe } from "../../features/auth/api/use-me.js";
import { useLogout } from "../../features/auth/api/use-logout.js";
import { Button } from "../../shared/ui/button.js";

export function UserMenu() {
  const { data: user } = useMe();
  const logout = useLogout();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    logout.mutate(undefined, { onSuccess: () => navigate("/login") });
  };

  return (
    <div className="flex min-w-0 items-center gap-2 sm:gap-3">
      <div className="flex min-w-0 items-center gap-2">
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt={user.username} className="h-7 w-7 shrink-0 rounded-full" />
        ) : (
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {user.username.slice(0, 1).toUpperCase()}
          </div>
        )}
        <span className="hidden truncate text-sm font-medium sm:inline">{user.username}</span>
      </div>
      <Button variant="ghost" size="icon" title="Cerrar sesión" onClick={handleLogout} disabled={logout.isPending}>
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}
