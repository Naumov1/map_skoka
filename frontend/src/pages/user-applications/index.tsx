import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Download, Eye, FileSignature, Filter, PlusCircle, Search, Send, Sparkles } from "lucide-react";
import { API_BASE, apiFileUrl, requestJson } from "../../shared/api";
import type { Application, CommissionAnalysis, Conclusion, NotificationItem, Signature, Street, User } from "../../shared/types";
import { declension, formatDate, isAdminRole, isNotificationRead, normalizeRole, today } from "../../shared/lib";
import { isDemoMode, navigate } from "../../shared/router";
import { demoApplications, demoConclusions, demoNotifications, demoSignatures, demoStreets } from "../../shared/mocks/demo-data";
import { AdminLayout, MetricCard, UserLayout } from "../../widgets/layouts";
import { StreetFilters } from "../../features/street-filters";
import { DataTable, EmptyState } from "../../shared/ui";
export function UserApplicationsPage({ show }: { show: (message: string) => void }) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [conclusions, setConclusions] = useState<Conclusion[]>([]);
  const [status, setStatus] = useState("");
  const [id, setId] = useState("");

  useEffect(() => {
    if (isDemoMode()) {
      setApplications(demoApplications);
      setConclusions(demoConclusions);
      return;
    }
    Promise.allSettled([requestJson<{ applications?: Application[] }>("/applications/my"), requestJson<{ conclusions?: Conclusion[] }>("/conclusion/my")]).then(([apps, cons]) => {
      if (apps.status === "fulfilled") setApplications(apps.value.applications || []);
      if (cons.status === "fulfilled") setConclusions(cons.value.conclusions || []);
    }).catch((error: Error) => show(error.message));
  }, []);

  const conclusionsByApp = useMemo(() => new Map(conclusions.map((item) => [String(item.applications_id), item])), [conclusions]);
  const filtered = applications.filter((application) => (!status || application.status === status) && (!id || String(application.id) === id));

  return (
    <UserLayout active="user-apps">
      <main>
        <section className="metrics-grid">
          <MetricCard label="Всего заявлений" value={applications.length} tone="blue" />
          <MetricCard label="Показано" value={filtered.length} />
        </section>
        <section className="list-header">
          <div>
            <h1>Мои заявления</h1>
            <p>Найдено: {filtered.length} {declension(filtered.length)}</p>
          </div>
          <button className="btn-primary" onClick={() => navigate("/user/create.html")}><PlusCircle size={18} />Создать заявление</button>
        </section>
        <section className="filters-panel">
          <label>Статус<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Все</option><option>Заявление принято</option><option>Назначен выезд</option><option>Заключение на рассмотрении</option><option>Результат комиссии</option></select></label>
          <label>Поиск по ID<input type="number" value={id} onChange={(event) => setId(event.target.value)} /></label>
          <button onClick={() => { setStatus(""); setId(""); }}>Сбросить</button>
        </section>
        <section className="applications-list">
          {filtered.length === 0 ? <EmptyState>Заявления не найдены.</EmptyState> : (
            <DataTable
              rows={filtered}
              getKey={(application: Application) => application.id}
              columns={[
                { key: "id", title: "Заявление", render: (application: Application) => <b>№{application.id}</b> },
                { key: "status", title: "Статус", render: (application: Application) => <span className="status-badge">{application.status}</span> },
                { key: "address", title: "Адрес", render: (application: Application) => application.address },
                { key: "cad", title: "Кадастровый номер", render: (application: Application) => application.cadastral_number },
                { key: "date", title: "Дата выезда", render: (application: Application) => formatDate(application.departure_date) },
                { key: "action", title: "", render: (application: Application) => <a className="btn-details" href={apiFileUrl(`/applications/download/${application.id}`)}><Download size={18} />Скачать</a> }
              ]}
              renderMobileCard={(application: Application) => {
                const conclusion = conclusionsByApp.get(String(application.id));
                const conclusionId = conclusion?.id || conclusion?.conclusion_id;
                return (
                  <article className="application-card">
                    <div className="application-top"><h2>Заявление №{application.id}</h2><span className="status-badge">{application.status}</span></div>
                    <p><b>ФИО:</b> {application.fio}</p>
                    <p><b>Кадастровый номер:</b> {application.cadastral_number}</p>
                    <p><b>Адрес:</b> {application.address}</p>
                    <p><b>Дата выезда:</b> {formatDate(application.departure_date)}</p>
                    <div className="application-actions"><a className="btn-primary" href={apiFileUrl(`/applications/view/${application.id}`)} target="_blank"><Eye size={18} />Открыть документ</a><a className="btn-details" href={apiFileUrl(`/applications/download/${application.id}`)}><Download size={18} />Скачать</a></div>
                    {conclusionId && <div className="conclusion-panel"><b>Заключение комиссии готово</b><a className="btn-primary" href={apiFileUrl(`/conclusion/view/${conclusionId}`)} target="_blank"><Eye size={18} />Открыть</a><a className="btn-details" href={apiFileUrl(`/conclusion/download/${conclusionId}`)}><Download size={18} />Скачать</a></div>}
                  </article>
                );
              }}
            />
          )}
        </section>
      </main>
    </UserLayout>
  );
}

