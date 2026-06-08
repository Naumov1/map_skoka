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
export function ConclusionsPage({ show }: { show: (message: string) => void }) {
  const [items, setItems] = useState<Conclusion[]>([]);
  const [streets, setStreets] = useState<Street[]>([]);
  const [selectedStreets, setSelectedStreets] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [signed, setSigned] = useState(false);
  const [label, setLabel] = useState("Всего");

  async function load(path = "/conclusion/all", nextLabel = "Всего") {
    try {
      const data = await requestJson<{ conclusions?: Conclusion[] }>(path);
      setItems(data.conclusions || []);
      setLabel(nextLabel);
    } catch (error) {
      show(error instanceof Error ? error.message : "Ошибка загрузки заключений");
    }
  }

  useEffect(() => {
    if (isDemoMode()) {
      setItems(demoConclusions);
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
    if (signed) params.append("signed", "true");
    await load(`/conclusion/filter?${params.toString()}`, "Найдено");
  }

  return (
    <AdminLayout active="conclusions">
      <section className="metrics-grid">
        <MetricCard label="Заключений всего" value={items.length} tone="blue" />
        <MetricCard label="Подписано" value={items.filter((item) => item.signed).length} tone="green" />
        <MetricCard label="Ожидают подписи" value={items.filter((item) => !item.signed).length} />
      </section>
      <div className="toolbar">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Введите ФИО или кадастровый номер" />
        <button className="btn-primary" onClick={() => load(`/conclusion/search/${encodeURIComponent(search)}`, "Найдено")}><Search size={18} />Поиск</button>
        <button onClick={() => navigate("/conclusion_create/conclusion_create.html")}><PlusCircle size={18} />Создать</button>
      </div>
      <div className="counter-row"><strong>{label}: {items.length} {declension(items.length)}</strong></div>
      <div className="content">
        <aside className="filters">
          <StreetFilters streets={streets} selected={selectedStreets} setSelected={setSelectedStreets} />
          <label>Дата от<input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} /></label>
          <label>Дата до<input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} /></label>
          <label className="check-row"><input type="checkbox" checked={signed} onChange={(event) => setSigned(event.target.checked)} />Подписано</label>
          <button className="btn-primary" onClick={applyFilters}><Filter size={18} />Применить</button>
          <button onClick={() => { setSelectedStreets([]); setDateFrom(""); setDateTo(""); setSigned(false); load(); }}>Сбросить</button>
        </aside>
        <main className="applications-list">
          {items.length === 0 ? <EmptyState>Список заключений пуст.</EmptyState> : (
            <DataTable
              rows={items}
              getKey={(conclusion: Conclusion) => String(conclusion.conclusion_id || conclusion.id)}
              columns={[
                { key: "id", title: "ID", render: (conclusion: Conclusion) => <b>{conclusion.conclusion_id || conclusion.id}</b> },
                { key: "fio", title: "ФИО", render: (conclusion: Conclusion) => conclusion.fio },
                { key: "address", title: "Адрес", render: (conclusion: Conclusion) => conclusion.address },
                { key: "phone", title: "Телефон", render: (conclusion: Conclusion) => conclusion.phone },
                { key: "date", title: "Дата", render: (conclusion: Conclusion) => formatDate(conclusion.create_date, "Дата не указана") },
                { key: "action", title: "", render: (conclusion: Conclusion) => !conclusion.signed && <button className="btn-details"><FileSignature size={18} />Подписать</button> }
              ]}
              renderMobileCard={(conclusion: Conclusion) => (
                <article className="app-card">
                  <div className="card-line"><b>{conclusion.conclusion_id || conclusion.id}</b><span><b>ФИО:</b> {conclusion.fio}</span><span><b>Адрес:</b> {conclusion.address}</span><span><b>Телефон:</b> {conclusion.phone}</span><span><b>Дата:</b> {formatDate(conclusion.create_date, "Дата не указана")}</span></div>
                  {!conclusion.signed && <button className="btn-details"><FileSignature size={18} />Подписать</button>}
                </article>
              )}
            />
          )}
        </main>
      </div>
    </AdminLayout>
  );
}

