import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-auth";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";

export default function ProfileTab() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { data: user } = useUser();

  const [adminProfileForm, setAdminProfileForm] = useState({
    email: "",
    phone: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setAdminProfileForm((prev) => ({
        ...prev,
        email: user.email || "",
        phone: user.phone || "",
      }));
    }
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: {
      email: string;
      phone?: string;
      password?: string;
    }) => {
      const res = await apiRequest("PATCH", "/api/user", data);
      if (!res.ok) {
        // Obsługa 401/403/500
        if (res.status === 401)
          throw new Error("Sesja wygasła. Zaloguj się ponownie.");
        const errorData = await res.json();
        throw new Error(errorData.message || "Błąd zapisu");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setAdminProfileForm((prev) => ({ ...prev, password: "" }));
      toast({
        title: t("dashboard.save_changes"),
        description: t("toasts.success"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("toasts.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="grid gap-6 md:grid-cols-2 animate-in fade-in duration-500">
      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.profile_title")}</CardTitle>
          <CardDescription>{t("dashboard.profile_subtitle")}</CardDescription>
        </CardHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateProfileMutation.mutate(adminProfileForm);
          }}
        >
          <CardContent className="space-y-4">
            {/* Ukryte pole username dla password managerów */}
            <input
              type="text"
              name="username"
              autoComplete="username"
              value={user?.username || ""}
              readOnly
              style={{ display: "none" }}
            />

            <div className="space-y-2">
              <Label htmlFor="admin-email">{t("admin.profile_email")}</Label>
              <Input
                id="admin-email"
                name="email"
                value={adminProfileForm.email}
                autoComplete="email"
                onChange={(e) =>
                  setAdminProfileForm({
                    ...adminProfileForm,
                    email: e.target.value,
                  })
                }
                placeholder="admin@mathmentor.pl"
              />
              <p className="text-xs text-muted-foreground">
                {t("admin.profile_email_hint")}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-phone">{t("admin.profile_phone")}</Label>
              <Input
                id="admin-phone"
                name="phone"
                value={adminProfileForm.phone}
                autoComplete="tel"
                onChange={(e) =>
                  setAdminProfileForm({
                    ...adminProfileForm,
                    phone: e.target.value,
                  })
                }
                placeholder="+48..."
              />
            </div>

            <div className="space-y-2 pt-2 border-t">
              <Label htmlFor="admin-password">{t("admin.new_password")}</Label>
              <div className="relative">
                <Input
                  id="admin-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={adminProfileForm.password}
                  onChange={(e) =>
                    setAdminProfileForm({
                      ...adminProfileForm,
                      password: e.target.value,
                    })
                  }
                  placeholder={t("admin.new_password_placeholder")}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
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
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={updateProfileMutation.isPending}>
              {updateProfileMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t("dashboard.save_changes")}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
            <CheckCircle2 className="h-5 w-5" />
            {t("admin.notification_status")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm text-foreground/80">
            <div className="flex items-center justify-between p-2 rounded bg-white dark:bg-black/20 border">
              <span>{t("admin.email_notifications")}</span>
              <span
                className={
                  adminProfileForm.email && adminProfileForm.email.includes("@")
                    ? "text-green-600 font-bold"
                    : "text-red-500 font-bold"
                }
              >
                {adminProfileForm.email && adminProfileForm.email.includes("@")
                  ? t("admin.active")
                  : t("admin.inactive")}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("admin.notification_hint")}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
