import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  Bell,
  Building2,
  CheckCircle2,
  ClipboardList,
  Download,
  Eye,
  FileSignature,
  FileText,
  Film,
  Flower2,
  Filter,
  Home,
  KeyRound,
  LayoutDashboard,
  LogOut,
  MapPin,
  PlusCircle,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  UserCircle,
  Users
} from "lucide-react";
import { apiFileUrl, requestJson } from "./api";
import type { Application, CommissionAnalysis, Conclusion, NotificationItem, Signature, Street, User } from "./types";
import { declension, formatDate, isAdminRole, isNotificationRead, isUserRole, normalizeRole, normalizeUser } from "./utils";

type Toast = { id: number; text: string };
type Page = "login" | "register" | "admin-apps" | "risk-map" | "details" | "conclusions" | "create-conclusion" | "signed" | "admin-notifications" | "admin-profile" | "user-home" | "user-create" | "user-apps" | "user-notifications" | "user-profile";
type ThemeMode = "default" | "cinema" | "lemme";
type YandexGeoObject = {
  events?: {
    add: (eventName: string, callback: () => void) => void;
  };
};
type YandexMapInstance = {
  geoObjects: {
    add: (object: YandexGeoObject) => void;
  };
  controls: {
    remove: (name: string) => void;
  };
  behaviors?: {
    disable: (name: string | string[]) => void;
  };
  destroy: () => void;
};
type YandexMapsApi = {
  ready: (callback: () => void) => void;
  Map: new (container: HTMLElement, state: Record<string, unknown>, options?: Record<string, unknown>) => YandexMapInstance;
  Placemark: new (coordinates: [number, number], properties?: Record<string, unknown>, options?: Record<string, unknown>) => YandexGeoObject;
  Circle: new (geometry: [[number, number], number], properties?: Record<string, unknown>, options?: Record<string, unknown>) => YandexGeoObject;
};

declare global {
  interface Window {
    ymaps?: YandexMapsApi;
    yandexMapsPromise?: Promise<YandexMapsApi>;
  }
}

const today = () => new Date().toISOString().split("T")[0];
const getInitialTheme = (): ThemeMode => {
  const theme = localStorage.getItem("docflow-theme");
  return theme === "cinema" || theme === "lemme" ? theme : "default";
};
const demoUser: User = {
  id: 1,
  login: "demo",
  fio: "Наумов Вадим",
  email: "vadim@example.com",
  role: "Администратор"
};

const demoStreets: Street[] = [
  { street: "ул. Плехановская" },
  { street: "ул. Московский проспект" },
  { street: "ул. Кольцовская" },
  { street: "ул. Ворошилова" },
  { street: "ул. Ленина" },
  { street: "ул. Пушкинская" },
  { street: "ул. 9 Января" },
  { street: "ул. Ломоносова" },
  { street: "ул. Революции 1905 года" },
  { street: "ул. 20-летия Октября" },
  { street: "ул. Танеева" },
  { street: "ул. Шишкова" },
  { street: "ул. Электросигнальная" },
  { street: "ул. Воронежская" },
  { street: "ул. Генерала Лизюкова" },
  { street: "ул. Маршака" },
  { street: "ул. Домостроителей" },
  { street: "ул. Остужева" },
  { street: "Ленинский проспект" },
  { street: "ул. Минская" },
  { street: "ул. Никитинская" },
  { street: "ул. Фридриха Энгельса" },
  { street: "ул. Космонавтов" },
  { street: "ул. Южно-Моравская" },
  { street: "ул. Хользунова" },
  { street: "ул. Беговая" }
];

