import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Download, Eye, FileSignature, Filter, PlusCircle, Search, Send, Sparkles } from "lucide-react";
import { API_BASE, apiFileUrl, requestJson } from "../../shared/api";
import type { Application, CommissionAnalysis, Conclusion, NotificationItem, Signature, Street, User } from "../../shared/types";
import { declension, formatDate, isAdminRole, isNotificationRead, normalizeRole, today } from "../../shared/lib";
import { isDemoMode, navigate } from "../../shared/router";
import { demoApplications, demoConclusions, demoNotifications, demoSignatures, demoStreets } from "../../shared/mocks/demo-data";
import { AdminLayout, MetricCard, UserLayout } from "../../widgets/layouts";
import { StreetFilters } from "../../features/street-filters";
export function CreateConclusionPage({ show }: { show: (message: string) => void }) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [members, setMembers] = useState<string[]>([]);

  useEffect(() => {
    requestJson<{ applications?: Application[] }>("/applications/filter?is_departure=true").then((data) => setApplications(data.applications || [])).catch((error: Error) => show(error.message));
    requestJson<{ users?: User[] }>("/auth/employee").then((data) => setEmployees(data.users || [])).catch((error: Error) => show(error.message));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const chairmanId = String(form.get("chairman") || "");
    const chairman = employees.find((employee) => String(employee.id) === chairmanId);
    const selectedMembers = employees.filter((employee) => members.includes(String(employee.id)));
    if (!form.get("statement") || !chairman || selectedMembers.length === 0) {
      show("Выберите заявление, председателя и членов комиссии");
      return;
    }
    try {
      await requestJson("/conclusion/create", {
        method: "POST",
        body: JSON.stringify({
          applications_id: Number(form.get("statement")),
          date: new Date(String(form.get("date"))).toISOString(),
          chairman: { id: Number(chairman.id), fio: chairman.fio, role: normalizeRole(chairman.role) },
          members: selectedMembers.map((member) => ({ id: Number(member.id), fio: member.fio, role: normalizeRole(member.role) })),
          documents: String(form.get("documents") || "").trim(),
          justification: String(form.get("inspection") || "").trim(),
          conclusion: String(form.get("conclusion") || "").trim()
        })
      });
      show("Заключение успешно создано");
      event.currentTarget.reset();
      setMembers([]);
    } catch (error) {
      show(error instanceof Error ? error.message : "Ошибка создания заключения");
    }
  }

  return (
    <AdminLayout active="create-conclusion">
      <main className="form-container">
        <h1>Создание заключения комиссии</h1>
        <form className="form-grid" onSubmit={submit}>
          <label className="full-width">Выбор заявления<select name="statement" required><option value="">Выберите заявление</option>{applications.map((application) => <option key={application.id} value={application.id}>{application.id}: {application.fio} - {application.street || application.address}</option>)}</select></label>
          <label>Дата создания<input type="date" name="date" defaultValue={today()} required /></label>
          <label>Председатель<select name="chairman" required><option value="">Выберите председателя</option>{employees.map((user) => <option key={String(user.id)} value={String(user.id)}>{user.fio} ({normalizeRole(user.role)})</option>)}</select></label>
          <label className="full-width">Члены комиссии<select multiple value={members} onChange={(event) => setMembers(Array.from(event.currentTarget.selectedOptions, (option) => option.value))}>{employees.map((user) => <option key={String(user.id)} value={String(user.id)}>{user.fio} ({normalizeRole(user.role)})</option>)}</select></label>
          <label className="full-width">По результатам рассмотренных документов<textarea name="documents" rows={6} /></label>
          <label className="full-width">Результат обследования<textarea name="inspection" rows={3} /></label>
          <label className="full-width">Комиссия приняла заключение о<textarea name="conclusion" rows={3} /></label>
          <div className="form-actions"><button type="button" onClick={() => history.back()}>Назад</button><button className="btn-primary" type="submit"><FileSignature size={18} />Создать</button></div>
        </form>
      </main>
    </AdminLayout>
  );
}

