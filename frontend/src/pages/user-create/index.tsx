import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Download, Eye, FileSignature, Filter, PlusCircle, Search, Send, Sparkles } from "lucide-react";
import { API_BASE, apiFileUrl, requestJson } from "../../shared/api";
import type { Application, CommissionAnalysis, Conclusion, NotificationItem, Signature, Street, User } from "../../shared/types";
import { declension, formatDate, isAdminRole, isNotificationRead, normalizeRole, today } from "../../shared/lib";
import { isDemoMode, navigate } from "../../shared/router";
import { demoApplications, demoConclusions, demoNotifications, demoSignatures, demoStreets } from "../../shared/mocks/demo-data";
import { AdminLayout, MetricCard, UserLayout } from "../../widgets/layouts";
import { StreetFilters } from "../../features/street-filters";
export function UserCreatePage({ user, show }: { user: User | null; show: (message: string) => void }) {
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(["fio", "phone", "email", "cadastral_number", "problem", "address"].map((key) => [key, String(form.get(key) || "").trim()]));
    if (!payload.fio || String(payload.fio).split(/\s+/).length < 3) return show("Укажите ФИО полностью");
    if (Object.values(payload).some((value) => !value)) return show("Заполните все поля заявления");
    if (!String(payload.address).includes("ул. ")) return show("Адрес должен содержать улицу в формате: ул. Название");
    try {
      const data = await requestJson<{ detail?: string }>("/applications/create", { method: "POST", body: JSON.stringify(payload) });
      show(data.detail || "Заявление успешно создано");
      navigate("/user/applications.html");
    } catch (error) {
      show(error instanceof Error ? error.message : "Ошибка создания заявления");
    }
  }
  return (
    <UserLayout active="user-create">
      <main className="form-container"><h1>Создать заявление</h1><form className="form-grid" onSubmit={submit}><label>ФИО<input name="fio" defaultValue={user?.fio || ""} required /></label><label>Телефон<input name="phone" required /></label><label>Email<input name="email" type="email" defaultValue={user?.email || ""} required /></label><label>Кадастровый номер<input name="cadastral_number" required /></label><label className="full-width">Адрес<input name="address" placeholder="ул. Название, дом" required /></label><label className="full-width">Описание проблемы<textarea name="problem" rows={5} placeholder="Например: угроза обрушения элементов фасада или кровли, осыпается штукатурка над входом, видны трещины карниза" required /></label><div className="form-actions"><button className="btn-primary"><Send size={18} />Отправить</button></div></form></main>
    </UserLayout>
  );
}