const demoApplications: Application[] = [
  {
    id: 1024,
    fio: "Иванов Сергей Петрович",
    phone: "+7 900 123-45-67",
    email: "ivanov@example.com",
    street: "ул. Плехановская",
    address: "ул. Плехановская, 18",
    cadastral_number: "36:34:0102034:128",
    problem: "С фасада падает шифер и куски отделки, у подъезда появились трещины.",
    status: "Назначен выезд",
    departure_date: "2026-05-07"
  },
  {
    id: 1025,
    fio: "Соколова Анна Викторовна",
    phone: "+7 900 998-14-22",
    email: "sokolova@example.com",
    street: "ул. Московский проспект",
    address: "ул. Московский проспект, 91",
    cadastral_number: "36:34:0405067:442",
    problem: "Старый дом, протекает крыша, в подъезде влажность и осыпается штукатурка.",
    status: "Заявление принято",
    departure_date: null
  },
  {
    id: 1026,
    fio: "Морозов Дмитрий Игоревич",
    phone: "+7 920 667-10-40",
    email: "morozov@example.com",
    street: "ул. Кольцовская",
    address: "ул. Кольцовская, 24",
    cadastral_number: "36:34:0901123:015",
    problem: "Разрушается балкон, бетон осыпается во двор рядом с входом.",
    status: "Заключение на рассмотрении",
    departure_date: "2026-05-06"
  },
  {
    id: 1101,
    fio: "Жители дома, публичное обращение",
    phone: "не указан",
    email: "public-vrn@example.com",
    street: "ул. Плехановская",
    address: "г. Воронеж, ул. Плехановская, 15",
    cadastral_number: "публичный пример",
    problem: "По открытому сообщению: в центре Воронежа на тротуар обрушилась часть фасада. Требуется ограждение зоны, осмотр карниза, штукатурного слоя и несущих элементов.",
    commission_analysis: "Нужны представитель УК, инженер-строитель и специалист по фасадам. Риск падения материалов на пешеходную зону.",
    status: "Срочный осмотр",
    departure_date: "2026-05-29"
  },
  {
    id: 1102,
    fio: "Жители дома, публичное обращение",
    phone: "не указан",
    email: "public-vrn@example.com",
    street: "ул. Пушкинская",
    address: "г. Воронеж, ул. Пушкинская, 2",
    cadastral_number: "публичный пример",
    problem: "По открытому сообщению: частично обрушился штукатурный слой под карнизом фасада. Рядом проходит пешеходная зона, возможен повторный обвал.",
    commission_analysis: "Проверить фасад, карниз, крепления отделочного слоя и соседние дома старого фонда.",
    status: "Срочный осмотр",
    departure_date: "2026-05-29"
  },
  {
    id: 1103,
    fio: "Жители дома, публичное обращение",
    phone: "не указан",
    email: "public-vrn@example.com",
    street: "ул. Пушкинская",
    address: "г. Воронеж, ул. Пушкинская, 4",
    cadastral_number: "публичный пример",
    problem: "Жильцы соседнего дома сообщали об опасном состоянии карниза. Есть признаки отслаивания штукатурки и риск падения фрагментов фасада.",
    commission_analysis: "Обследовать дом как похожий объект рядом с адресом, где уже было падение фасада.",
    status: "Проверка похожего дома",
    departure_date: null
  },
  {
    id: 1104,
    fio: "Жители дома, публичное обращение",
    phone: "не указан",
    email: "public-vrn@example.com",
    street: "ул. 9 Января",
    address: "г. Воронеж, ул. 9 Января, 154",
    cadastral_number: "публичный пример",
    problem: "По открытому сообщению: у двухэтажного жилого дома рухнул карниз и часть фасадной штукатурки. Дом относится к проблемному старому фонду.",
    commission_analysis: "Оградить проход, удалить непрочно держащиеся элементы, включить дом в приоритет фасадного ремонта.",
    status: "Назначен выезд",
    departure_date: "2026-05-30"
  },
  {
    id: 1105,
    fio: "Жители семи квартир, публичное обращение",
    phone: "не указан",
    email: "public-vrn@example.com",
    street: "ул. Ломоносова",
    address: "г. Воронеж, ул. Ломоносова, 116/9",
    cadastral_number: "публичный пример",
    problem: "По открытому сообщению: крыша протекает до третьего этажа, вода попадает в квартиры и подъезд. После ремонта кровли проблема сохранилась у проблемного подъезда.",
    commission_analysis: "Нужны осмотр кровли, проверка водоотведения, акт протечки и повторная проверка качества ремонта.",
    status: "Заявление принято",
    departure_date: null
  },
  {
    id: 1106,
    fio: "Жители дома, публичное обращение",
    phone: "не указан",
    email: "public-vrn@example.com",
    street: "ул. Революции 1905 года",
    address: "г. Воронеж, ул. Революции 1905 года, 25",
    cadastral_number: "публичный пример",
    problem: "По открытому сообщению: протекает крыша, вода попадает к электропроводке и разрушает стены в подъезде. Есть риск короткого замыкания.",
    commission_analysis: "Срочно проверить кровлю и электрику, отключить опасные участки при необходимости, составить акт повреждений.",
    status: "Срочный осмотр",
    departure_date: "2026-05-29"
  },
  {
    id: 1107,
    fio: "Житель дома, публичное обращение",
    phone: "не указан",
    email: "public-vrn@example.com",
    street: "ул. 20-летия Октября",
    address: "г. Воронеж, ул. 20-летия Октября, 95Б",
    cadastral_number: "публичный пример",
    problem: "По открытому сообщению: разрушается козырек входной группы, подъезд не отапливается, есть риск падения фрагментов над входом.",
    commission_analysis: "Проверить козырек, плиту входной группы, отопление подъезда и безопасность прохода жильцов.",
    status: "Предписание к проверке",
    departure_date: null
  },
  {
    id: 1108,
    fio: "Жители дома, публичное обращение",
    phone: "не указан",
    email: "public-vrn@example.com",
    street: "ул. Танеева",
    address: "г. Воронеж, ул. Танеева, 10",
    cadastral_number: "публичный пример",
    problem: "По открытому сообщению: на чердаке виден просвет вместо крыши, проломились шифер и балка перекрытия. Крыша протекает, квартиры под угрозой залива.",
    commission_analysis: "Нужен срочный осмотр кровли, балок перекрытия и временная защита от осадков.",
    status: "Срочный осмотр",
    departure_date: "2026-05-30"
  },
  {
    id: 1109,
    fio: "Жители дома, публичное обращение",
    phone: "не указан",
    email: "public-vrn@example.com",
    street: "ул. Шишкова",
    address: "г. Воронеж, ул. Шишкова, 95А",
    cadastral_number: "публичный пример",
    problem: "По открытому сообщению: на фасаде дома несколько лет сохранялась трещина, жильцы считают выполненную заделку недостаточной. В одной из квартир ранее была сквозная щель.",
    commission_analysis: "Проверить динамику трещин, фасадные панели, швы и состояние несущих конструкций.",
    status: "Повторная проверка",
    departure_date: null
  },
  {
    id: 1110,
    fio: "Жители дома, публичное обращение",
    phone: "не указан",
    email: "public-vrn@example.com",
    street: "ул. Электросигнальная",
    address: "г. Воронеж, ул. Электросигнальная, 31",
    cadastral_number: "публичный пример",
    problem: "По открытому сообщению: в доме протекает кровля, в квартирах сыро, на стенах появилась плесень. Состоянием дома заинтересовались надзорные органы.",
    commission_analysis: "Проверить кровлю, вентиляцию, влажность стен и риски разрушения отделки подъезда.",
    status: "Заявление принято",
    departure_date: null
  },
  {
    id: 1111,
    fio: "Жители дома, публичное обращение",
    phone: "не указан",
    email: "public-vrn@example.com",
    street: "ул. Воронежская",
    address: "г. Воронеж, ул. Воронежская, 38",
    cadastral_number: "публичный пример",
    problem: "По открытому сообщению: крыша протекает много лет, подъезды затапливаются, чердак заметает снегом. Экспертное обследование подтверждало плохое состояние кровли.",
    commission_analysis: "Проверить кровлю, чердак, стропильные элементы и включить дом в приоритет капитального ремонта.",
    status: "Проверка после жалобы",
    departure_date: null
  },
  {
    id: 1112,
    fio: "Жители дома, учебное обращение",
    phone: "не указан",
    email: "sample-vrn@example.com",
    street: "ул. Генерала Лизюкова",
    address: "г. Воронеж, ул. Генерала Лизюкова, 66",
    cadastral_number: "учебный пример",
    problem: "В панельном доме расходятся межпанельные швы, в подъезде мокрые пятна и промерзание стен. Жильцы опасаются дальнейшего разрушения фасадных стыков.",
    commission_analysis: "Проверить межпанельные швы, герметизацию фасада, влажность в подъезде и состояние наружных плит.",
    status: "Заявление принято",
    departure_date: null
  },
  {
    id: 1113,
    fio: "Жители дома, учебное обращение",
    phone: "не указан",
    email: "sample-vrn@example.com",
    street: "ул. Маршака",
    address: "г. Воронеж, ул. Маршака, 16",
    cadastral_number: "учебный пример",
    problem: "В подвале постоянно стоит вода, в первом подъезде сырость и запах плесени. На стенах появились трещины у входной группы.",
    commission_analysis: "Проверить подвал, дренаж, фундаментные стены, вентиляцию и риски осадки входной группы.",
    status: "Назначен выезд",
    departure_date: "2026-05-31"
  },
  {
    id: 1114,
    fio: "Жители дома, учебное обращение",
    phone: "не указан",
    email: "sample-vrn@example.com",
    street: "ул. Домостроителей",
    address: "г. Воронеж, ул. Домостроителей, 24",
    cadastral_number: "учебный пример",
    problem: "В подъезде осыпается бетон на лестничной площадке, видна арматура, ступени крошатся. Нужна проверка лестничного марша.",
    commission_analysis: "Проверить лестничные марши, площадки, защитный слой бетона и безопасность эвакуационного прохода.",
    status: "Срочный осмотр",
    departure_date: "2026-05-30"
  },
  {
    id: 1115,
    fio: "Жители дома, учебное обращение",
    phone: "не указан",
    email: "sample-vrn@example.com",
    street: "ул. Остужева",
    address: "г. Воронеж, ул. Остужева, 28",
    cadastral_number: "учебный пример",
    problem: "После дождя вода течет по стенам подъезда, на потолке пятна, штукатурка отходит пластами. Есть риск падения отделки на лестнице.",
    commission_analysis: "Проверить кровлю, водостоки, чердак, штукатурный слой и необходимость временного ограждения.",
    status: "Заявление принято",
    departure_date: null
  },
  {
    id: 1116,
    fio: "Жители дома, учебное обращение",
    phone: "не указан",
    email: "sample-vrn@example.com",
    street: "Ленинский проспект",
    address: "г. Воронеж, Ленинский проспект, 174/6",
    cadastral_number: "учебный пример",
    problem: "На фасаде у балконов видны трещины, с плиты балкона осыпается бетон. Под домом проходит пешеходная дорожка.",
    commission_analysis: "Проверить балконные плиты, фасад, ограждения и при необходимости ограничить проход под опасным участком.",
    status: "Проверка похожего дома",
    departure_date: null
  },
  {
    id: 1117,
    fio: "Жители дома, учебное обращение",
    phone: "не указан",
    email: "sample-vrn@example.com",
    street: "ул. Минская",
    address: "г. Воронеж, ул. Минская, 67",
    cadastral_number: "учебный пример",
    problem: "В старом доме протекает крыша, деревянные элементы чердака влажные, в подъезде появились следы плесени.",
    commission_analysis: "Проверить кровлю, деревянные элементы, влажность перекрытий и необходимость срочного ремонта.",
    status: "Заявление принято",
    departure_date: null
  },
  {
    id: 1118,
    fio: "Жители дома, учебное обращение",
    phone: "не указан",
    email: "sample-vrn@example.com",
    street: "ул. Никитинская",
    address: "г. Воронеж, ул. Никитинская, 42",
    cadastral_number: "учебный пример",
    problem: "В историческом доме осыпается штукатурка фасада, у оконных откосов трещины, фрагменты падают рядом с входом.",
    commission_analysis: "Проверить фасад, оконные откосы, карниз и безопасность входной зоны.",
    status: "Срочный осмотр",
    departure_date: "2026-05-31"
  },
  {
    id: 1119,
    fio: "Жители дома, учебное обращение",
    phone: "не указан",
    email: "sample-vrn@example.com",
    street: "ул. Фридриха Энгельса",
    address: "г. Воронеж, ул. Фридриха Энгельса, 5",
    cadastral_number: "учебный пример",
    problem: "Крыша над подъездом протекает, штукатурка потолка в тамбуре набухла и может обрушиться.",
    commission_analysis: "Проверить участок кровли над входом, потолок тамбура, электропроводку и необходимость снятия аварийной штукатурки.",
    status: "Назначен выезд",
    departure_date: "2026-06-01"
  },
  {
    id: 1120,
    fio: "Жители дома, учебное обращение",
    phone: "не указан",
    email: "sample-vrn@example.com",
    street: "ул. Космонавтов",
    address: "г. Воронеж, ул. Космонавтов, 28",
    cadastral_number: "учебный пример",
    problem: "В подъезде просела входная площадка, ступени имеют сколы, козырек держится на поврежденных креплениях.",
    commission_analysis: "Проверить входную группу, ступени, козырек, крепления и риск травмирования жильцов.",
    status: "Предписание к проверке",
    departure_date: null
  },
  {
    id: 1121,
    fio: "Жители дома, учебное обращение",
    phone: "не указан",
    email: "sample-vrn@example.com",
    street: "ул. Южно-Моравская",
    address: "г. Воронеж, ул. Южно-Моравская, 22",
    cadastral_number: "учебный пример",
    problem: "На верхнем этаже после осадков мокнут стены, в подъезде пахнет сыростью. Возможно повреждение кровли и вентиляционных шахт.",
    commission_analysis: "Проверить кровлю, вентиляционные шахты, чердак и состояние отделки верхнего этажа.",
    status: "Заявление принято",
    departure_date: null
  },
  {
    id: 1122,
    fio: "Жители дома, учебное обращение",
    phone: "не указан",
    email: "sample-vrn@example.com",
    street: "ул. Хользунова",
    address: "г. Воронеж, ул. Хользунова, 72",
    cadastral_number: "учебный пример",
    problem: "Межпанельные швы раскрываются, в квартирах углы промерзают, на фасаде заметны трещины по стыкам плит.",
    commission_analysis: "Проверить герметизацию межпанельных швов, наружные панели и тепловой контур дома.",
    status: "Проверка похожего дома",
    departure_date: null
  },
  {
    id: 1123,
    fio: "Жители дома, учебное обращение",
    phone: "не указан",
    email: "sample-vrn@example.com",
    street: "ул. Беговая",
    address: "г. Воронеж, ул. Беговая, 219",
    cadastral_number: "учебный пример",
    problem: "В подвале после аварии канализации разрушилась отделка, стены сырые, в первом подъезде появились трещины у пола.",
    commission_analysis: "Проверить подвал, канализацию, фундаментные стены, санитарное состояние и влияние влаги на конструкции.",
    status: "Назначен выезд",
    departure_date: "2026-06-01"
  }
];

const demoConclusions: Conclusion[] = [
  {
    id: 501,
    conclusion_id: 501,
    applications_id: 1024,
    fio: "Иванов Сергей Петрович",
    address: "ул. Плехановская, 18",
    phone: "+7 900 123-45-67",
    create_date: "2026-05-08",
    signed: false
  },
  {
    id: 502,
    conclusion_id: 502,
    applications_id: 1026,
    fio: "Морозов Дмитрий Игоревич",
    address: "ул. Кольцовская, 24",
    phone: "+7 920 667-10-40",
    create_date: "2026-05-09",
    signed: true
  }
];

const demoSignatures: Signature[] = [
  {
    conclusion_id: 502,
    fio: "Морозов Дмитрий Игоревич",
    address: "ул. Кольцовская, 24",
    cadastral_number: "36:34:0901123:015"
  }
];

const demoNotifications: NotificationItem[] = [
  { id: 1, text: "По заявлению №1024 назначен выезд комиссии на 07.05.2026", is_read: false },
  { id: 2, text: "Заключение №502 подписано и доступно для скачивания", is_read: true }
];

const publicVoronezhApplications = demoApplications.filter((application) => Number(application.id) >= 1101);

function mergeWithPublicVoronezhApplications(applications: Application[]) {
  const addresses = new Set(applications.map((application) => (application.address || "").toLowerCase()));
  return [
    ...applications,
    ...publicVoronezhApplications.filter((application) => !addresses.has((application.address || "").toLowerCase()))
  ];
}

function isDemoMode() {
  return new URLSearchParams(location.search).get("demo") === "1" || localStorage.getItem("docflow-demo") === "1";
}

function enableDemoMode(path = "/applications/applications.html") {
  localStorage.setItem("docflow-demo", "1");
  navigate(path);
}

function pathToPage(pathname: string): Page {
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

function useLocationPage() {
  const [page, setPage] = useState<Page>(() => pathToPage(location.pathname));
  useEffect(() => {
    const onPop = () => setPage(pathToPage(location.pathname));
    addEventListener("popstate", onPop);
    return () => removeEventListener("popstate", onPop);
  }, []);
  return page;
}

function navigate(path: string) {
  history.pushState(null, "", path);
  dispatchEvent(new PopStateEvent("popstate"));
}

function useToast() {
  const [toast, setToast] = useState<Toast | null>(null);
  const show = useCallback((text: string) => {
    const next = { id: Date.now(), text };
    setToast(next);
    setTimeout(() => setToast((current) => (current?.id === next.id ? null : current)), 3500);
  }, []);
  return { toast, show };
}

function useThemeMode() {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);

  useEffect(() => {
    document.body.dataset.theme = theme === "default" ? "" : theme;
    localStorage.setItem("docflow-theme", theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => current === "default" ? "cinema" : current === "cinema" ? "lemme" : "default");
  }, []);

  return { theme, toggleTheme };
}

