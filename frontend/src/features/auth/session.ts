import { useEffect, useState } from "react";
import { requestJson } from "../../shared/api";
import type { Page } from "../../shared/router";
import type { User } from "../../shared/types";
import { isAdminRole, isUserRole, normalizeRole, normalizeUser } from "../../shared/lib";
import { demoUser } from "../../shared/mocks/demo-data";
import { isDemoMode, navigate } from "../../shared/router";

export async function getMe() {
  return normalizeUser(await requestJson<unknown>("/auth/me", { method: "GET" }));
}
export function useGuard(page: Page, show: (message: string) => void) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const publicPage = page === "login" || page === "register";
    if (publicPage) {
      setReady(true);
      return;
    }

    if (isDemoMode()) {
      setUser(demoUser);
      setReady(true);
      return;
    }

    setReady(false);
    getMe()
      .then((profile) => {
        setUser(profile);
        if (page.toString().startsWith("user-") && isAdminRole(profile.role)) navigate("/applications/applications.html");
        if (!page.toString().startsWith("user-") && isUserRole(profile.role)) navigate("/user/index.html");
      })
      .catch((error: Error) => {
        show(error.message);
        navigate("/auth/login.html");
      })
      .finally(() => setReady(true));
  }, [page, show]);

  return { user, ready };
}
