import { useState } from "react";
import { useRegister } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { Loader2, Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    role: "student" as const,
  });

  const { mutate: register, isPending } = useRegister();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    register(formData, {
      onError: (err) => {
        toast({
          variant: "destructive",
          title: "Registration failed",
          description: err.message,
        });
      },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-secondary/20 via-background to-background p-4 pt-24 pb-12">
      <Card className="w-full max-w-md border-secondary/20 shadow-2xl shadow-secondary/10">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-12 h-12 bg-gradient-to-br from-orange-500 to-primary rounded-xl mb-4 flex items-center justify-center text-white font-bold text-xl shadow-lg">
            M
          </div>
          <CardTitle className="text-3xl font-bold">
            {t("nav.register")}
          </CardTitle>
          <p className="text-muted-foreground mt-2">
            {t("auth.register_subtitle")}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="name">{t("auth.full_name")}</Label>
              <Input
                id="name"
                required
                autoFocus
                placeholder={t("auth.name_placeholder")}
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                placeholder="jan@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">{t("auth.username")}</Label>
                <Input
                  id="username"
                  required
                  placeholder={t("auth.username_placeholder")}
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  required
                  placeholder="123-456-789"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Adres (Ulica, Miasto)</Label>
              <Input
                id="address"
                required
                placeholder="ul. Szkolna 5, Warszawa"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
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
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
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
              className="w-full mt-4 font-bold bg-orange-500 hover:bg-orange-600 text-white"
              disabled={isPending}
              size="lg"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("nav.register")}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            {t("auth.has_account")}{" "}
            <Link
              href="/login"
              className="text-orange-500 hover:text-orange-600 font-semibold hover:underline cursor-pointer"
            >
              {t("nav.login")}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