function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, toggleTheme } = useThemeMode();
  const isCinema = theme === "cinema";
  const isLemme = theme === "lemme";
  const Icon = isLemme ? Flower2 : Film;

  return (
    <motion.button
      className={compact ? "theme-toggle compact" : "theme-toggle"}
      type="button"
      onClick={toggleTheme}
      whileTap={{ scale: 0.96 }}
      title={isLemme ? "Обычная тема" : isCinema ? "Lemme-тема" : "Кино-тема"}
    >
      <Icon size={18} />
      {!compact && <span>{isLemme ? "Обычная" : isCinema ? "Lemme" : "Кино-тема"}</span>}
    </motion.button>
  );
}

async function getMe() {
  return normalizeUser(await requestJson<unknown>("/auth/me", { method: "GET" }));
}

type NavItem = {
  label: string;
  path: string;
  active: boolean;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
};

const pageMotion = {
  initial: { opacity: 0, y: 16, scale: 0.99 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -8, scale: 0.995 },
  transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] as const }
};

const shellItemMotion = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { type: "spring" as const, stiffness: 280, damping: 24 }
};

function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div className="page-stage" {...pageMotion}>
      {children}
    </motion.div>
  );
}

function NavButton({ item }: { item: NavItem }) {
  const Icon = item.icon;
  return (
    <motion.button
      className={item.active ? "active" : ""}
      onClick={() => navigate(item.path)}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 420, damping: 28 }}
    >
      <Icon size={18} strokeWidth={2.2} />
      <span>{item.label}</span>
      {item.active && <motion.i className="active-pill" layoutId="activeNavPill" />}
    </motion.button>
  );
}

function AppShell({
  title,
  subtitle,
  active,
  nav,
  children,
  userMode = false
}: {
  title: string;
  subtitle: string;
  active: Page;
  nav: NavItem[];
  children: React.ReactNode;
  userMode?: boolean;
}) {
  return (
    <div className="app-shell">
      <div className="ambient-layer" aria-hidden="true">
        <span className="beam beam-one" />
        <span className="beam beam-two" />
      </div>
      <motion.aside className="sidebar" initial={{ y: -18, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 26 }}>
        <motion.button className="brand" onClick={() => navigate(userMode ? "/user/index.html" : "/applications/applications.html")} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
          <span className="brand-mark"><Sparkles size={22} /></span>
          <span>
            <strong>DocFlow AI</strong>
            <small>дипломная система</small>
          </span>
        </motion.button>
        <nav className="tabs">
          {nav.map((item) => <NavButton key={item.path} item={item} />)}
        </nav>
      </motion.aside>
      <div className="workspace">
        <motion.header className="header" {...shellItemMotion}>
          <motion.div {...shellItemMotion} transition={{ ...shellItemMotion.transition, delay: 0.04 }}>
            <p className="eyebrow">{subtitle}</p>
            <h1>{title}</h1>
          </motion.div>
          <motion.div className="right-controls" {...shellItemMotion} transition={{ ...shellItemMotion.transition, delay: 0.1 }}>
            <ThemeToggle compact />
            {!userMode && (
              <button className={active === "admin-notifications" ? "icon-btn active" : "icon-btn"} title="Уведомления" onClick={() => navigate("/notifications/notifications.html")}>
                <Bell size={19} />
              </button>
            )}
            <motion.button className="link-btn" onClick={() => navigate(userMode ? "/user/profile.html" : "/profile/profile.html")} whileTap={{ scale: 0.97 }}>
              <UserCircle size={18} />
              <span>{userMode ? "Профиль" : "Личный кабинет"}</span>
            </motion.button>
            <motion.button className="link-btn muted" onClick={() => navigate("/logout.html")} whileTap={{ scale: 0.97 }}>
              <LogOut size={18} />
              <span>Выйти</span>
            </motion.button>
          </motion.div>
        </motion.header>
        <PageTransition>{children}</PageTransition>
      </div>
    </div>
  );
}

function MetricCard({ label, value, tone = "default" }: { label: string; value: string | number; tone?: "default" | "green" | "blue" }) {
  return (
    <motion.article className={`metric-card ${tone}`} whileHover={{ y: -6, scale: 1.015 }} whileTap={{ scale: 0.99 }} transition={{ type: "spring", stiffness: 360, damping: 26 }}>
      <span>{label}</span>
      <strong>{value}</strong>
      <i aria-hidden="true" />
    </motion.article>
  );
}

function AdminLayout({ active, children }: { active: Page; children: React.ReactNode }) {
  const titles: Record<Page, [string, string]> = {
    "risk-map": ["Карта рисков", "прогноз аварийности"],
    "admin-apps": ["Все заявления", "операционный центр"],
    details: ["Карточка заявления", "документ и статус"],
    conclusions: ["Заключения комиссии", "подготовка решений"],
    "create-conclusion": ["Новое заключение", "комиссионная форма"],
    signed: ["Подписанные документы", "архив готовых решений"],
    "admin-notifications": ["Уведомления", "события системы"],
    "admin-profile": ["Личный кабинет", "профиль и роли"],
    login: ["Вход", "авторизация"],
    register: ["Регистрация", "новый пользователь"],
    "user-home": ["Главная", "кабинет заявителя"],
    "user-create": ["Создать заявление", "форма обращения"],
    "user-apps": ["Мои заявления", "отслеживание"],
    "user-notifications": ["Уведомления", "события"],
    "user-profile": ["Профиль", "данные пользователя"]
  };
  const [title, subtitle] = titles[active];
  const nav: NavItem[] = [
    { label: "Карта рисков", path: "/risk-map/risk-map.html", active: active === "risk-map", icon: MapPin },
    { label: "Все заявления", path: "/applications/applications.html", active: active === "admin-apps" || active === "details", icon: ClipboardList },
    { label: "Заключения", path: "/conclusion/conclusion.html", active: active === "conclusions" || active === "create-conclusion", icon: FileText },
    { label: "Подписанные", path: "/signed/signed.html", active: active === "signed", icon: FileSignature }
  ];
  return <AppShell title={title} subtitle={subtitle} active={active} nav={nav}>{children}</AppShell>;
}

function UserLayout({ active, children }: { active: Page; children: React.ReactNode }) {
  const titles: Partial<Record<Page, [string, string]>> = {
    "user-home": ["Кабинет заявителя", "персональный маршрут"],
    "user-create": ["Создать заявление", "быстрая подача"],
    "user-apps": ["Мои заявления", "статусы и документы"],
    "user-notifications": ["Уведомления", "важные изменения"],
    "user-profile": ["Профиль", "личные данные"]
  };
  const [title, subtitle] = titles[active] || ["Кабинет", "заявитель"];
  const nav: NavItem[] = [
    { label: "Главная", path: "/user/index.html", active: active === "user-home", icon: Home },
    { label: "Создать", path: "/user/create.html", active: active === "user-create", icon: PlusCircle },
    { label: "Мои заявления", path: "/user/applications.html", active: active === "user-apps", icon: ClipboardList },
    { label: "Уведомления", path: "/user/notifications.html", active: active === "user-notifications", icon: Bell }
  ];
  return <AppShell title={title} subtitle={subtitle} active={active} nav={nav} userMode>{children}</AppShell>;
}

function useGuard(page: Page, show: (message: string) => void) {
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

function AuthPage({ mode, show }: { mode: "login" | "register"; show: (message: string) => void }) {
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
      <div className="auth-theme-control"><ThemeToggle /></div>
      <div className="auth-visual" aria-hidden="true">
        <motion.div className="auth-mesh" animate={{ rotate: [0, 6, 0], scale: [1, 1.04, 1] }} transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="orbit-card one" animate={{ y: [0, -12, 0], rotate: [0, 2, 0] }} transition={{ duration: 5, repeat: Infinity }}><ShieldCheck size={28} />Безопасный доступ</motion.div>
        <motion.div className="orbit-card two" animate={{ y: [0, 10, 0], rotate: [0, -2, 0] }} transition={{ duration: 4.5, repeat: Infinity }}><LayoutDashboard size={28} />Единый кабинет</motion.div>
      </div>
      <motion.section className="auth-container" initial={{ opacity: 0, y: 26, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 240, damping: 24 }}>
        <span className="brand-mark auth-mark"><Sparkles size={24} /></span>
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
            Посмотреть демо без бэка
          </button>
          <button type="button" className="link-btn centered" onClick={() => navigate(mode === "login" ? "/auth/register.html" : "/auth/login.html")}>
            {mode === "login" ? "Нет аккаунта? Зарегистрироваться" : "Уже есть аккаунт? Войти"}
          </button>
        </form>
      </motion.section>
    </main>
  );
}

function StreetFilters({ streets, selected, setSelected }: { streets: Street[]; selected: string[]; setSelected: (value: string[]) => void }) {
  const [query, setQuery] = useState("");
  const filtered = streets.filter((street) => street.street.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="filter-section">
      <h3>Улицы</h3>
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Поиск улицы" />
      <div className="check-list">
        {filtered.map((street) => (
          <label key={street.street}>
            <input
              type="checkbox"
              checked={selected.includes(street.street)}
              onChange={(event) => setSelected(event.target.checked ? [...selected, street.street] : selected.filter((item) => item !== street.street))}
            />
            {street.street}
          </label>
        ))}
      </div>
    </div>
  );
}

type RiskLevel = "low" | "medium" | "high" | "critical";
type RiskSource = "application" | "forecast";

type RiskPoint = {
  id: string;
  source: RiskSource;
  address: string;
  street: string;
  series: string;
  year: number;
  lat?: number;
  lng?: number;
  x: number;
  y: number;
  score: number;
  level: RiskLevel;
  issue: string;
  forecast: string;
  reasons: string[];
  similar: string[];
  application?: Application;
};

type RiskZone = {
  id: string;
  name: string;
  description: string;
  lat: number;
  lng: number;
  radiusKm: number;
  keywords: string[];
  score: number;
  level: RiskLevel;
  count: number;
  highCount: number;
  issues: string[];
  action: string;
};

const currentYear = 2026;
const yandexMapsApiKey = String(import.meta.env.VITE_YANDEX_MAPS_API_KEY || "").trim();
const voronezhTileMap = {
  zoom: 14,
  north: 51.725,
  south: 51.605,
  west: 39.105,
  east: 39.295
};

