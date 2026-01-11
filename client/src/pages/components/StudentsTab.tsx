import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Pencil, Trash2, Plus } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { User, InsertUser } from "@shared/schema";

// Helper do powiadomień telegram (możesz go później wydzielić do utils.ts)
const sendTelegramNotification = async (message: string) => {
  const token = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
  const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
      }),
    });
  } catch (e) {
    console.error(e);
  }
};

export default function StudentsTab() {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<number | null>(null);
  const [newStudent, setNewStudent] = useState<Partial<InsertUser>>({
    role: "student",
    defaultPrice: 80,
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: InsertUser) => {
      const res = await apiRequest("POST", "/api/users", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: t("toasts.success") });
      setIsAddStudentOpen(false);
      sendTelegramNotification(
        `🔔 <b>${t("notifications.title")}</b>\n${t(
          "notifications.new_student"
        )}`
      );
    },
    onError: (err: Error) => {
      toast({
        title: t("toasts.error"),
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<InsertUser>;
    }) => {
      const res = await apiRequest("PATCH", `/api/users/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: t("toasts.success") });
      setEditingStudentId(null);
    },
    onError: (error: Error) => {
      toast({
        title: t("toasts.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: t("admin.student_deleted") });
      sendTelegramNotification(
        `🔔 <b>${t("notifications.title")}</b>\n${t(
          "notifications.student_deleted"
        )}`
      );
    },
  });

  return (
    <Card className="animate-in fade-in duration-500">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{t("admin.tab_students")}</CardTitle>
          <CardDescription>{t("admin.students_list_desc")}</CardDescription>
        </div>
        <Dialog open={isAddStudentOpen} onOpenChange={setIsAddStudentOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t("admin.add_student_btn")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("admin.add_student_title")}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>{t("auth.full_name")}</Label>
                <Input
                  value={newStudent.name || ""}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, name: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>{t("auth.username")}</Label>
                <Input
                  autoComplete="username"
                  value={newStudent.username || ""}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, username: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>{t("auth.password")}</Label>
                <Input
                  autoComplete="new-password"
                  type="password"
                  value={newStudent.password || ""}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, password: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>{t("admin.default_price")}</Label>
                <Input
                  type="number"
                  value={newStudent.defaultPrice || 80}
                  onChange={(e) =>
                    setNewStudent({
                      ...newStudent,
                      defaultPrice: parseInt(e.target.value),
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>E-mail</Label>
                <Input
                  value={newStudent.email || ""}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, email: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() =>
                  createUserMutation.mutate(newStudent as InsertUser)
                }
              >
                {t("admin.add_student_submit")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-muted/50 border-b">
              <tr className="text-left">
                <th className="p-3 font-medium hidden md:table-cell">
                  {t("admin.table.id")}
                </th>
                <th className="p-3 font-medium">{t("admin.table.name")}</th>
                <th className="p-3 font-medium">{t("admin.table.username")}</th>
                <th className="p-3 font-medium">{t("admin.table.email")}</th>
                <th className="p-3 font-medium">{t("admin.table.phone")}</th>
                <th className="p-3 font-medium">
                  {t("admin.table.admin_notes")}
                </th>
                <th className="p-3 font-medium text-right">
                  {t("admin.table.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {users
                ?.filter((u) => u.role === "student")
                .map((student) => (
                  <tr
                    key={student.id}
                    className="border-b last:border-0 hover:bg-muted/20"
                  >
                    <td className="p-3 hidden md:table-cell">{student.id}</td>
                    <td className="p-3 font-medium">{student.name}</td>
                    <td className="p-3 text-muted-foreground">
                      {student.username}
                    </td>
                    <td className="p-3">{student.email || "-"}</td>
                    <td className="p-3">{student.phone || "-"}</td>
                    <td className="p-3">
                      <div className="max-w-[200px] truncate opacity-80">
                        {student.adminNotes || "-"}
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Dialog
                          open={editingStudentId === student.id}
                          onOpenChange={(open) =>
                            !open && setEditingStudentId(null)
                          }
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => setEditingStudentId(student.id)}
                              title={t("admin.edit")}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>
                                {t("admin.edit_student_title")}: {student.name}
                              </DialogTitle>
                              <DialogDescription>
                                Edytuj szczegóły konta ucznia.
                              </DialogDescription>
                            </DialogHeader>
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                const rawData: any = Object.fromEntries(
                                  formData.entries()
                                );
                                const cleanData: any = {};
                                if (rawData.name)
                                  cleanData.name = rawData.name.trim();
                                ["phone", "address", "adminNotes"].forEach(
                                  (field) => {
                                    cleanData[field] = rawData[field]
                                      ? rawData[field].trim()
                                      : "";
                                  }
                                );
                                if (rawData.email?.trim())
                                  cleanData.email = rawData.email.trim();
                                if (rawData.defaultPrice)
                                  cleanData.defaultPrice = parseInt(
                                    rawData.defaultPrice
                                  );
                                if (rawData.password?.trim())
                                  cleanData.password = rawData.password.trim();

                                updateUserMutation.mutate({
                                  id: student.id,
                                  data: cleanData,
                                });
                              }}
                              className="space-y-4 py-4"
                            >
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>{t("admin.table.name")}</Label>
                                  <Input
                                    name="name"
                                    defaultValue={student.name}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>{t("admin.table.username")}</Label>
                                  <Input
                                    name="username"
                                    defaultValue={student.username}
                                    readOnly
                                    className="bg-muted"
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>{t("admin.table.email")}</Label>
                                  <Input
                                    name="email"
                                    defaultValue={student.email || ""}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>{t("admin.table.phone")}</Label>
                                  <Input
                                    name="phone"
                                    defaultValue={student.phone || ""}
                                  />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label>{t("admin.table.address")}</Label>
                                <Input
                                  name="address"
                                  defaultValue={student.address || ""}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>{t("admin.table.admin_notes")}</Label>
                                <Textarea
                                  name="adminNotes"
                                  defaultValue={student.adminNotes || ""}
                                  placeholder={t("admin.notes_placeholder")}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>{t("admin.new_password")}</Label>
                                <Input
                                  autoComplete="new-password"
                                  name="password"
                                  type="password"
                                  placeholder="..."
                                />
                              </div>
                              <DialogFooter>
                                <Button type="submit">
                                  {t("dashboard.save_changes")}
                                </Button>
                              </DialogFooter>
                            </form>
                          </DialogContent>
                        </Dialog>

                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => {
                            if (
                              window.confirm(t("admin.delete_confirm_student"))
                            ) {
                              deleteUserMutation.mutate(student.id);
                            }
                          }}
                          title={t("admin.delete")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              {(!users ||
                users.filter((u) => u.role === "student").length === 0) && (
                <tr>
                  <td
                    colSpan={7}
                    className="p-8 text-center text-muted-foreground"
                  >
                    {t("admin.no_students")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
