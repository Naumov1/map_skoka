import type React from "react";
import { Bell, ClipboardList, FileSignature, FileText, Home, MapPin, PlusCircle } from "lucide-react";
import { AppShell } from "../app-shell";
import type { NavItem } from "../app-shell";
import type { Page } from "../../shared/router";
import { navigate } from "../../shared/router";
import { Metric } from "../../shared/ui";

export function MetricCard({ label, value, tone = "default" }: { label: string; value: string | number; tone?: "default" | "green" | "blue" }) {
  return <Metric label={label} value={value} tone={tone} />;
}

export function AdminLayout({ active, children }: { active: Page; children: React.ReactNode }) {
  const nav: NavItem[] = [
    { label: "Карта рисков", path: "/risk-map/risk-map.html", active: active === "risk-map", icon: MapPin },
    { label: "Все заявления", path: "/applications/applications.html", active: active === "admin-apps" || active === "details", icon: ClipboardList },
    { label: "Заключения", path: "/conclusion/conclusion.html", active: active === "conclusions" || active === "create-conclusion", icon: FileText },
    { label: "Подписанные", path: "/signed/signed.html", active: active === "signed", icon: FileSignature }
  ];
  return <AppShell active={active} nav={nav} onNavigate={navigate}>{children}</AppShell>;
}

export function UserLayout({ active, children }: { active: Page; children: React.ReactNode }) {
  const nav: NavItem[] = [
    { label: "Главная", path: "/user/index.html", active: active === "user-home", icon: Home },
    { label: "Создать", path: "/user/create.html", active: active === "user-create", icon: PlusCircle },
    { label: "Мои заявления", path: "/user/applications.html", active: active === "user-apps", icon: ClipboardList },
    { label: "Уведомления", path: "/user/notifications.html", active: active === "user-notifications", icon: Bell }
  ];
  return <AppShell active={active} nav={nav} onNavigate={navigate} userMode>{children}</AppShell>;
}
