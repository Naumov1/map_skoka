import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Download, Eye, FileSignature, Filter, PlusCircle, Search, Send, Sparkles } from "lucide-react";
import { API_BASE, apiFileUrl, requestJson } from "../../shared/api";
import type { Application, CommissionAnalysis, Conclusion, NotificationItem, Signature, Street, User } from "../../shared/types";
import { declension, formatDate, isAdminRole, isNotificationRead, normalizeRole, today } from "../../shared/lib";
import { isDemoMode, navigate } from "../../shared/router";
import { demoApplications, demoConclusions, demoNotifications, demoSignatures, demoStreets } from "../../shared/mocks/demo-data";
import { AdminLayout, MetricCard, UserLayout } from "../../widgets/layouts";
import { StreetFilters } from "../../features/street-filters";
export function ApplicationDetailsPage({ show }: { show: (message: string) => void }) {
  const [application, setApplication] = useState<Application | null>(null);
  const [analysis, setAnalysis] = useState<CommissionAnalysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const id = new URLSearchParams(location.search).get("id");
  useEffect(() => {
    if (!id) return;
    requestJson<{ applications?: Application }>(`/applications/detail/${id}`)
      .then((data) => {
        const nextApplication = data.applications || null;
        setApplication(nextApplication);
        if (nextApplication?.commission_analysis) {
          try {
            setAnalysis(JSON.parse(nextApplication.commission_analysis) as CommissionAnalysis);
          } catch {
            setAnalysis(null);
          }
        }
      })
      .catch((error: Error) => show(error.message));
  }, [id]);

  async function buildAnalysis() {
    if (!id) return;
    setAnalysisLoading(true);
    try {
      const data = await requestJson<{ analysis?: CommissionAnalysis }>(`/applications/analyze/${id}`, { method: "POST" });
      setAnalysis(data.analysis || null);
      show("AI-анализ для комиссии сформирован");
    } catch (error) {
      show(error instanceof Error ? error.message : "Не удалось сформировать анализ");
    } finally {
      setAnalysisLoading(false);
    }
  }
  return (
    <AdminLayout active="details">
      <main>
        <button className="link-btn" onClick={() => history.back()}>Назад</button>
        <h1>Заявление №{application?.id || id}</h1>
        <div className="details-grid">
          <section className="panel wide commission-panel">
            <div className="panel-heading">
              <div>
                <h3>AI-анализ для комиссии</h3>
                <p>Краткий разбор: кто нужен, что случилось и как действовать.</p>
              </div>
              <button className="btn-primary" onClick={buildAnalysis} disabled={analysisLoading || !application}>
                <Sparkles size={18} />{analysisLoading ? "Формируем..." : "Сформировать"}
              </button>
            </div>
            {application?.problem && <div className="analysis-source"><b>Описание заявителя:</b> {application.problem}</div>}
            {analysis ? (
              <div className="analysis-grid">
                <div><span>Категория</span><strong>{analysis.category}</strong></div>
                <div><span>Срочность</span><strong>{analysis.urgency}</strong></div>
                <div className="wide"><span>Что случилось</span><p>{analysis.what_happened}</p></div>
                <div><span>Кто нужен</span><ul>{analysis.who_needed.map((item) => <li key={item}>{item}</li>)}</ul></div>
                <div><span>Как действовать</span><ol>{analysis.recommended_actions.map((item) => <li key={item}>{item}</li>)}</ol></div>
                <div><span>Фокус комиссии</span><ul>{analysis.commission_focus.map((item) => <li key={item}>{item}</li>)}</ul></div>
                <div><span>Риски</span><ul>{analysis.risks.map((item) => <li key={item}>{item}</li>)}</ul></div>
              </div>
            ) : (
              <div className="empty-block">Нажмите "Сформировать", чтобы подготовить бриф для комиссии.</div>
            )}
          </section>
          <section className="panel"><h3>Основные данные</h3><p><b>ФИО:</b> {application?.fio}</p><p><b>Телефон:</b> {application?.phone}</p><p><b>Email:</b> {application?.email}</p><p><b>Адрес:</b> {application?.address}</p><p><b>Кадастровый номер:</b> {application?.cadastral_number}</p></section>
          <section className="panel"><h3>Статус</h3><span className="status-badge">{application?.status || "-"}</span></section>
        </div>
        {id && <><iframe className="doc-frame" src={apiFileUrl(`/applications/view/${id}`)} title="Документ заявления" /><a className="btn-primary" href={apiFileUrl(`/applications/download/${id}`)}><Download size={18} />Скачать документ</a></>}
      </main>
    </AdminLayout>
  );
}