const riskZoneDefinitions = [
  {
    id: "center",
    name: "Центр и исторический фонд",
    description: "Плехановская, Пушкинская, Никитинская, Кольцовская: старые фасады, карнизы и кровли рядом с пешеходными улицами.",
    lat: 51.665,
    lng: 39.196,
    radiusKm: 2.6,
    keywords: ["плеханов", "пушкин", "никитин", "кольцов", "фридриха", "революции"],
    action: "Поквартальный обход фасадов, карнизов и входных групп, срочное ограждение мест падения отделки."
  },
  {
    id: "north",
    name: "Северный жилой массив",
    description: "Московский проспект, Лизюкова, Хользунова, Беговая: панельные дома, межпанельные швы и влажность.",
    lat: 51.706,
    lng: 39.178,
    radiusKm: 3.7,
    keywords: ["москов", "лизюков", "хользун", "бегов", "ломоносов", "шишков"],
    action: "Проверить межпанельные швы, фасадные панели, кровлю и точки регулярного промерзания."
  },
  {
    id: "southwest",
    name: "Юго-Запад и старые кварталы",
    description: "9 Января, Танеева, Маршака, Домостроителей, Южно-Моравская: кровли, подвалы, лестничные марши и старый малоэтажный фонд.",
    lat: 51.628,
    lng: 39.147,
    radiusKm: 4.2,
    keywords: ["9 января", "танеев", "маршак", "домостроител", "южно-морав", "воронежская", "космонавтов"],
    action: "Сформировать маршрут комиссии по кровлям, подвалам, входным группам и лестничным маршам."
  },
  {
    id: "leftbank",
    name: "Левобережная зона",
    description: "Остужева, Электросигнальная, Минская, Ленинский проспект: кровли, балконы, фасадные плиты и сырость.",
    lat: 51.686,
    lng: 39.267,
    radiusKm: 3.9,
    keywords: ["остужева", "электросигн", "минск", "ленинский"],
    action: "Проверить фасады и балконные плиты вдоль основных пешеходных маршрутов, отдельно осмотреть кровли."
  },
  {
    id: "leninsky",
    name: "Ленинский район",
    description: "20-летия Октября, Ворошилова, Революции 1905 года: входные группы, козырьки, кровля и электрика подъездов.",
    lat: 51.648,
    lng: 39.188,
    radiusKm: 2.8,
    keywords: ["20-летия", "ворошил", "революции", "ленина"],
    action: "Проверить козырьки, тамбуры, электрику подъездов и следы протечек над входами."
  }
];

const referenceBuildings = [
  { address: "г. Воронеж, ул. Плехановская, 15", street: "ул. Плехановская", lat: 51.6628, lng: 39.1936, x: 47, y: 48, year: 1917, series: "исторический кирпичный фонд центра" },
  { address: "г. Воронеж, ул. Плехановская, 18", street: "ул. Плехановская", lat: 51.6618, lng: 39.1982, x: 49, y: 51, year: 1938, series: "исторический кирпичный фонд центра" },
  { address: "г. Воронеж, ул. Пушкинская, 2", street: "ул. Пушкинская", lat: 51.6648, lng: 39.1965, x: 53, y: 44, year: 1910, series: "исторический кирпичный фонд центра" },
  { address: "г. Воронеж, ул. Пушкинская, 4", street: "ул. Пушкинская", lat: 51.6656, lng: 39.1987, x: 55, y: 45, year: 1912, series: "исторический кирпичный фонд центра" },
  { address: "г. Воронеж, ул. 9 Января, 154", street: "ул. 9 Января", lat: 51.6404, lng: 39.1548, x: 35, y: 61, year: 1952, series: "старый кирпичный малоэтажный фонд" },
  { address: "г. Воронеж, ул. 9 Января, 156", street: "ул. 9 Января", lat: 51.6374, lng: 39.1537, x: 37, y: 63, year: 1955, series: "старый кирпичный малоэтажный фонд" },
  { address: "г. Воронеж, ул. Ломоносова, 116/9", street: "ул. Ломоносова", lat: 51.7142, lng: 39.2154, x: 62, y: 23, year: 1974, series: "панельный многоподъездный дом" },
  { address: "г. Воронеж, ул. Ломоносова, 112", street: "ул. Ломоносова", lat: 51.7104, lng: 39.2073, x: 58, y: 26, year: 1972, series: "панельный многоподъездный дом" },
  { address: "г. Воронеж, ул. Революции 1905 года, 25", street: "ул. Революции 1905 года", lat: 51.6608, lng: 39.1832, x: 45, y: 57, year: 1958, series: "старый кирпичный фонд центра" },
  { address: "г. Воронеж, ул. 20-летия Октября, 95Б", street: "ул. 20-летия Октября", lat: 51.6475, lng: 39.1917, x: 52, y: 67, year: 1964, series: "кирпичный пятиэтажный дом" },
  { address: "г. Воронеж, ул. 20-летия Октября, 93", street: "ул. 20-летия Октября", lat: 51.6488, lng: 39.1876, x: 50, y: 69, year: 1965, series: "кирпичный пятиэтажный дом" },
  { address: "г. Воронеж, ул. Танеева, 10", street: "ул. Танеева", lat: 51.6554, lng: 39.1242, x: 32, y: 42, year: 1950, series: "старый частично деревянный фонд" },
  { address: "г. Воронеж, ул. Танеева, 12", street: "ул. Танеева", lat: 51.6572, lng: 39.1214, x: 30, y: 39, year: 1948, series: "старый частично деревянный фонд" },
  { address: "г. Воронеж, ул. Шишкова, 95А", street: "ул. Шишкова", lat: 51.6978, lng: 39.2079, x: 69, y: 28, year: 1987, series: "панельный высотный дом" },
  { address: "г. Воронеж, ул. Шишкова, 97", street: "ул. Шишкова", lat: 51.7001, lng: 39.2139, x: 72, y: 30, year: 1989, series: "панельный высотный дом" },
  { address: "г. Воронеж, ул. Электросигнальная, 31", street: "ул. Электросигнальная", lat: 51.6811, lng: 39.2548, x: 72, y: 53, year: 1962, series: "кирпичный пятиэтажный дом левый берег" },
  { address: "г. Воронеж, ул. Электросигнальная, 33", street: "ул. Электросигнальная", lat: 51.6793, lng: 39.2597, x: 74, y: 56, year: 1961, series: "кирпичный пятиэтажный дом левый берег" },
  { address: "г. Воронеж, ул. Воронежская, 38", street: "ул. Воронежская", lat: 51.6106, lng: 39.1378, x: 24, y: 74, year: 1956, series: "старый двухэтажный фонд" },
  { address: "г. Воронеж, Московский проспект, 91", street: "ул. Московский проспект", lat: 51.7032, lng: 39.1807, x: 58, y: 18, year: 1971, series: "панельный многоподъездный дом" },
  { address: "г. Воронеж, ул. Кольцовская, 24", street: "ул. Кольцовская", lat: 51.6641, lng: 39.1898, x: 44, y: 50, year: 1936, series: "исторический кирпичный фонд центра" },
  { address: "г. Воронеж, ул. Ворошилова, 42", street: "ул. Ворошилова", lat: 51.6412, lng: 39.1816, x: 48, y: 74, year: 1963, series: "кирпичный пятиэтажный дом" },
  { address: "г. Воронеж, ул. Ленина, 76", street: "ул. Ленина", lat: 51.6766, lng: 39.2108, x: 51, y: 32, year: 1957, series: "старый кирпичный фонд центра" },
  { address: "г. Воронеж, ул. Генерала Лизюкова, 66", street: "ул. Генерала Лизюкова", lat: 51.7086, lng: 39.1678, x: 42, y: 18, year: 1982, series: "панельный северный микрорайон" },
  { address: "г. Воронеж, ул. Маршака, 16", street: "ул. Маршака", lat: 51.6258, lng: 39.1399, x: 26, y: 72, year: 1969, series: "кирпичный юго-западный фонд" },
  { address: "г. Воронеж, ул. Домостроителей, 24", street: "ул. Домостроителей", lat: 51.6267, lng: 39.1528, x: 30, y: 71, year: 1974, series: "панельный юго-западный фонд" },
  { address: "г. Воронеж, ул. Остужева, 28", street: "ул. Остужева", lat: 51.6886, lng: 39.2575, x: 78, y: 47, year: 1968, series: "кирпичный пятиэтажный дом левый берег" },
  { address: "г. Воронеж, Ленинский проспект, 174/6", street: "Ленинский проспект", lat: 51.6914, lng: 39.2762, x: 84, y: 43, year: 1970, series: "панельный левобережный фонд" },
  { address: "г. Воронеж, ул. Минская, 67", street: "ул. Минская", lat: 51.6992, lng: 39.2864, x: 86, y: 39, year: 1958, series: "старый левобережный фонд" },
  { address: "г. Воронеж, ул. Никитинская, 42", street: "ул. Никитинская", lat: 51.6691, lng: 39.1936, x: 48, y: 45, year: 1914, series: "исторический кирпичный фонд центра" },
  { address: "г. Воронеж, ул. Фридриха Энгельса, 5", street: "ул. Фридриха Энгельса", lat: 51.6744, lng: 39.2021, x: 51, y: 40, year: 1935, series: "старый кирпичный фонд центра" },
  { address: "г. Воронеж, ул. Космонавтов, 28", street: "ул. Космонавтов", lat: 51.6336, lng: 39.1669, x: 36, y: 68, year: 1966, series: "кирпичный пятиэтажный дом" },
  { address: "г. Воронеж, ул. Южно-Моравская, 22", street: "ул. Южно-Моравская", lat: 51.6129, lng: 39.1522, x: 32, y: 82, year: 1978, series: "панельный юго-западный фонд" },
  { address: "г. Воронеж, ул. Хользунова, 72", street: "ул. Хользунова", lat: 51.7041, lng: 39.1848, x: 49, y: 20, year: 1984, series: "панельный северный микрорайон" },
  { address: "г. Воронеж, ул. Беговая, 219", street: "ул. Беговая", lat: 51.7077, lng: 39.1584, x: 39, y: 20, year: 1976, series: "панельный северный микрорайон" }
];

function hashAddress(value: string) {
  return Array.from(value).reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) % 9973, 17);
}

function lonToTile(lng: number, zoom: number) {
  return ((lng + 180) / 360) * 2 ** zoom;
}

function latToTile(lat: number, zoom: number) {
  const radians = lat * Math.PI / 180;
  return (1 - Math.log(Math.tan(radians) + 1 / Math.cos(radians)) / Math.PI) / 2 * 2 ** zoom;
}

function getVoronezhTileBounds() {
  const zoom = voronezhTileMap.zoom;
  const xMin = lonToTile(voronezhTileMap.west, zoom);
  const xMax = lonToTile(voronezhTileMap.east, zoom);
  const yMin = latToTile(voronezhTileMap.north, zoom);
  const yMax = latToTile(voronezhTileMap.south, zoom);
  const xStart = Math.floor(xMin);
  const xEnd = Math.ceil(xMax) - 1;
  const yStart = Math.floor(yMin);
  const yEnd = Math.ceil(yMax) - 1;
  return {
    xMin,
    xMax,
    xStart,
    xEnd,
    yMin,
    yMax,
    yStart,
    yEnd,
    width: xMax - xMin,
    height: yMax - yMin
  };
}

function coordinateToMapPosition(lat: number, lng: number) {
  const bounds = getVoronezhTileBounds();
  return {
    x: Math.max(5, Math.min(95, (lonToTile(lng, voronezhTileMap.zoom) - bounds.xMin) / bounds.width * 100)),
    y: Math.max(5, Math.min(95, (latToTile(lat, voronezhTileMap.zoom) - bounds.yMin) / bounds.height * 100))
  };
}

