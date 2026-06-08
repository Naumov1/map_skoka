import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Download, Eye, FileSignature, Filter, KeyRound, PlusCircle, Search, Send, Sparkles, Users } from "lucide-react";
import { API_BASE, apiFileUrl, requestJson } from "../../shared/api";
import type { Application, CommissionAnalysis, Conclusion, NotificationItem, Signature, Street, User } from "../../shared/types";
import { declension, formatDate, isAdminRole, isNotificationRead, normalizeRole, today } from "../../shared/lib";
import { isDemoMode, navigate } from "../../shared/router";
import { demoApplications, demoConclusions, demoNotifications, demoSignatures, demoStreets, demoUser } from "../../shared/mocks/demo-data";
import { AdminLayout, MetricCard, UserLayout } from "../../widgets/layouts";
import { StreetFilters } from "../../features/street-filters";
import { getMe } from "../../features/auth/session";
export function AdminProfilePage({ show }: { show: (message: string) => void }) {
  const [profile, setProfile] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const isAdmin = normalizeRole(profile?.role) === "Администратор";

  async function loadProfile() {
    if (isDemoMode()) {
      setProfile(demoUser);
      setUsers([
        demoUser,
        { id: 2, login: "employee", fio: "Петрова Мария Сергеевна", email: "employee@example.com", role: "Сотрудник" },
        { id: 3, login: "citizen", fio: "Иванов Сергей Петрович", email: "ivanov@example.com", role: "Пользователь" }
      ]);
      return;
    }
    const me = await getMe();
    setProfile(me);
    if (normalizeRole(me.role) === "Администратор") {
      const data = await requestJson<{ users?: User[] }>("/auth/");
      setUsers(data.users || []);
    }
  }

  useEffect(() => { loadProfile().catch((error: Error) => show(error.message)); }, []);

  async function updateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const fio = String(form.get("fio") || "").trim();
    const email = String(form.get("email") || "").trim();
    try {
      if (fio) await requestJson("/auth/edit-fio", { method: "PATCH", body: JSON.stringify({ fio }) });
      if (email) await requestJson("/auth/edit-email", { method: "PATCH", body: JSON.stringify({ email }) });
      show("Данные профиля сохранены");
      await loadProfile();
    } catch (error) {
      show(error instanceof Error ? error.message : "Ошибка сохранения профиля");
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = { last_password: String(form.get("oldPassword") || ""), new_password: String(form.get("newPassword") || ""), confirm_password: String(form.get("confirmPassword") || "") };
    if (payload.new_password !== payload.confirm_password) {
      show("Новый пароль и подтверждение не совпадают");
      return;
    }
    await requestJson("/auth/edit-password", { method: "PATCH", body: JSON.stringify(payload) });
    show("Пароль успешно изменён");
    event.currentTarget.reset();
  }

  return (
    <AdminLayout active="admin-profile">
      <main className="profile-grid">
        <section className="panel"><h1>Личный кабинет</h1><p><b>Логин:</b> {profile?.login || profile?.username}</p><p><b>ФИО:</b> {profile?.fio}</p><p><b>Email:</b> {profile?.email}</p><p><b>Статус:</b> {normalizeRole(profile?.role)}</p></section>
        <form className="panel" onSubmit={updateProfile}><h2>Редактировать данные</h2><label>ФИО<input name="fio" defaultValue={profile?.fio || ""} /></label><label>Email<input name="email" type="email" defaultValue={profile?.email || ""} /></label><button className="btn-primary"><CheckCircle2 size={18} />Сохранить</button></form>
        <form className="panel" onSubmit={changePassword}><h2>Изменить пароль</h2><label>Старый пароль<input name="oldPassword" type="password" required /></label><label>Новый пароль<input name="newPassword" type="password" required /></label><label>Подтверждение<input name="confirmPassword" type="password" required /></label><button className="btn-primary"><KeyRound size={18} />Сохранить пароль</button></form>
        {isAdmin && <section className="panel wide"><h2><Users size={22} />Пользователи</h2><div className="table-wrap"><table><thead><tr><th>ID</th><th>Логин</th><th>ФИО</th><th>Email</th><th>Статус</th></tr></thead><tbody>{users.map((user) => <tr key={String(user.id)}><td>{user.id}</td><td>{user.login}</td><td>{user.fio}</td><td>{user.email}</td><td>{normalizeRole(user.role)}</td></tr>)}</tbody></table></div></section>}
      </main>
    </AdminLayout>
  );
}
export function UserProfilePage({ user, show }: { user: User | null; show: (message: string) => void }) {
  return <UserLayout active="user-profile"><main><AdminProfileLite user={user} show={show} /></main></UserLayout>;
}

function AdminProfileLite({ user, show }: { user: User | null; show: (message: string) => void }) {
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await requestJson("/auth/edit-fio", { method: "PATCH", body: JSON.stringify({ fio: String(form.get("fio") || "") }) });
      await requestJson("/auth/edit-email", { method: "PATCH", body: JSON.stringify({ email: String(form.get("email") || "") }) });
      show("Профиль сохранён");
    } catch (error) {
      show(error instanceof Error ? error.message : "Ошибка сохранения профиля");
    }
  }
  return <section className="profile-grid"><section className="panel"><h1>Профиль</h1><p><b>Логин:</b> {user?.login || user?.username}</p><p><b>ФИО:</b> {user?.fio}</p><p><b>Email:</b> {user?.email}</p></section><form className="panel" onSubmit={submit}><h2>Редактировать</h2><label>ФИО<input name="fio" defaultValue={user?.fio || ""} /></label><label>Email<input name="email" defaultValue={user?.email || ""} /></label><button className="btn-primary">Сохранить</button></form></section>;
}





