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
export function SignedPage({ show }: { show: (message: string) => void }) {
  const [items, setItems] = useState<Signature[]>([]);
  const [streets, setStreets] = useState<Street[]>([]);
  const [selectedStreets, setSelectedStreets] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  async function load(path = "/signature/all") {
    try {
      const data = await requestJson<{ signatures?: Signature[] }>(path);
      setItems(data.signatures || []);
    } catch (error) {
      show(error instanceof Error ? error.message : "Ошибка загрузки подписанных документов");
    }
  }

  useEffect(() => {
    if (isDemoMode()) {
      setItems(demoSignatures);
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
    await load(`/signature/filter?${params.toString()}`);
  }

  return (
    <AdminLayout active="signed">
      <section className="metrics-grid">
        <MetricCard label="Документов в архиве" value={items.length} tone="green" />
        <MetricCard label="Готовы к выгрузке" value={items.length} tone="blue" />
      </section>
      <div className="toolbar"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Введите ФИО или кадастровый номер" /><button className="btn-primary" onClick={() => load(`/signature/search/${encodeURIComponent(search)}`)}><Search size={18} />Поиск</button></div>
      <div className="counter-row"><strong>Всего: {items.length} {declension(items.length)}</strong></div>
      <div className="content">
        <aside className="filters"><StreetFilters streets={streets} selected={selectedStreets} setSelected={setSelectedStreets} /><label>Дата от<input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} /></label><label>Дата до<input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} /></label><button className="btn-primary" onClick={applyFilters}><Filter size={18} />Применить</button><button onClick={() => { setSelectedStreets([]); setDateFrom(""); setDateTo(""); load(); }}>Сбросить</button></aside>
        <main className="applications-list">
          {items.length === 0 ? <EmptyState>Список документов пуст.</EmptyState> : (
            <DataTable
              rows={items}
              getKey={(item: Signature) => item.conclusion_id}
              columns={[
                { key: "id", title: "ID", render: (item: Signature) => <b>{item.conclusion_id}</b> },
                { key: "fio", title: "ФИО", render: (item: Signature) => item.fio },
                { key: "address", title: "Адрес", render: (item: Signature) => item.address },
                { key: "cad", title: "Кадастровый номер", render: (item: Signature) => item.cadastral_number },
                { key: "action", title: "", render: (item: Signature) => <a className="btn-details" href={apiFileUrl(`/conclusion/download/${item.conclusion_id}`)}><Download size={18} />Скачать</a> }
              ]}
              renderMobileCard={(item: Signature) => (
                <article className="app-card">
                  <div className="card-line"><b>{item.conclusion_id}</b><span><b>ФИО:</b> {item.fio}</span><span><b>Адрес:</b> {item.address}</span><span><b>Кадастровый номер:</b> {item.cadastral_number}</span></div>
                  <a className="btn-details" href={apiFileUrl(`/conclusion/download/${item.conclusion_id}`)}><Download size={18} />Скачать</a>
                </article>
              )}
            />
          )}
        </main>
      </div>
    </AdminLayout>
  );
}