function riskMarkerPosition(point: RiskPoint) {
  if (typeof point.lat === "number" && typeof point.lng === "number") {
    return coordinateToMapPosition(point.lat, point.lng);
  }
  return { x: point.x, y: point.y };
}

const yandexTileCache = new Map<string, Promise<HTMLImageElement>>();

function loadYandexTile(url: string) {
  const cached = yandexTileCache.get(url);
  if (cached) return cached;

  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Tile failed"));
    image.src = url;
  });
  yandexTileCache.set(url, promise);
  return promise;
}

function YandexTileLayer() {
  const bounds = useMemo(() => getVoronezhTileBounds(), []);
  const tiles = useMemo(() => {
    const result = [];
    for (let x = bounds.xStart; x <= bounds.xEnd; x += 1) {
      for (let y = bounds.yStart; y <= bounds.yEnd; y += 1) {
        result.push({ x, y });
      }
    }
    return result;
  }, [bounds.xEnd, bounds.xStart, bounds.yEnd, bounds.yStart]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!yandexMapsApiKey) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;
    let renderId = 0;

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width));
      const height = Math.max(1, Math.round(rect.height));
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      const currentRender = ++renderId;
      const context = canvas.getContext("2d");
      if (!context) return;

      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      context.clearRect(0, 0, width, height);
      context.fillStyle = "#e8eef4";
      context.fillRect(0, 0, width, height);
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";

      let loaded = 0;
      let finished = 0;

      tiles.forEach((tile) => {
        const url = `https://tiles.api-maps.yandex.ru/v1/tiles/?apikey=${encodeURIComponent(yandexMapsApiKey)}&lang=ru_RU&x=${tile.x}&y=${tile.y}&z=${voronezhTileMap.zoom}&l=map&projection=web_mercator&maptype=map&scale=2`;
        loadYandexTile(url)
          .then((image) => {
            if (disposed || currentRender !== renderId) return;

            const left = (tile.x - bounds.xMin) / bounds.width * width;
            const top = (tile.y - bounds.yMin) / bounds.height * height;
            const right = (tile.x + 1 - bounds.xMin) / bounds.width * width;
            const bottom = (tile.y + 1 - bounds.yMin) / bounds.height * height;
            const drawLeft = Math.floor(left) - 1;
            const drawTop = Math.floor(top) - 1;
            const drawWidth = Math.ceil(right) - drawLeft + 2;
            const drawHeight = Math.ceil(bottom) - drawTop + 2;
            context.drawImage(image, drawLeft, drawTop, drawWidth, drawHeight);
            loaded += 1;
          })
          .catch(() => undefined)
          .finally(() => {
            if (disposed || currentRender !== renderId) return;
            finished += 1;
            if (finished === tiles.length) {
              setError(loaded > 0 ? "" : "Яндекс не отдал тайлы карты. Проверьте ключ Tiles API и доступ к tiles.api-maps.yandex.ru.");
            }
          });
      });
    };

    const observer = new ResizeObserver(render);
    observer.observe(canvas);
    render();

    return () => {
      disposed = true;
      observer.disconnect();
    };
  }, [bounds.height, bounds.width, bounds.xMin, bounds.yMin, tiles]);

  if (!yandexMapsApiKey) {
    return (
      <div className="yandex-map-shell" aria-hidden="true">
        <div className="yandex-map-message">
          <b>Нужен ключ Яндекс Tiles API</b>
          <span>Добавьте VITE_YANDEX_MAPS_API_KEY и пересоберите frontend_doc, чтобы включить реальную карту Воронежа.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="yandex-canvas-layer" aria-hidden="true">
      <canvas className="yandex-canvas" ref={canvasRef} />
      <span className="map-attribution real-map-attribution">© Яндекс Карты</span>
      {error && <div className="yandex-map-message"><b>Карта не загрузилась</b><span>{error}</span></div>}
    </div>
  );
}

function loadYandexMaps(apiKey: string) {
  if (window.ymaps) return Promise.resolve(window.ymaps);
  if (window.yandexMapsPromise) return window.yandexMapsPromise;

  window.yandexMapsPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${encodeURIComponent(apiKey)}&lang=ru_RU`;
    script.onload = () => {
      if (!window.ymaps) {
        reject(new Error("Yandex Maps API is not available"));
        return;
      }
      window.ymaps.ready(() => resolve(window.ymaps as YandexMapsApi));
    };
    script.onerror = () => reject(new Error("Failed to load Yandex Maps API"));
    document.head.appendChild(script);
  });

  return window.yandexMapsPromise;
}

function escapeHtml(value = "") {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function riskColor(level: RiskLevel) {
  if (level === "critical") return "#dc2626";
  if (level === "high") return "#f97316";
  if (level === "medium") return "#f59e0b";
  return "#0ea5e9";
}

function riskMapBalloon(point: RiskPoint) {
  return [
    `<b>${escapeHtml(point.address)}</b>`,
    `Риск: ${escapeHtml(riskLabel(point.level))} (${point.score})`,
    `Проблема: ${escapeHtml(point.issue)}`,
    `Прогноз: ${escapeHtml(point.forecast)}`
  ].join("<br>");
}

function YandexRiskMap({ points, zones, onSelect }: { points: RiskPoint[]; zones: RiskZone[]; onSelect: (id: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!yandexMapsApiKey || !containerRef.current) return;

    let disposed = false;
    let map: YandexMapInstance | null = null;
    setError("");

    loadYandexMaps(yandexMapsApiKey)
      .then((ymaps) => {
        if (disposed || !containerRef.current) return;

        map = new ymaps.Map(
          containerRef.current,
          {
            center: [51.668, 39.205],
            zoom: 12,
            controls: ["zoomControl", "fullscreenControl"]
          },
          {
            suppressMapOpenBlock: true
          }
        );
        map.behaviors?.disable("scrollZoom");
        map.controls.remove("searchControl");
        map.controls.remove("trafficControl");
        map.controls.remove("geolocationControl");

        zones.forEach((zone) => {
          const color = riskColor(zone.level);
          const circle = new ymaps.Circle(
            [[zone.lat, zone.lng], zone.radiusKm * 1000],
            {
              hintContent: `${zone.name}: ${riskLabel(zone.level)} (${zone.score})`,
              balloonContent: `<b>${escapeHtml(zone.name)}</b><br>Средний риск: ${zone.score}<br>${escapeHtml(zone.action)}`
            },
            {
              fillColor: color,
              fillOpacity: 0.15,
              strokeColor: color,
              strokeOpacity: 0.55,
              strokeWidth: 2
            }
          );
          map?.geoObjects.add(circle);
        });

        points.forEach((point) => {
          if (typeof point.lat !== "number" || typeof point.lng !== "number") return;
          const placemark = new ymaps.Placemark(
            [point.lat, point.lng],
            {
              hintContent: point.address,
              balloonContent: riskMapBalloon(point)
            },
            {
              preset: point.source === "forecast" ? "islands#circleDotIcon" : "islands#circleIcon",
              iconColor: riskColor(point.level)
            }
          );
          placemark.events?.add("click", () => onSelect(point.id));
          map?.geoObjects.add(placemark);
        });
      })
      .catch(() => {
        if (!disposed) setError("Не удалось загрузить Яндекс.Карты. Проверьте API-ключ и доступ к api-maps.yandex.ru.");
      });

    return () => {
      disposed = true;
      map?.destroy();
    };
  }, [onSelect, points, zones]);

  if (!yandexMapsApiKey) {
    return (
      <div className="yandex-map-shell">
        <div className="yandex-map-message">
          <b>Нужен ключ Яндекс.Карт</b>
          <span>Добавьте VITE_YANDEX_MAPS_API_KEY и пересоберите frontend_doc. После этого здесь будет живая карта Воронежа с привязанными метками.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="yandex-map-shell">
      <div className="yandex-map-node" ref={containerRef} />
      {error && <div className="yandex-map-message"><b>Карта не загрузилась</b><span>{error}</span></div>}
    </div>
  );
}

function VoronezhTileMap() {
  const bounds = getVoronezhTileBounds();
  const tiles = [];
  for (let x = bounds.xStart; x <= bounds.xEnd; x += 1) {
    for (let y = bounds.yStart; y <= bounds.yEnd; y += 1) {
      tiles.push({ x, y });
    }
  }

  return (
    <div className="osm-tile-layer" aria-hidden="true">
      {tiles.map((tile) => (
        <img
          alt=""
          className="osm-tile"
          draggable={false}
          key={`${tile.x}-${tile.y}`}
          loading="lazy"
          src={`https://tile.openstreetmap.org/${voronezhTileMap.zoom}/${tile.x}/${tile.y}.png`}
          style={{
            left: `${(tile.x - bounds.xStart) / bounds.width * 100}%`,
            top: `${(tile.y - bounds.yStart) / bounds.height * 100}%`,
            width: `${100 / bounds.width}%`,
            height: `${100 / bounds.height}%`
          }}
        />
      ))}
      <span className="map-attribution">© OpenStreetMap</span>
    </div>
  );
}

function riskText(application: Application) {
  return [application.address, application.street, application.problem, application.commission_analysis, application.status].filter(Boolean).join(" ").toLowerCase();
}

function findReference(address = "", index = 0) {
  const normalized = address.toLowerCase();
  const found = referenceBuildings.find((item) => normalized.includes(item.address.toLowerCase().replace("г. воронеж, ", "")) || normalized.includes(item.address.toLowerCase()));
  if (found) return found;
  const hash = hashAddress(address || String(index));
  const lat = voronezhTileMap.south + ((hash * 7) % 1000) / 1000 * (voronezhTileMap.north - voronezhTileMap.south);
  const lng = voronezhTileMap.west + (hash % 1000) / 1000 * (voronezhTileMap.east - voronezhTileMap.west);
  return {
    address: address || `Объект без адреса ${index + 1}`,
    street: address.split(",")[0] || "улица не определена",
    lat,
    lng,
    x: 8 + (hash % 78),
    y: 14 + ((hash * 7) % 68),
    year: 1972 - (hash % 28),
    series: hash % 3 === 0 ? "кирпичный пятиэтажный дом" : hash % 3 === 1 ? "панельный многоподъездный дом" : "старый кирпичный фонд центра"
  };
}

function hasAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

