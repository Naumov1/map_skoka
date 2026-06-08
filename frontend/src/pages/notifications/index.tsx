import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Download, Eye, FileSignature, Filter, PlusCircle, Search, Send, Sparkles } from "lucide-react";
import { API_BASE, apiFileUrl, requestJson } from "../../shared/api";
import type { Application, CommissionAnalysis, Conclusion, NotificationItem, Signature, Street, User } from "../../shared/types";
import { declension, formatDate, isAdminRole, isNotificationRead, normalizeRole, today } from "../../shared/lib";
import { isDemoMode, navigate } from "../../shared/router";
import { demoApplications, demoConclusions, demoNotifications, demoSignatures, demoStreets } from "../../shared/mocks/demo-data";
import { AdminLayout, MetricCard, UserLayout } from "../../widgets/layouts";
import { StreetFilters } from "../../features/street-filters";
export function NotificationsPage({ userMode, show }: { userMode?: boolean; show: (message: string) => void }) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const unread = items.filter((item) => !isNotificationRead(item)).length;

  async function load() {
    try {
      const data = await requestJson<{ notification?: NotificationItem[]; notifications?: NotificationItem[] }>("/notification/");
      setItems(data.notification || data.notifications || []);
    } catch (error) {
      show(error instanceof Error ? error.message : "Ошибка загрузки уведомлений");
    }
  }

  useEffect(() => {
    if (isDemoMode()) {
      setItems(demoNotifications);
      return;
    }
    load();
  }, []);

  async function markRead(id: number | string) {
    await requestJson("/notification/read", { method: "POST", body: JSON.stringify({ id }) });
    setItems((current) => current.map((item) => String(item.id) === String(id) ? { ...item, is_read: true, read: true } : item));
  }

  async function remove(id: number | string) {
    await requestJson(`/notification/delete?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    setItems((current) => current.filter((item) => String(item.id) !== String(id)));
  }

  const content = (
    <main>
      <section className="metrics-grid"><MetricCard label="Всего уведомлений" value={items.length} tone="blue" /><MetricCard label="Непрочитанных" value={unread} /></section>
      <section className="list-header"><div><h1>Уведомления</h1><p>Всего уведомлений: {items.length} | Непрочитанных: {unread}</p></div><button className="btn-primary" onClick={async () => { await requestJson("/notification/read-all"); setItems((current) => current.map((item) => ({ ...item, is_read: true, read: true }))); }}><CheckCircle2 size={18} />Прочитать все</button></section>
      <section className="applications-list">{items.length === 0 ? <div className="empty-block">Уведомлений нет.</div> : items.map((item) => <article className={`notification-card ${isNotificationRead(item) ? "read" : ""}`} key={item.id}><p>{item.text || "Уведомление"}</p><div>{!isNotificationRead(item) && <button onClick={() => markRead(item.id)}><CheckCircle2 size={18} />Прочитать</button>}<button className="btn-danger" onClick={() => remove(item.id)}>Удалить</button></div></article>)}</section>
    </main>
  );

  return userMode ? <UserLayout active="user-notifications">{content}</UserLayout> : <AdminLayout active="admin-notifications">{content}</AdminLayout>;
}


