import { useTranslation } from "react-i18next";
import {
  Calendar as CalendarIcon,
  Users,
  LayoutTemplate,
  UserCog,
  Bell,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import komponentów, które właśnie stworzyliśmy
import CalendarTab from "../components/CalendarTab";
import TemplateTab from "../components/TemplateTab";
import StudentsTab from "../components/StudentsTab";
import RequestsTab from "../components/RequestsTab";
import ProfileTab from "../components/ProfileTab";

export default function AdminPanel() {
  const { t } = useTranslation();

  return (
    <div className="mt-16 space-y-8 animate-in fade-in duration-500">
      {/* Nagłówek Panelu */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">
            {t("admin.title")}
          </h2>
          <p className="text-muted-foreground">{t("admin.subtitle")}</p>
        </div>
      </div>

      {/* Zakładki */}
      <Tabs defaultValue="calendar" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 lg:w-auto h-auto">
          <TabsTrigger
            value="calendar"
            className="py-2 h-auto whitespace-normal"
          >
            <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
            {t("admin.tab_calendar")}
          </TabsTrigger>
          <TabsTrigger
            value="template"
            className="py-2 h-auto whitespace-normal"
          >
            <LayoutTemplate className="mr-2 h-4 w-4 shrink-0" />
            {t("admin.tab_template")}
          </TabsTrigger>
          <TabsTrigger
            value="students"
            className="py-2 h-auto whitespace-normal"
          >
            <Users className="mr-2 h-4 w-4 shrink-0" />
            {t("admin.tab_students")}
          </TabsTrigger>
          <TabsTrigger
            value="requests"
            className="py-2 h-auto whitespace-normal"
          >
            <Bell className="mr-2 h-4 w-4 shrink-0" />
            {t("admin.requests_title")}
          </TabsTrigger>
          <TabsTrigger
            value="profile"
            className="py-2 h-auto whitespace-normal col-span-2 md:col-span-1"
          >
            <UserCog className="mr-2 h-4 w-4 shrink-0" />
            {t("admin.tab_profile")}
          </TabsTrigger>
        </TabsList>

        {/* Zawartość zakładek */}
        <TabsContent value="calendar" className="space-y-6">
          <CalendarTab />
        </TabsContent>

        <TabsContent value="template" className="space-y-6">
          <TemplateTab />
        </TabsContent>

        <TabsContent value="students" className="space-y-6">
          <StudentsTab />
        </TabsContent>

        <TabsContent value="requests" className="space-y-6">
          <RequestsTab />
        </TabsContent>

        <TabsContent value="profile">
          <ProfileTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