function clampRisk(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function riskLevel(score: number): RiskLevel {
  if (score >= 78) return "critical";
  if (score >= 58) return "high";
  if (score >= 36) return "medium";
  return "low";
}

function riskLabel(level: RiskLevel) {
  if (level === "critical") return "Критический";
  if (level === "high") return "Высокий";
  if (level === "medium") return "Средний";
  return "Низкий";
}

function analyzeRisk(application: Application, index: number): RiskPoint {
  const text = riskText(application);
  const reference = findReference(application.address || application.street || "", index);
  const reasons: string[] = [];
  let score = 14;
  let issue = "общий износ";

  if (hasAny(text, ["шифер", "падает", "обруш", "фасад", "кирпич", "трещ", "аварийн", "карниз", "штукатур", "отсло", "фрагмент", "сквозная щель"])) {
    score += 38;
    issue = "угроза обрушения элементов фасада или кровли";
    reasons.push("есть признаки падения материалов или разрушения");
  }
  if (hasAny(text, ["крыша", "кровл", "протеч", "влага", "плесень", "затоп", "чердак", "стропил", "балка", "перекрыт", "рубероид", "снег", "электропровод", "короткого замыкания"])) {
    score += 24;
    issue = issue === "общий износ" ? "протечка кровли и разрушение подъезда" : issue;
    reasons.push("влага ускоряет разрушение конструкций");
  }
  if (hasAny(text, ["балкон", "бетон", "арматур", "ступен", "подъезд", "козырек", "вход", "плита", "лестниц"])) {
    score += 22;
    issue = issue === "общий износ" ? "износ общедомовых конструкций" : issue;
    reasons.push("затронуты общедомовые конструкции");
  }
  if (hasAny(text, ["старый", "исторический", "проблемный", "ветхий", "1950", "1951", "1952", "1953", "1954", "1955", "1956", "1957", "1958", "1959", "1960"])) {
    score += 18;
    reasons.push("старый жилой фонд");
  }
  if (hasAny(text, ["гжи", "прокурат", "следствен", "надзор", "предписание", "уголовное дело"])) {
    score += 10;
    reasons.push("по адресу уже есть публичный или надзорный сигнал");
  }
  if ((application.departure_date || "").length > 0) {
    score += 8;
    reasons.push("по объекту уже назначался выезд");
  }

  const age = currentYear - reference.year;
  if (age > 65) {
    score += 16;
    reasons.push(`возраст дома около ${age} лет`);
  } else if (age > 50) {
    score += 9;
    reasons.push(`возраст дома около ${age} лет`);
  }

  const finalScore = clampRisk(score);
  const level = riskLevel(finalScore);
  const similar = referenceBuildings
    .filter((item) => item.address !== reference.address && (item.series === reference.series || item.street === reference.street))
    .slice(0, 3)
    .map((item) => item.address);

  return {
    id: `app-${application.id}`,
    source: "application",
    address: application.address || reference.address,
    street: application.street || reference.street,
    series: reference.series,
    year: reference.year,
    lat: reference.lat,
    lng: reference.lng,
    x: reference.x,
    y: reference.y,
    score: finalScore,
    level,
    issue,
    forecast: finalScore >= 78
      ? "Срочно оградить опасную зону и назначить комиссионный осмотр в ближайшие сутки."
      : finalScore >= 58
        ? "Поставить объект в приоритетный план осмотра и проверить похожие дома той же серии."
        : "Наблюдать динамику обращений и включить адрес в плановый обход.",
    reasons: reasons.length ? reasons : ["по адресу есть обращение, требуется первичная проверка"],
    similar,
    application
  };
}

function buildRiskPoints(applications: Application[]) {
  const base: RiskPoint[] = applications.map(analyzeRisk);
  const existingAddresses = new Set(base.map((point) => point.address.toLowerCase()));
  const forecast: RiskPoint[] = base
    .filter((point) => point.score >= 58)
    .flatMap((point) => referenceBuildings
      .filter((item) => !existingAddresses.has(item.address.toLowerCase()) && (item.series === point.series || item.street === point.street))
      .slice(0, 2)
      .map((item, index) => ({
        id: `forecast-${point.id}-${index}`,
        source: "forecast" as const,
        address: item.address,
        street: item.street,
        series: item.series,
        year: item.year,
        lat: item.lat,
        lng: item.lng,
        x: item.x,
        y: item.y,
        score: clampRisk(point.score - 18 - index * 6),
        level: riskLevel(clampRisk(point.score - 18 - index * 6)),
        issue: `похожий дом: ${point.issue}`,
        forecast: "Проверить фасад, кровлю и входную группу из-за похожего типа дома и близкой проблемы.",
        reasons: ["похожий год постройки или серия дома", `сигнал риска рядом: ${point.address}`],
        similar: [point.address],
      })));
  return [...base, ...forecast].sort((a, b) => b.score - a.score);
}

function distanceKm(latA: number, lngA: number, latB: number, lngB: number) {
  const radius = 6371;
  const dLat = (latB - latA) * Math.PI / 180;
  const dLng = (lngB - lngA) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(latA * Math.PI / 180) * Math.cos(latB * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function riskIssueGroup(point: RiskPoint) {
  const text = [point.issue, point.reasons.join(" "), point.application?.problem || ""].join(" ").toLowerCase();
  if (hasAny(text, ["кров", "крыша", "протеч", "чердак", "влага", "плесень", "затоп"])) return "кровля и протечки";
  if (hasAny(text, ["фасад", "карниз", "штукатур", "падает", "кирпич", "обруш"])) return "фасад и карнизы";
  if (hasAny(text, ["балкон", "бетон", "арматур", "плита"])) return "балконы и бетон";
  if (hasAny(text, ["подвал", "фундамент", "сырость", "канализац"])) return "подвалы и фундамент";
  if (hasAny(text, ["швы", "панел", "промерз", "стык"])) return "межпанельные швы";
  if (hasAny(text, ["подъезд", "козырек", "ступен", "лестниц", "вход"])) return "входные группы";
  return "общий износ";
}

function buildRiskZones(points: RiskPoint[]): RiskZone[] {
  return riskZoneDefinitions
    .map((zone) => {
      const zoneText = zone.keywords.map((keyword) => keyword.toLowerCase());
      const matched = points.filter((point) => {
        const text = [point.address, point.street, point.issue, point.reasons.join(" ")].join(" ").toLowerCase();
        const keywordMatch = zoneText.some((keyword) => text.includes(keyword));
        const distanceMatch = typeof point.lat === "number" && typeof point.lng === "number"
          ? distanceKm(zone.lat, zone.lng, point.lat, point.lng) <= zone.radiusKm
          : false;
        return keywordMatch || distanceMatch;
      });

      const average = matched.length
        ? matched.reduce((sum, point) => sum + point.score, 0) / matched.length
        : 24;
      const highCount = matched.filter((point) => point.level === "high" || point.level === "critical").length;
      const issueCount = matched.reduce<Record<string, number>>((acc, point) => {
        const issue = riskIssueGroup(point);
        acc[issue] = (acc[issue] || 0) + 1;
        return acc;
      }, {});
      const issues = Object.entries(issueCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([issue]) => issue);
      const score = clampRisk(average + Math.min(12, highCount * 2) + Math.min(8, matched.length));

      return {
        ...zone,
        score,
        level: riskLevel(score),
        count: matched.length,
        highCount,
        issues: issues.length ? issues : ["недостаточно заявлений"]
      };
    })
    .sort((a, b) => b.score - a.score);
}

function RiskMapPage({ show }: { show: (message: string) => void }) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [levelFilter, setLevelFilter] = useState<"all" | "critical" | "high" | "forecast">("all");

  useEffect(() => {
    if (isDemoMode()) {
      setApplications(demoApplications);
      return;
    }
    requestJson<{ applications?: Application[] }>("/applications/all")
      .then((data) => setApplications(mergeWithPublicVoronezhApplications(data.applications || [])))
      .catch((error: Error) => show(error.message));
  }, []);

  const points = useMemo(() => buildRiskPoints(applications), [applications]);
  const zones = useMemo(() => buildRiskZones(points), [points]);
  const visiblePoints = points.filter((point) => {
    if (levelFilter === "all") return true;
    if (levelFilter === "forecast") return point.source === "forecast";
    if (levelFilter === "high") return point.level === "high" || point.level === "critical";
    return point.level === "critical";
  });
  const selected = points.find((point) => point.id === selectedId) || visiblePoints[0] || points[0];
  const criticalCount = points.filter((point) => point.level === "critical").length;
  const highCount = points.filter((point) => point.level === "high" || point.level === "critical").length;
  const forecastCount = points.filter((point) => point.source === "forecast").length;
  const zoneCount = zones.filter((zone) => zone.level === "high" || zone.level === "critical").length;

  return (
    <AdminLayout active="risk-map">
      <main>
        <section className="metrics-grid risk-metrics">
          <MetricCard label="Критический риск" value={criticalCount} />
          <MetricCard label="Высокий и выше" value={highCount} tone="blue" />
          <MetricCard label="Прогнозных адресов" value={forecastCount} tone="green" />
          <MetricCard label="Аварийных зон" value={zoneCount} tone="blue" />
        </section>

        <section className="list-header">
          <div>
            <h1>Карта аварийности Воронежа</h1>
            <p>Условный прогноз по открытым обращениям и заявкам: центр, старый фонд, Северный район, левый берег, кровля, фасады и входные группы.</p>
          </div>
          <div className="risk-filter">
            <button className={levelFilter === "all" ? "active" : ""} onClick={() => setLevelFilter("all")}>Все</button>
            <button className={levelFilter === "critical" ? "active" : ""} onClick={() => setLevelFilter("critical")}>Критические</button>
            <button className={levelFilter === "high" ? "active" : ""} onClick={() => setLevelFilter("high")}>Высокие</button>
            <button className={levelFilter === "forecast" ? "active" : ""} onClick={() => setLevelFilter("forecast")}>Прогноз</button>
          </div>
        </section>

        <section className="risk-map-layout">
          <div className="risk-map-panel">
            <div className="risk-map-canvas" aria-label="Карта риска аварийности">
              <YandexTileLayer />
              <svg className="voronezh-map" viewBox="0 0 1000 680" role="img" aria-label="Условная схема Воронежа">
                <defs>
                  <linearGradient id="cityLand" x1="0" x2="1" y1="0" y2="1">
                    <stop offset="0%" stopColor="#fff7ed" />
                    <stop offset="55%" stopColor="#f8fafc" />
                    <stop offset="100%" stopColor="#ecfdf5" />
                  </linearGradient>
                  <linearGradient id="voronezhWater" x1="0" x2="1" y1="0" y2="1">
                    <stop offset="0%" stopColor="#bae6fd" />
                    <stop offset="100%" stopColor="#7dd3fc" />
                  </linearGradient>
                </defs>

                <path className="map-water" d="M650,-30 C708,38 690,92 714,153 C738,216 788,246 778,314 C768,382 714,416 730,485 C746,552 792,592 754,714 L1015,714 L1015,-30 Z" />
                <path className="map-water-core" d="M680,-20 C726,72 704,132 738,204 C773,276 745,338 718,392 C688,452 720,506 748,566 C769,612 752,648 720,704" />

                <path className="map-land city-main" d="M282,54 C382,20 486,34 560,92 C628,146 642,232 610,310 C578,386 598,444 552,528 C504,618 388,654 270,616 C168,584 92,498 78,394 C60,262 136,116 282,54 Z" />
                <path className="map-land city-north-shape" d="M474,28 C562,24 642,70 666,144 C690,217 630,282 548,282 C460,282 402,222 414,140 C422,84 438,50 474,28 Z" />
                <path className="map-land city-left-shape" d="M752,236 C846,242 936,312 952,412 C966,506 914,598 820,632 C738,662 674,612 664,526 C654,438 686,354 752,236 Z" />

                <path className="district-fill district-komintern" d="M432,78 C514,52 610,92 630,168 C646,230 596,268 528,268 C456,268 410,220 418,150 C422,116 426,94 432,78 Z" />
                <path className="district-fill district-center" d="M360,262 C440,220 548,244 584,314 C620,384 560,440 470,438 C384,436 322,376 330,314 C334,292 344,274 360,262 Z" />
                <path className="district-fill district-lenin" d="M358,410 C442,386 540,424 552,508 C562,588 470,632 374,604 C300,582 260,516 286,462 C300,436 326,420 358,410 Z" />
                <path className="district-fill district-soviet" d="M126,398 C206,344 322,358 374,440 C428,526 354,624 244,604 C150,586 78,508 90,438 C94,420 106,408 126,398 Z" />
                <path className="district-fill district-left" d="M758,296 C836,300 904,360 918,438 C932,520 882,594 808,610 C730,628 684,576 684,500 C684,414 704,344 758,296 Z" />

                <path className="city-border" d="M282,54 C382,20 486,34 560,92 C628,146 642,232 610,310 C578,386 598,444 552,528 C504,618 388,654 270,616 C168,584 92,498 78,394 C60,262 136,116 282,54 Z" />
                <path className="city-border" d="M752,236 C846,242 936,312 952,412 C966,506 914,598 820,632 C738,662 674,612 664,526 C654,438 686,354 752,236 Z" />

                <path className="major-road road-moscow" d="M520,44 C506,138 492,202 462,286 C430,374 402,480 372,624" />
                <path className="major-road road-nine" d="M164,610 C222,540 272,472 320,394 C362,326 420,258 492,184" />
                <path className="major-road road-plekhan" d="M118,402 C230,382 360,354 520,326 C586,314 622,304 660,284" />
                <path className="major-road road-lomonosov" d="M410,196 C498,170 594,154 664,142" />
                <path className="major-road road-leftbank" d="M712,514 C778,478 846,434 920,384" />
                <path className="minor-road" d="M306,124 C338,228 350,344 330,474" />
                <path className="minor-road" d="M208,286 C286,302 366,318 452,338" />
                <path className="minor-road" d="M720,342 C782,384 840,454 872,552" />

                <text className="street-label label-moscow" x="492" y="182">Московский пр-т</text>
                <text className="street-label label-nine" x="230" y="520">9 Января</text>
                <text className="street-label label-plekhan" x="316" y="350">Плехановская</text>
                <text className="street-label label-lomonosov" x="496" y="154">Ломоносова</text>
                <text className="street-label label-leftbank" x="770" y="472">Ленинский пр-т</text>
                <text className="water-label" x="744" y="186">Воронежское водохранилище</text>

                <text className="district-svg-label" x="502" y="122">Северный</text>
                <text className="district-svg-label" x="430" y="322">Центр</text>
                <text className="district-svg-label" x="400" y="500">Ленинский</text>
                <text className="district-svg-label" x="190" y="480">Юго-Запад</text>
                <text className="district-svg-label" x="760" y="430">Левый берег</text>
              </svg>
              <span className="map-attribution real-map-attribution">© OpenStreetMap contributors</span>
              <span className="city-outline city-right-bank" />
              <span className="city-outline city-north" />
              <span className="city-outline city-left-bank" />
              <span className="district-zone zone-komintern" />
              <span className="district-zone zone-center" />
              <span className="district-zone zone-lenin" />
              <span className="district-zone zone-soviet" />
              <span className="district-zone zone-leftbank" />
              <span className="map-road road-one" />
              <span className="map-road road-two" />
              <span className="map-road road-three" />
              <span className="map-road road-four" />
              <span className="map-river" />
              <span className="map-reservoir" />
              <span className="map-label river-label">Воронежское водохранилище</span>
              <span className="map-district d1">Центральный</span>
              <span className="map-district d2">Коминтерновский / Северный</span>
              <span className="map-district d3">Советский / Юго-Запад</span>
              <span className="map-district d4">Левобережный</span>
              <span className="map-district d5">Ленинский</span>
              {zones.map((zone) => {
                const position = coordinateToMapPosition(zone.lat, zone.lng);
                return (
                  <span
                    className={`risk-zone-spot ${zone.level}`}
                    key={zone.id}
                    style={{
                      left: `${position.x}%`,
                      top: `${position.y}%`,
                      "--zone-size": `${Math.max(72, Math.min(136, 48 + zone.score * 0.92))}px`
                    } as React.CSSProperties}
                  >
                    <b>{zone.score}</b>
                    <small>{zone.name}</small>
                  </span>
                );
              })}
              {visiblePoints.map((point) => (
                <button
                  className={`risk-marker ${point.level} ${point.source === "forecast" ? "forecast" : ""} ${selected?.id === point.id ? "selected" : ""}`}
                  key={point.id}
                  style={{
                    left: `${riskMarkerPosition(point).x}%`,
                    top: `${riskMarkerPosition(point).y}%`
                  }}
                  onClick={() => setSelectedId(point.id)}
                  title={`${point.address}: ${riskLabel(point.level)} риск`}
                >
                  {point.source === "forecast" ? <Activity size={15} /> : <Building2 size={15} />}
                </button>
              ))}
            </div>
            <div className="risk-legend">
              <span><i className="critical" />Критический</span>
              <span><i className="high" />Высокий</span>
              <span><i className="medium" />Средний</span>
              <span><i className="forecast" />Прогноз похожих домов</span>
            </div>
          </div>

          <aside className="risk-detail-panel">
            {selected ? (
              <>
                <div className="risk-head">
                  <span className={`risk-score ${selected.level}`}>{selected.score}</span>
                  <div>
                    <p className="eyebrow">{selected.source === "forecast" ? "Прогнозный объект" : "Объект из заявления"}</p>
                    <h2>{selected.address}</h2>
                    <span className={`status-badge risk-${selected.level}`}>{riskLabel(selected.level)} риск</span>
                  </div>
                </div>
                <p><b>Тип дома:</b> {selected.series}, {selected.year} г.</p>
                <p><b>Вероятная проблема:</b> {selected.issue}</p>
                {selected.application?.problem && <p><b>Основание:</b> {selected.application.problem}</p>}
                <div className="risk-reasons">
                  {selected.reasons.map((reason) => <span key={reason}>{reason}</span>)}
                </div>
                <div className="risk-forecast">
                  <AlertTriangle size={20} />
                  <p>{selected.forecast}</p>
                </div>
                <h3>Похожие дома для проверки</h3>
                <ul className="risk-list">
                  {(selected.similar.length ? selected.similar : ["Похожих объектов в справочнике не найдено"]).map((item) => <li key={item}>{item}</li>)}
                </ul>
                {selected.application && (
                  <button className="btn-primary" onClick={() => navigate(`/application_details/application_details.html?id=${selected.application?.id}`)}>
                    <Eye size={18} />Открыть заявление
                  </button>
                )}
              </>
            ) : (
              <div className="empty-block">Нет данных для построения карты.</div>
            )}
          </aside>
        </section>

        <section className="risk-zones-panel">
          <div className="list-header">
            <div>
              <h2>Зоны возможной аварийности</h2>
              <p>Средний риск рассчитан по заявлениям, похожим домам, возрасту фонда и повторяющимся типам повреждений.</p>
            </div>
          </div>
          <div className="risk-zones-grid">
            {zones.map((zone) => (
              <article className={`risk-zone-card ${zone.level}`} key={zone.id}>
                <header>
                  <span className={`risk-score ${zone.level}`}>{zone.score}</span>
                  <div>
                    <p className="eyebrow">Средний риск зоны</p>
                    <h3>{zone.name}</h3>
                    <span className={`status-badge risk-${zone.level}`}>{riskLabel(zone.level)} уровень</span>
                  </div>
                </header>
                <p>{zone.description}</p>
                <p><b>Заявлений в зоне:</b> {zone.count}. <b>Высоких:</b> {zone.highCount}.</p>
                <p><b>Чаще встречается:</b> {zone.issues.join(", ")}.</p>
                <p><b>Что делать:</b> {zone.action}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </AdminLayout>
  );
}

function ApplicationsPage({ show }: { show: (message: string) => void }) {
  const [items, setItems] = useState<Application[]>([]);
  const [streets, setStreets] = useState<Street[]>([]);
  const [selectedStreets, setSelectedStreets] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [isDeparture, setIsDeparture] = useState(false);
  const [label, setLabel] = useState("Всего");
  const [assignIds, setAssignIds] = useState("");
  const [assignDate, setAssignDate] = useState("");

  async function load(path = "/applications/all", nextLabel = "Всего") {
    try {
      const data = await requestJson<{ count?: number; applications?: Application[] }>(path);
      setItems(data.applications || []);
      setLabel(nextLabel);
    } catch (error) {
      show(error instanceof Error ? error.message : "Ошибка загрузки заявлений");
    }
  }

  useEffect(() => {
    if (isDemoMode()) {
      setItems(demoApplications);
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
    if (isDeparture) params.append("is_departure", "true");
    await load(`/applications/filter?${params.toString()}`, "Найдено");
  }

  async function setDeparture() {
    if (!assignIds || !assignDate) {
      show("Укажите номер заявления и дату");
      return;
    }
    try {
      const data = await requestJson<{ detail?: string }>("/applications/departure", {
        method: "PATCH",
        body: JSON.stringify({ applications_id: assignIds, departure_date: assignDate })
      });
      show(data.detail || "Дата выезда назначена");
      setAssignIds("");
      setAssignDate("");
      load();
    } catch (error) {
      show(error instanceof Error ? error.message : "Ошибка назначения выезда");
    }
  }

  return (
    <AdminLayout active="admin-apps">
      <section className="metrics-grid">
        <MetricCard label="Заявлений в работе" value={items.length} tone="blue" />
        <MetricCard label="С назначенным выездом" value={items.filter((item) => item.departure_date).length} tone="green" />
        <MetricCard label="Ожидают даты" value={items.filter((item) => !item.departure_date).length} />
      </section>
      <div className="toolbar">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Введите ФИО или кадастровый номер" />
        <button className="btn-primary" onClick={() => load(`/applications/search/${encodeURIComponent(search)}`, "Найдено")}><Search size={18} />Поиск</button>
      </div>
      <div className="counter-row">
        <strong>{label}: {items.length} {declension(items.length)}</strong>
        <div className="assign-row">
          <input value={assignIds} onChange={(event) => setAssignIds(event.target.value)} placeholder="Номера заявлений: 1, 2 или 1-4" />
          <input type="date" value={assignDate} onChange={(event) => setAssignDate(event.target.value)} />
          <button onClick={setDeparture}><CheckCircle2 size={18} />Назначить</button>
        </div>
      </div>
      <div className="content">
        <aside className="filters">
          <StreetFilters streets={streets} selected={selectedStreets} setSelected={setSelectedStreets} />
          <label>Дата выезда от<input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} /></label>
          <label>Дата выезда до<input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} /></label>
          <label className="check-row"><input type="checkbox" checked={isDeparture} onChange={(event) => setIsDeparture(event.target.checked)} />Назначен выезд</label>
          <button className="btn-primary" onClick={applyFilters}><Filter size={18} />Применить</button>
          <button onClick={() => { setSelectedStreets([]); setDateFrom(""); setDateTo(""); setIsDeparture(false); load(); }}>Сбросить</button>
        </aside>
        <main className="applications-list">
          {items.length === 0 ? <div className="empty-block">Список заявлений пуст.</div> : items.map((application) => (
            <motion.article className="app-card" key={application.id} layout whileHover={{ y: -3 }}>
              <div className="card-line"><b>{application.id}</b><span><b>ФИО:</b> {application.fio}</span><span><b>Адрес:</b> {application.street || application.address}</span><span><b>Телефон:</b> {application.phone}</span><span><b>Дата выезда:</b> {formatDate(application.departure_date)}</span></div>
              <button className="btn-details" onClick={() => navigate(`/application_details/application_details.html?id=${application.id}`)}><Eye size={18} />Подробнее</button>
            </motion.article>
          ))}
        </main>
      </div>
    </AdminLayout>
  );
}

function ApplicationDetailsPage({ show }: { show: (message: string) => void }) {
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

function ConclusionsPage({ show }: { show: (message: string) => void }) {
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
          {items.length === 0 ? <div className="empty-block">Список заключений пуст.</div> : items.map((conclusion) => (
            <motion.article className="app-card" key={String(conclusion.conclusion_id || conclusion.id)} layout whileHover={{ y: -3 }}>
              <div className="card-line"><b>{conclusion.conclusion_id}</b><span><b>ФИО:</b> {conclusion.fio}</span><span><b>Адрес:</b> {conclusion.address}</span><span><b>Телефон:</b> {conclusion.phone}</span><span><b>Дата:</b> {formatDate(conclusion.create_date, "Дата не указана")}</span></div>
              {!conclusion.signed && <button className="btn-details"><FileSignature size={18} />Подписать</button>}
            </motion.article>
          ))}
        </main>
      </div>
    </AdminLayout>
  );
}

function CreateConclusionPage({ show }: { show: (message: string) => void }) {
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

function SignedPage({ show }: { show: (message: string) => void }) {
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
        <main className="applications-list">{items.length === 0 ? <div className="empty-block">Список документов пуст.</div> : items.map((item) => <motion.article className="app-card" key={item.conclusion_id} layout whileHover={{ y: -3 }}><div className="card-line"><b>{item.conclusion_id}</b><span><b>ФИО:</b> {item.fio}</span><span><b>Адрес:</b> {item.address}</span><span><b>Кадастровый номер:</b> {item.cadastral_number}</span></div><a className="btn-details" href={apiFileUrl(`/conclusion/download/${item.conclusion_id}`)}><Download size={18} />Скачать</a></motion.article>)}</main>
      </div>
    </AdminLayout>
  );
}

function NotificationsPage({ userMode, show }: { userMode?: boolean; show: (message: string) => void }) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const unread = items.filter((item) => !isNotificationRead(item)).length;

  async function load() {
    try {
      const data = await requestJson<{ notification?: NotificationItem[]; notifications?: NotificationItem[] }>("/notification/");
      setItems(data.notification || data.notifications || []);
    } catch (error) {
      show(error instanceof Error ? error.message : "Ошибка загрузки уведомлений");
    }
  }

  useEffect(() => {
    if (isDemoMode()) {
      setItems(demoNotifications);
      return;
    }
    load();
  }, []);

  async function markRead(id: number | string) {
    await requestJson("/notification/read", { method: "POST", body: JSON.stringify({ id }) });
    setItems((current) => current.map((item) => String(item.id) === String(id) ? { ...item, is_read: true, read: true } : item));
  }

  async function remove(id: number | string) {
    await requestJson(`/notification/delete?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    setItems((current) => current.filter((item) => String(item.id) !== String(id)));
  }

  const content = (
    <main>
      <section className="metrics-grid"><MetricCard label="Всего уведомлений" value={items.length} tone="blue" /><MetricCard label="Непрочитанных" value={unread} /></section>
      <section className="list-header"><div><h1>Уведомления</h1><p>Всего уведомлений: {items.length} | Непрочитанных: {unread}</p></div><button className="btn-primary" onClick={async () => { await requestJson("/notification/read-all"); setItems((current) => current.map((item) => ({ ...item, is_read: true, read: true }))); }}><CheckCircle2 size={18} />Прочитать все</button></section>
      <section className="applications-list">{items.length === 0 ? <div className="empty-block">Уведомлений нет.</div> : items.map((item) => <motion.article className={`notification-card ${isNotificationRead(item) ? "read" : ""}`} key={item.id} layout whileHover={{ y: -3 }}><p>{item.text || "Уведомление"}</p><div>{!isNotificationRead(item) && <button onClick={() => markRead(item.id)}><CheckCircle2 size={18} />Прочитать</button>}<button className="btn-danger" onClick={() => remove(item.id)}>Удалить</button></div></motion.article>)}</section>
    </main>
  );

  return userMode ? <UserLayout active="user-notifications">{content}</UserLayout> : <AdminLayout active="admin-notifications">{content}</AdminLayout>;
}

function AdminProfilePage({ show }: { show: (message: string) => void }) {
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

function UserHome() {
  return (
    <UserLayout active="user-home">
      <main className="home-panel">
        <section className="intro"><p className="eyebrow">Личный кабинет заявителя</p><h1>Подавайте заявления и следите за их рассмотрением</h1><p>Здесь можно создать новое заявление, указать данные заявителя, объект и описание проблемы. После отправки заявление появится в разделе “Мои заявления”.</p><div className="home-actions"><button className="btn-primary" onClick={() => navigate("/user/create.html")}><PlusCircle size={18} />Создать заявление</button><button onClick={() => navigate("/user/applications.html")}><ClipboardList size={18} />Мои заявления</button></div></section>
      </main>
    </UserLayout>
  );
}

function UserCreatePage({ user, show }: { user: User | null; show: (message: string) => void }) {
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(["fio", "phone", "email", "cadastral_number", "problem", "address"].map((key) => [key, String(form.get(key) || "").trim()]));
    if (!payload.fio || String(payload.fio).split(/\s+/).length < 3) return show("Укажите ФИО полностью");
    if (Object.values(payload).some((value) => !value)) return show("Заполните все поля заявления");
    if (!String(payload.address).includes("ул. ")) return show("Адрес должен содержать улицу в формате: ул. Название");
    try {
      const data = await requestJson<{ detail?: string }>("/applications/create", { method: "POST", body: JSON.stringify(payload) });
      show(data.detail || "Заявление успешно создано");
      navigate("/user/applications.html");
    } catch (error) {
      show(error instanceof Error ? error.message : "Ошибка создания заявления");
    }
  }
  return (
    <UserLayout active="user-create">
      <main className="form-container"><h1>Создать заявление</h1><form className="form-grid" onSubmit={submit}><label>ФИО<input name="fio" defaultValue={user?.fio || ""} required /></label><label>Телефон<input name="phone" required /></label><label>Email<input name="email" type="email" defaultValue={user?.email || ""} required /></label><label>Кадастровый номер<input name="cadastral_number" required /></label><label className="full-width">Адрес<input name="address" placeholder="ул. Название, дом" required /></label><label className="full-width">Описание проблемы<textarea name="problem" rows={5} required /></label><div className="form-actions"><button className="btn-primary"><Send size={18} />Отправить</button></div></form></main>
    </UserLayout>
  );
}

function UserApplicationsPage({ show }: { show: (message: string) => void }) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [conclusions, setConclusions] = useState<Conclusion[]>([]);
  const [status, setStatus] = useState("");
  const [id, setId] = useState("");

  useEffect(() => {
    if (isDemoMode()) {
      setApplications(demoApplications);
      setConclusions(demoConclusions);
      return;
    }
    Promise.allSettled([requestJson<{ applications?: Application[] }>("/applications/my"), requestJson<{ conclusions?: Conclusion[] }>("/conclusion/my")]).then(([apps, cons]) => {
      if (apps.status === "fulfilled") setApplications(apps.value.applications || []);
      if (cons.status === "fulfilled") setConclusions(cons.value.conclusions || []);
    }).catch((error: Error) => show(error.message));
  }, []);

  const conclusionsByApp = useMemo(() => new Map(conclusions.map((item) => [String(item.applications_id), item])), [conclusions]);
  const filtered = applications.filter((application) => (!status || application.status === status) && (!id || String(application.id) === id));

  return (
    <UserLayout active="user-apps">
      <main><section className="metrics-grid"><MetricCard label="Всего заявлений" value={applications.length} tone="blue" /><MetricCard label="Показано" value={filtered.length} /></section><section className="list-header"><div><h1>Мои заявления</h1><p>Найдено: {filtered.length} {declension(filtered.length)}</p></div><button className="btn-primary" onClick={() => navigate("/user/create.html")}><PlusCircle size={18} />Создать заявление</button></section><section className="filters-panel"><label>Статус<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Все</option><option>Заявление принято</option><option>Назначен выезд</option><option>Заключение на рассмотрении</option><option>Результат комиссии</option></select></label><label>Поиск по ID<input type="number" value={id} onChange={(event) => setId(event.target.value)} /></label><button onClick={() => { setStatus(""); setId(""); }}>Сбросить</button></section><section className="applications-list">{filtered.length === 0 ? <div className="empty-block">Заявления не найдены.</div> : filtered.map((application) => { const conclusion = conclusionsByApp.get(String(application.id)); const conclusionId = conclusion?.id || conclusion?.conclusion_id; return <motion.article className="application-card" key={application.id} layout whileHover={{ y: -3 }}><div className="application-top"><h2>Заявление №{application.id}</h2><span className="status-badge">{application.status}</span></div><p><b>ФИО:</b> {application.fio}</p><p><b>Кадастровый номер:</b> {application.cadastral_number}</p><p><b>Адрес:</b> {application.address}</p><p><b>Дата выезда:</b> {formatDate(application.departure_date)}</p><div className="application-actions"><a className="btn-primary" href={apiFileUrl(`/applications/view/${application.id}`)} target="_blank"><Eye size={18} />Открыть документ</a><a className="btn-details" href={apiFileUrl(`/applications/download/${application.id}`)}><Download size={18} />Скачать</a></div>{conclusionId && <div className="conclusion-panel"><b>Заключение комиссии готово</b><a className="btn-primary" href={apiFileUrl(`/conclusion/view/${conclusionId}`)} target="_blank"><Eye size={18} />Открыть</a><a className="btn-details" href={apiFileUrl(`/conclusion/download/${conclusionId}`)}><Download size={18} />Скачать</a></div>}</motion.article>; })}</section></main>
    </UserLayout>
  );
}

function UserProfilePage({ user, show }: { user: User | null; show: (message: string) => void }) {
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

  let content: React.ReactNode;
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
