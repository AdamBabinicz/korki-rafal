import { useQuery, useMutation } from "@tanstack/react-query";
import { Trash2, MessageSquare, Calendar, Mail, Phone } from "lucide-react";
import { format } from "date-fns";
import { pl, enUS } from "date-fns/locale";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function RequestsTab() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();

  // Ustawienie lokalizacji dla dat (PL/EN)
  const dateLocale = i18n.language.startsWith("pl") ? pl : enUS;

  const { data: waitlist } = useQuery<any[]>({
    queryKey: ["/api/waitlist"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/waitlist");
      return res.json();
    },
  });

  const deleteWaitlistMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/waitlist/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/waitlist"] });
      toast({
        title: t("admin.request_deleted"),
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
    <Card className="animate-in fade-in duration-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {t("admin.requests_title")}
          {waitlist && waitlist.length > 0 && (
            <Badge variant="secondary">{waitlist.length}</Badge>
          )}
        </CardTitle>
        <CardDescription>{t("admin.requests_desc")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {waitlist?.length === 0 && (
            <div className="text-center py-12 text-muted-foreground border rounded-md border-dashed">
              {t("admin.requests_empty")}
            </div>
          )}

          {waitlist?.map((request) => (
            <div
              key={request.id}
              className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border rounded-lg bg-card hover:bg-muted/10 transition-colors gap-4"
            >
              <div className="space-y-2 w-full">
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                  <span className="font-bold text-lg">{request.name}</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {request.createdAt
                      ? format(
                          new Date(request.createdAt),
                          "d MMMM yyyy, HH:mm",
                          {
                            locale: dateLocale,
                          }
                        )
                      : "-"}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-sm">
                  {request.email && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      <a
                        href={`mailto:${request.email}`}
                        className="hover:text-primary"
                      >
                        {request.email}
                      </a>
                    </div>
                  )}
                  {request.phone && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      <a
                        href={`tel:${request.phone}`}
                        className="hover:text-primary"
                      >
                        {request.phone}
                      </a>
                    </div>
                  )}
                </div>

                {request.message && (
                  <div className="mt-2 p-3 bg-muted/50 rounded-md text-sm italic flex gap-2">
                    <MessageSquare className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>"{request.message}"</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end w-full md:w-auto">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => {
                    if (window.confirm(t("admin.delete_confirm"))) {
                      deleteWaitlistMutation.mutate(request.id);
                    }
                  }}
                  title={t("admin.delete")}
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
