import { useEffect } from "react";
import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { requestJson } from "../shared/api";
import { navigate, useLocationPage } from "../shared/router";
import { useToast } from "../shared/ui/toast";
import { useGuard } from "../features/auth/session";
import { AuthPage } from "../pages/auth";
import { RiskMapPage } from "../pages/risk-map";
import { ApplicationsPage } from "../pages/applications";
import { ApplicationDetailsPage } from "../pages/application-details";
import { ConclusionsPage } from "../pages/conclusions";
import { CreateConclusionPage } from "../pages/create-conclusion";
import { SignedPage } from "../pages/signed";
import { NotificationsPage } from "../pages/notifications";
import { AdminProfilePage, UserProfilePage } from "../pages/profile";
import { UserHome } from "../pages/user-home";
import { UserCreatePage } from "../pages/user-create";
import { UserApplicationsPage } from "../pages/user-applications";

const pageMotion = {
  initial: { opacity: 0, y: 16, scale: 0.99 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -8, scale: 0.995 },
  transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] as const }
};

export function App() {
  const page = useLocationPage();
  const { toast, show } = useToast();
  const { user, ready } = useGuard(page, show);

  useEffect(() => {
    if (location.pathname.includes("/logout")) {
      localStorage.removeItem("docflow-demo");
      requestJson("/auth/logout", { method: "POST" }).finally(() => navigate("/auth/login.html"));
    }
  }, [page]);

  let content: ReactNode;
  if (page === "login") content = <AuthPage mode="login" show={show} />;
  else if (page === "register") content = <AuthPage mode="register" show={show} />;
  else if (!ready) content = <main className="loading">Загрузка...</main>;
  else if (page === "risk-map") content = <RiskMapPage show={show} />;
  else if (page === "details") content = <ApplicationDetailsPage show={show} />;
  else if (page === "conclusions") content = <ConclusionsPage show={show} />;
  else if (page === "create-conclusion") content = <CreateConclusionPage show={show} />;
  else if (page === "signed") content = <SignedPage show={show} />;
  else if (page === "admin-notifications") content = <NotificationsPage show={show} />;
  else if (page === "admin-profile") content = <AdminProfilePage show={show} />;
  else if (page === "user-home") content = <UserHome />;
  else if (page === "user-create") content = <UserCreatePage user={user} show={show} />;
  else if (page === "user-apps") content = <UserApplicationsPage show={show} />;
  else if (page === "user-notifications") content = <NotificationsPage userMode show={show} />;
  else if (page === "user-profile") content = <UserProfilePage user={user} show={show} />;
  else content = <ApplicationsPage show={show} />;

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div key={page} {...pageMotion}>
          {content}
        </motion.div>
      </AnimatePresence>
      <AnimatePresence>
        {toast && (
          <motion.div className="toast" initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 18, scale: 0.98 }}>
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
