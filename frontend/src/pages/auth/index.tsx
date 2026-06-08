import { FormEvent } from "react";
import { motion } from "framer-motion";
import { KeyRound, Send, Sparkles } from "lucide-react";
import { requestJson } from "../../shared/api";
import { isUserRole } from "../../shared/lib";
import { enableDemoMode, navigate } from "../../shared/router";
import { getMe } from "../../features/auth/session";
export function AuthPage({ mode, show }: { mode: "login" | "register"; show: (message: string) => void }) {
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const login = String(form.get("login") || "").trim();
    const password = String(form.get("password") || "").trim();

    try {
      if (mode === "register") {
        const confirmPassword = String(form.get("confirmPassword") || "").trim();
        if (password !== confirmPassword) {
          show("Пароли не совпадают");
          return;
        }
        await requestJson("/auth/register", {
          method: "POST",
          body: JSON.stringify({
            login,
            fio: String(form.get("fio") || "").trim(),
            email: String(form.get("email") || "").trim(),
            password
          })
        });
        show("Регистрация прошла успешно");
        navigate("/auth/login.html");
        return;
      }

      await requestJson("/auth/login", { method: "POST", body: JSON.stringify({ login, password }) });
      const profile = await getMe();
      navigate(isUserRole(profile.role) ? "/user/index.html" : "/applications/applications.html");
    } catch (error) {
      show(error instanceof Error ? error.message : "Ошибка авторизации");
    }
  }

  return (
    <main className="auth-page">
      <motion.section className="auth-container" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
        <div className="auth-brand">
          <span className="brand-mark auth-mark"><img src="/assets/brand-mark.png" alt="" /></span>
          <span>
            <strong>ФасадКонтроль</strong>
            <small>карта рисков фасадов и кровель</small>
          </span>
        </div>
        <h1>{mode === "login" ? "Вход" : "Регистрация"}</h1>
        <form onSubmit={submit}>
          <label>Логин<input name="login" required /></label>
          {mode === "register" && <label>ФИО<input name="fio" required /></label>}
          {mode === "register" && <label>Email<input name="email" type="email" required /></label>}
          <label>Пароль<input name="password" type="password" required /></label>
          {mode === "register" && <label>Повторите пароль<input name="confirmPassword" type="password" required /></label>}
          <button type="submit" className="btn-primary">{mode === "login" ? <><KeyRound size={18} />Войти</> : <><Send size={18} />Зарегистрироваться</>}</button>
          <button type="button" onClick={() => enableDemoMode()}>
            <Sparkles size={18} />
            Открыть демо-режим
          </button>
          <button type="button" className="link-btn centered" onClick={() => navigate(mode === "login" ? "/auth/register.html" : "/auth/login.html")}>
            {mode === "login" ? "Нет аккаунта? Зарегистрироваться" : "Уже есть аккаунт? Войти"}
          </button>
        </form>
      </motion.section>
    </main>
  );
}

