import { useEffect, useState } from "react";

export type Page = "login" | "register" | "admin-apps" | "risk-map" | "details" | "conclusions" | "create-conclusion" | "signed" | "admin-notifications" | "admin-profile" | "user-home" | "user-create" | "user-apps" | "user-notifications" | "user-profile";
export function isDemoMode() {
  return new URLSearchParams(location.search).get("demo") === "1" || localStorage.getItem("docflow-demo") === "1";
}

export function enableDemoMode(path = "/applications/applications.html") {
  localStorage.setItem("docflow-demo", "1");
  navigate(path);
}

export function pathToPage(pathname: string): Page {
  if (pathname.includes("/auth/register")) return "register";
  if (pathname.includes("/auth/login")) return "login";
  if (pathname.includes("/risk-map")) return "risk-map";
  if (pathname.includes("/application_details")) return "details";
  if (pathname.includes("/conclusion_create")) return "create-conclusion";
  if (pathname.includes("/conclusion")) return "conclusions";
  if (pathname.includes("/signed")) return "signed";
  if (pathname.includes("/notifications") && !pathname.includes("/user/")) return "admin-notifications";
  if (pathname.includes("/profile") && !pathname.includes("/user/")) return "admin-profile";
  if (pathname.includes("/user/create")) return "user-create";
  if (pathname.includes("/user/applications")) return "user-apps";
  if (pathname.includes("/user/notifications")) return "user-notifications";
  if (pathname.includes("/user/profile")) return "user-profile";
  if (pathname.includes("/user")) return "user-home";
  return "admin-apps";
}

export function useLocationPage() {
  const [page, setPage] = useState<Page>(() => pathToPage(location.pathname));
  useEffect(() => {
    const onPop = () => setPage(pathToPage(location.pathname));
    addEventListener("popstate", onPop);
    return () => removeEventListener("popstate", onPop);
  }, []);
  return page;
}

export function navigate(path: string) {
  history.pushState(null, "", path);
  dispatchEvent(new PopStateEvent("popstate"));
}
