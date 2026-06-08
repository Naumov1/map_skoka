import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, ClipboardList, Download, Eye, FileSignature, Filter, PlusCircle, Search, Send, Sparkles } from "lucide-react";
import { API_BASE, apiFileUrl, requestJson } from "../../shared/api";
import type { Application, CommissionAnalysis, Conclusion, NotificationItem, Signature, Street, User } from "../../shared/types";
import { declension, formatDate, isAdminRole, isNotificationRead, normalizeRole, today } from "../../shared/lib";
import { isDemoMode, navigate } from "../../shared/router";
import { demoApplications, demoConclusions, demoNotifications, demoSignatures, demoStreets } from "../../shared/mocks/demo-data";
import { AdminLayout, MetricCard, UserLayout } from "../../widgets/layouts";
import { StreetFilters } from "../../features/street-filters";
export function UserHome() {
  return (
    <UserLayout active="user-home">
      <main className="home-panel">
        <section className="intro"><p className="eyebrow">Личный кабинет заявителя</p><h1>Подавайте заявления и следите за их рассмотрением</h1><p>Здесь можно создать новое заявление, указать данные заявителя, объект и описание проблемы. После отправки заявление появится в разделе “Мои заявления”.</p><div className="home-actions"><button className="btn-primary" onClick={() => navigate("/user/create.html")}><PlusCircle size={18} />Создать заявление</button><button onClick={() => navigate("/user/applications.html")}><ClipboardList size={18} />Мои заявления</button></div></section>
      </main>
    </UserLayout>
  );
}


