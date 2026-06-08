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
export function ApplicationsPage({ show }: { show: (message: string) => void }) {
  const [items, setItems] = useState<Application[]>([]);
  const [streets, setStreets] = useState<Street[]>([]);
  const [selectedStreets, setSelectedStreets] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [isDeparture, setIsDeparture] = useState(false);
  const [label, setLabel] = useState("Всего");
  const [assignIds, setAssignIds] = useState("");
  const [assignDate, setAssignDate] = useState("");

  async function load(path = "/applications/all", nextLabel = "Всего") {
    try {
      const data = await requestJson<{ count?: number; applications?: Application[] }>(path);
      setItems(data.applications || []);
      setLabel(nextLabel);
    } catch (error) {
      show(error instanceof Error ? error.message : "Ошибка загрузки заявлений");
    }
  }

  useEffect(() => {
    if (isDemoMode()) {
      setItems(demoApplications);
      setStreets(demoStreets);
      return;
    }
    load();
    requestJson<{ streets?: Street[] }>("/applications/street").then((data) => setStreets(data.streets || [])).catch((error: Error) => show(error.message));
  }, []);

  async function applyFilters() {
    const params = new URLSearchParams();
    if (selectedStreets.length) params.append("street", selectedStreets.join(","));
    if (dateFrom) params.append("date_from", dateFrom);
    if (dateTo) params.append("date_to", dateTo);
    if (isDeparture) params.append("is_departure", "true");
    await load(`/applications/filter?${params.toString()}`, "Найдено");
  }

  async function setDeparture() {
    if (!assignIds || !assignDate) {
      show("Укажите номер заявления и дату");
      return;
    }
    try {
      const data = await requestJson<{ detail?: string }>("/applications/departure", {
        method: "PATCH",
        body: JSON.stringify({ applications_id: assignIds, departure_date: assignDate })
      });
      show(data.detail || "Дата выезда назначена");
      setAssignIds("");
      setAssignDate("");
      load();
    } catch (error) {
      show(error instanceof Error ? error.message : "Ошибка назначения выезда");
    }
  }

  return (
    <AdminLayout active="admin-apps">
      <section className="metrics-grid">
        <MetricCard label="Заявлений в работе" value={items.length} tone="blue" />
        <MetricCard label="С назначенным выездом" value={items.filter((item) => item.departure_date).length} tone="green" />
        <MetricCard label="Ожидают даты" value={items.filter((item) => !item.departure_date).length} />
      </section>
      <div className="toolbar">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Введите ФИО или кадастровый номер" />
        <button className="btn-primary" onClick={() => load(`/applications/search/${encodeURIComponent(search)}`, "Найдено")}><Search size={18} />Поиск</button>
      </div>
      <div className="counter-row">
        <strong>{label}: {items.length} {declension(items.length)}</strong>
        <div className="assign-row">
          <input value={assignIds} onChange={(event) => setAssignIds(event.target.value)} placeholder="Номера заявлений: 1, 2 или 1-4" />
          <input type="date" value={assignDate} onChange={(event) => setAssignDate(event.target.value)} />
          <button onClick={setDeparture}><CheckCircle2 size={18} />Назначить</button>
        </div>
      </div>
      <div className="content">
        <aside className="filters">
          <StreetFilters streets={streets} selected={selectedStreets} setSelected={setSelectedStreets} />
          <label>Дата выезда от<input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} /></label>
          <label>Дата выезда до<input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} /></label>
          <label className="check-row"><input type="checkbox" checked={isDeparture} onChange={(event) => setIsDeparture(event.target.checked)} />Назначен выезд</label>
          <button className="btn-primary" onClick={applyFilters}><Filter size={18} />Применить</button>
          <button onClick={() => { setSelectedStreets([]); setDateFrom(""); setDateTo(""); setIsDeparture(false); load(); }}>Сбросить</button>
        </aside>
        <main className="applications-list">
          {items.length === 0 ? <EmptyState>Список заявлений пуст.</EmptyState> : (
            <DataTable
              rows={items}
              getKey={(application: Application) => application.id}
              columns={[
                { key: "id", title: "ID", render: (application: Application) => <b>{application.id}</b> },
                { key: "fio", title: "ФИО", render: (application: Application) => application.fio },
                { key: "address", title: "Адрес", render: (application: Application) => application.street || application.address },
                { key: "phone", title: "Телефон", render: (application: Application) => application.phone },
                { key: "departure", title: "Дата выезда", render: (application: Application) => formatDate(application.departure_date) },
                { key: "action", title: "", render: (application: Application) => <button className="btn-details" onClick={() => navigate(`/application_details/application_details.html?id=${application.id}`)}><Eye size={18} />Подробнее</button> }
              ]}
              renderMobileCard={(application: Application) => (
                <article className="app-card">
                  <div className="card-line"><b>{application.id}</b><span><b>ФИО:</b> {application.fio}</span><span><b>Адрес:</b> {application.street || application.address}</span><span><b>Телефон:</b> {application.phone}</span><span><b>Дата выезда:</b> {formatDate(application.departure_date)}</span></div>
                  <button className="btn-details" onClick={() => navigate(`/application_details/application_details.html?id=${application.id}`)}><Eye size={18} />Подробнее</button>
                </article>
              )}
            />
          )}
        </main>
      </div>
    </AdminLayout>
  );
}

