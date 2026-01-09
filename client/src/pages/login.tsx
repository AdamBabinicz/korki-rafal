import { useState } from "react";
import { useLogin } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { Loader2, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { mutate: login, isPending } = useLogin();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(
      { username, password },
      {
        onError: (err) => {
          // Używamy tłumaczeń lub wiadomości z serwera, jeśli brak klucza
          const message =
            err.message === "Invalid credentials"
              ? "Błędny login lub hasło"
              : "Wystąpił błąd logowania";

          toast({
            variant: "destructive",
            title: t("toasts.error") || "Błąd", // Fallback jeśli tłumaczenie nie zadziała
            description: message,
          });
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-secondary/20 via-background to-background p-4 animate-in fade-in duration-500">
      <Card className="w-full max-w-md border-secondary/20 shadow-2xl shadow-secondary/10">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-12 h-12 bg-gradient-to-br from-orange-500 to-primary rounded-xl mb-4 flex items-center justify-center text-white font-bold text-xl shadow-lg">
            M
          </div>
          <CardTitle className="text-3xl font-bold">{t("nav.login")}</CardTitle>
          <p className="text-muted-foreground mt-2">{t("auth.welcome_back")}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">{t("auth.username")}</Label>
              <Input
                id="username"
                required
                placeholder={t("auth.username_placeholder")}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <div className="relative">
                <Input
                  id="password"
                  required
                  type={showPassword ? "text" : "password"}
                  placeholder={t("auth.password_placeholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  <span className="sr-only">
                    {showPassword ? "Ukryj hasło" : "Pokaż hasło"}
                  </span>
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full mt-2 font-bold bg-orange-500 hover:bg-orange-600 text-white"
              disabled={isPending}
              size="lg"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("nav.login")}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            {t("auth.no_account")}{" "}
            <Link
              href="/register"
              className="text-orange-500 hover:text-orange-600 font-semibold hover:underline cursor-pointer"
            >
              {t("nav.register")}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
