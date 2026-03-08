import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Pencil, Trash2, Plus, Wallet, Check, Eye } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { pl, enUS } from "date-fns/locale";
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
import type { User, InsertUser, Slot } from "@shared/schema";

interface UserWithBalance extends User {
  balance?: number;
  unpaidCount?: number;
}

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
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const dateLocale = i18n.language.startsWith("pl") ? pl : enUS;

  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<number | null>(null);
  const [paymentDetailsStudentId, setPaymentDetailsStudentId] = useState<
    number | null
  >(null);

  const [newStudent, setNewStudent] = useState<Partial<InsertUser>>({
    role: "student",
    defaultPrice: 80,
  });

  const { data: users } = useQuery<UserWithBalance[]>({
    queryKey: ["/api/users"],
  });

  const { data: unpaidSlots } = useQuery<Slot[]>({
    queryKey: ["/api/users", paymentDetailsStudentId, "unpaid"],
    enabled: !!paymentDetailsStudentId,
  });

  const getNoteTranslation = (note: string | null | undefined) => {
    if (!note) return "-";

    // Używamy .includes, aby dopasować się do wariantów
    if (note.includes("Zaimportowano automatycznie"))
      return t("admin.note_auto");
    if (note.includes("Fikcyjny uczeń dodany w celu testowania aplikacji"))
      return t("admin.note_fictional_1");
    if (note.includes("Fikcyjny uczeń do testowania funkcjonalności aplikacji"))
      return t("admin.note_fictional_2");

    return note; // Zwróci notatkę taką, jaka jest w bazie, jeśli nie pasuje do żadnego schematu
  };

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
          "notifications.new_student",
        )}`,
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
          "notifications.student_deleted",
        )}`,
      );
    },
  });

  const settleAllDebtMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/users/${id}/settle`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/users", paymentDetailsStudentId, "unpaid"],
      });
      toast({
        title: t("admin.settle_debt"),
        description: t("admin.debt_all_cleared"),
      });
      setPaymentDetailsStudentId(null);
    },
  });

  const paySingleSlotMutation = useMutation({
    mutationFn: async (slotId: number) => {
      const res = await apiRequest("PATCH", `/api/slots/${slotId}`, {
        isPaid: true,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/users", paymentDetailsStudentId, "unpaid"],
      });
      toast({
        title: t("admin.paid_lesson"),
        description: t("admin.status_paid"),
      });
    },
  });

  const selectedStudent = users?.find((u) => u.id === paymentDetailsStudentId);
  const editingStudent = users?.find((u) => u.id === editingStudentId);

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
                <Label>{t("admin.table.email")}</Label>
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
          <table className="w-full text-sm min-w-[800px]">
            <thead className="bg-muted/50 border-b">
              <tr className="text-left">
                <th className="p-3 font-medium hidden md:table-cell">
                  {t("admin.table.id")}
                </th>
                <th className="p-3 font-medium">{t("admin.table.name")}</th>
                <th className="p-3 font-medium">{t("admin.table.email")}</th>
                <th className="p-3 font-medium">{t("admin.table.phone")}</th>
                <th className="p-3 font-medium text-center">
                  {t("admin.table.balance")}
                </th>
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
                    <td className="p-3 font-medium">
                      {student.name}
                      <div className="text-xs text-muted-foreground">
                        @{student.username}
                      </div>
                    </td>
                    <td className="p-3">{student.email || "-"}</td>
                    <td className="p-3">{student.phone || "-"}</td>

                    <td className="p-3 text-center">
                      {(student.balance || 0) > 0 ? (
                        <Button
                          variant="ghost"
                          className="h-auto py-1 px-2 flex flex-col items-center gap-0 hover:bg-red-50 text-red-600"
                          onClick={() => setPaymentDetailsStudentId(student.id)}
                        >
                          <span className="font-bold text-base">
                            {student.balance} PLN
                          </span>
                          <span className="text-xs font-normal underline decoration-dotted">
                            {t("admin.show_lessons", {
                              count: student.unpaidCount,
                            })}
                          </span>
                        </Button>
                      ) : (
                        <span className="text-green-600 flex items-center justify-center gap-1 text-xs font-medium">
                          <Check className="h-3 w-3" /> {t("admin.debt_clear")}
                        </span>
                      )}
                    </td>

                    <td className="p-3">
                      <div className="max-w-[200px] truncate opacity-80 text-xs">
                        {getNoteTranslation(student.adminNotes)}
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
                                {t("admin.edit_student_title")}:{" "}
                                {editingStudent?.name}
                              </DialogTitle>
                              <DialogDescription>
                                {t("admin.edit_student_desc")}
                              </DialogDescription>
                            </DialogHeader>
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                const rawData: any = Object.fromEntries(
                                  formData.entries(),
                                );
                                const cleanData: any = {};
                                if (rawData.name)
                                  cleanData.name = rawData.name.trim();
                                ["phone", "address", "adminNotes"].forEach(
                                  (field) => {
                                    cleanData[field] = rawData[field]
                                      ? rawData[field].trim()
                                      : "";
                                  },
                                );
                                if (rawData.email?.trim())
                                  cleanData.email = rawData.email.trim();
                                if (rawData.defaultPrice)
                                  cleanData.defaultPrice = parseInt(
                                    rawData.defaultPrice,
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
                                    defaultValue={editingStudent?.name}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>{t("admin.table.username")}</Label>
                                  <Input
                                    name="username"
                                    defaultValue={editingStudent?.username}
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
                                    defaultValue={editingStudent?.email || ""}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>{t("admin.table.phone")}</Label>
                                  <Input
                                    name="phone"
                                    defaultValue={editingStudent?.phone || ""}
                                  />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label>{t("admin.table.address")}</Label>
                                <Input
                                  name="address"
                                  defaultValue={editingStudent?.address || ""}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>{t("admin.table.admin_notes")}</Label>
                                <Textarea
                                  name="adminNotes"
                                  defaultValue={
                                    editingStudent?.adminNotes || ""
                                  }
                                  placeholder={t("admin.notes_placeholder")}
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>{t("admin.default_price")}</Label>
                                  <Input
                                    name="defaultPrice"
                                    type="number"
                                    defaultValue={
                                      editingStudent?.defaultPrice || 80
                                    }
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
                    colSpan={8}
                    className="p-8 text-center text-muted-foreground"
                  >
                    {t("admin.no_students")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Dialog
          open={!!paymentDetailsStudentId}
          onOpenChange={(open) => !open && setPaymentDetailsStudentId(null)}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {t("admin.unpaid_lessons")}: {selectedStudent?.name}
              </DialogTitle>
            </DialogHeader>

            <div className="max-h-[300px] overflow-y-auto border rounded-md my-4">
              {unpaidSlots?.length === 0 && (
                <div className="p-4 text-center text-muted-foreground">
                  {t("admin.no_debt")}
                </div>
              )}
              {unpaidSlots?.map((slot) => {
                const price = slot.price ?? selectedStudent?.defaultPrice ?? 0;
                return (
                  <div
                    key={slot.id}
                    className="flex items-center justify-between p-3 border-b last:border-0 hover:bg-muted/10"
                  >
                    <div>
                      <div className="font-medium">
                        {format(new Date(slot.startTime), "d MMMM (EEEE)", {
                          locale: dateLocale,
                        })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(slot.startTime), "HH:mm", {
                          locale: dateLocale,
                        })}{" "}
                        -{" "}
                        {format(new Date(slot.endTime), "HH:mm", {
                          locale: dateLocale,
                        })}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-red-600">{price} zł</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => paySingleSlotMutation.mutate(slot.id)}
                        disabled={paySingleSlotMutation.isPending}
                      >
                        <Wallet className="w-3 h-3 mr-1" />
                        {t("admin.pay_now")}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <DialogFooter className="flex sm:justify-between gap-2">
              <div className="text-sm text-muted-foreground self-center">
                {t("admin.total_sum")}{" "}
                <span className="font-bold text-foreground">
                  {selectedStudent?.balance} PLN
                </span>
              </div>
              <Button
                variant="default"
                onClick={() =>
                  paymentDetailsStudentId &&
                  settleAllDebtMutation.mutate(paymentDetailsStudentId)
                }
              >
                {t("admin.settle_all", {
                  balance: selectedStudent?.balance,
                })}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
