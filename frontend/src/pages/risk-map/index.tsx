import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Eye, MapPin, Search } from "lucide-react";
import { requestJson } from "../../shared/api";
import type { Application } from "../../shared/types";
import { isDemoMode, navigate } from "../../shared/router";
import { demoApplications, fetchApplicationsWithoutRedirect, mergeRiskMapApplications, mergeWithPublicVoronezhApplications } from "../../shared/mocks/demo-data";
import { AdminLayout, MetricCard } from "../../widgets/layouts";
type DgisMapInstance = {
  destroy: () => void;
};
type DgisMarkerInstance = {
  destroy: () => void;
  on: (type: string, listener: () => void) => DgisMarkerInstance;
};
type DgisMarkerOptions = {
  coordinates: [number, number];
  icon: string;
  size: [number, number];
  anchor: [number, number];
  zIndex?: number;
};
type DgisCircleInstance = {
  destroy: () => void;
};
type DgisCircleOptions = {
  coordinates: [number, number];
  radius: number;
  color: string;
  strokeColor: string;
  strokeWidth: number;
  interactive?: boolean;
  zIndex?: number;
};
type DgisMapglApi = {
  Map: new (container: HTMLElement, options: Record<string, unknown>) => DgisMapInstance;
  Marker: new (map: DgisMapInstance, options: DgisMarkerOptions) => DgisMarkerInstance;
  Circle: new (map: DgisMapInstance, options: DgisCircleOptions) => DgisCircleInstance;
};

declare global {
  interface Window {
    mapgl?: DgisMapglApi;
    System?: {
      import: (url: string) => Promise<DgisMapglApi>;
    };
    dgisMapglPromise?: Promise<DgisMapglApi>;
  }
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
const dgisMapglApiKey = String(import.meta.env.VITE_DGIS_MAPGL_KEY || "").trim();
const voronezhMapViewport = {
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
  { address: "г. Воронеж, ул. Плехановская, 15", street: "ул. Плехановская", lat: 51.664132, lng: 39.196551, x: 48, y: 51, year: 1917, series: "исторический кирпичный фонд центра" },
  { address: "г. Воронеж, ул. Плехановская, 18", street: "ул. Плехановская", lat: 51.665321, lng: 39.196153, x: 48, y: 50, year: 1938, series: "исторический кирпичный фонд центра" },
  { address: "г. Воронеж, ул. Пушкинская, 2", street: "ул. Пушкинская", lat: 51.664063, lng: 39.202507, x: 51, y: 51, year: 1910, series: "исторический кирпичный фонд центра" },
  { address: "г. Воронеж, ул. Пушкинская, 4", street: "ул. Пушкинская", lat: 51.663751, lng: 39.201717, x: 51, y: 51, year: 1912, series: "исторический кирпичный фонд центра" },
  { address: "г. Воронеж, ул. 9 Января, 154", street: "ул. 9 Января", lat: 51.673723, lng: 39.150962, x: 24, y: 43, year: 1952, series: "старый кирпичный малоэтажный фонд" },
  { address: "г. Воронеж, ул. 9 Января, 156", street: "ул. 9 Января", lat: 51.673882, lng: 39.150330, x: 24, y: 43, year: 1955, series: "старый кирпичный малоэтажный фонд" },
  { address: "г. Воронеж, ул. Ломоносова, 116/9", street: "ул. Ломоносова", lat: 51.727500, lng: 39.192208, x: 46, y: 0, year: 1974, series: "панельный многоподъездный дом" },
  { address: "г. Воронеж, ул. Ломоносова, 112", street: "ул. Ломоносова", lat: 51.723521, lng: 39.221032, x: 61, y: 1, year: 1972, series: "панельный многоподъездный дом" },
  { address: "г. Воронеж, ул. Революции 1905 года, 25", street: "ул. Революции 1905 года", lat: 51.669114, lng: 39.188382, x: 44, y: 47, year: 1958, series: "старый кирпичный фонд центра" },
  { address: "г. Воронеж, ул. 20-летия Октября, 95Б", street: "ул. 20-летия Октября", lat: 51.650633, lng: 39.192441, x: 46, y: 62, year: 1964, series: "кирпичный пятиэтажный дом" },
  { address: "г. Воронеж, ул. 20-летия Октября, 93", street: "ул. 20-летия Октября", lat: 51.650024, lng: 39.191364, x: 45, y: 62, year: 1965, series: "кирпичный пятиэтажный дом" },
  { address: "г. Воронеж, ул. Танеева, 10", street: "ул. Танеева", lat: 51.612332, lng: 39.230421, x: 66, y: 94, year: 1950, series: "старый частично деревянный фонд" },
  { address: "г. Воронеж, ул. Танеева, 12", street: "ул. Танеева", lat: 51.612332, lng: 39.229766, x: 66, y: 94, year: 1948, series: "старый частично деревянный фонд" },
  { address: "г. Воронеж, ул. Шишкова, 95А", street: "ул. Шишкова", lat: 51.712696, lng: 39.189359, x: 44, y: 10, year: 1987, series: "панельный высотный дом" },
  { address: "г. Воронеж, ул. Шишкова, 97", street: "ул. Шишкова", lat: 51.712160, lng: 39.190340, x: 45, y: 11, year: 1989, series: "панельный высотный дом" },
  { address: "г. Воронеж, ул. Электросигнальная, 31", street: "ул. Электросигнальная", lat: 51.687611, lng: 39.173761, x: 36, y: 31, year: 1962, series: "кирпичный пятиэтажный дом левый берег" },
  { address: "г. Воронеж, ул. Электросигнальная, 33", street: "ул. Электросигнальная", lat: 51.687561, lng: 39.169881, x: 34, y: 31, year: 1961, series: "кирпичный пятиэтажный дом левый берег" },
  { address: "г. Воронеж, ул. Воронежская, 38", street: "ул. Воронежская", lat: 51.605094, lng: 39.220507, x: 61, y: 100, year: 1956, series: "старый двухэтажный фонд" },
  { address: "г. Воронеж, Московский проспект, 91", street: "ул. Московский проспект", lat: 51.702978, lng: 39.179690, x: 39, y: 18, year: 1971, series: "панельный многоподъездный дом" },
  { address: "г. Воронеж, ул. Кольцовская, 24", street: "ул. Кольцовская", lat: 51.677047, lng: 39.202281, x: 51, y: 40, year: 1936, series: "исторический кирпичный фонд центра" },
  { address: "г. Воронеж, ул. Ворошилова, 42", street: "ул. Ворошилова", lat: 51.649630, lng: 39.157709, x: 28, y: 63, year: 1963, series: "кирпичный пятиэтажный дом" },
  { address: "г. Воронеж, ул. Ленина, 76", street: "ул. Ленина", lat: 51.687917, lng: 39.218227, x: 60, y: 31, year: 1957, series: "старый кирпичный фонд центра" },
  { address: "г. Воронеж, ул. Генерала Лизюкова, 66", street: "ул. Генерала Лизюкова", lat: 51.706489, lng: 39.145763, x: 21, y: 15, year: 1982, series: "панельный северный микрорайон" },
  { address: "г. Воронеж, ул. Маршака, 16", street: "ул. Маршака", lat: 51.654068, lng: 39.143838, x: 20, y: 59, year: 1969, series: "кирпичный юго-западный фонд" },
  { address: "г. Воронеж, ул. Домостроителей, 24", street: "ул. Домостроителей", lat: 51.652953, lng: 39.148411, x: 23, y: 60, year: 1974, series: "панельный юго-западный фонд" },
  { address: "г. Воронеж, ул. Остужева, 28", street: "ул. Остужева", lat: 51.684354, lng: 39.266778, x: 85, y: 34, year: 1968, series: "кирпичный пятиэтажный дом левый берег" },
  { address: "г. Воронеж, Ленинский проспект, 174/6", street: "Ленинский проспект", lat: 51.694041, lng: 39.272209, x: 88, y: 26, year: 1970, series: "панельный левобережный фонд" },
  { address: "г. Воронеж, ул. Минская, 67", street: "ул. Минская", lat: 51.692451, lng: 39.281390, x: 93, y: 27, year: 1958, series: "старый левобережный фонд" },
  { address: "г. Воронеж, ул. Никитинская, 42", street: "ул. Никитинская", lat: 51.665085, lng: 39.191827, x: 46, y: 50, year: 1914, series: "исторический кирпичный фонд центра" },
  { address: "г. Воронеж, ул. Фридриха Энгельса, 5", street: "ул. Фридриха Энгельса", lat: 51.678642, lng: 39.211707, x: 56, y: 39, year: 1935, series: "старый кирпичный фонд центра" },
  { address: "г. Воронеж, ул. Космонавтов, 28", street: "ул. Космонавтов", lat: 51.654578, lng: 39.156607, x: 27, y: 59, year: 1966, series: "кирпичный пятиэтажный дом" },
  { address: "г. Воронеж, ул. Южно-Моравская, 22", street: "ул. Южно-Моравская", lat: 51.654782, lng: 39.125744, x: 11, y: 59, year: 1978, series: "панельный юго-западный фонд" },
  { address: "г. Воронеж, ул. Хользунова, 72", street: "ул. Хользунова", lat: 51.702727, lng: 39.166142, x: 32, y: 19, year: 1984, series: "панельный северный микрорайон" },
  { address: "г. Воронеж, ул. Беговая, 219", street: "ул. Беговая", lat: 51.695685, lng: 39.138754, x: 18, y: 24, year: 1976, series: "панельный северный микрорайон" },
  { address: "г. Воронеж, ул. Студенческая, 10", street: "ул. Студенческая", lat: 51.677300, lng: 39.204753, x: 53, y: 40, year: 1932, series: "старый кирпичный фонд центра" },
  { address: "г. Воронеж, ул. Студенческая, 12", street: "ул. Студенческая", lat: 51.676363, lng: 39.204630, x: 52, y: 41, year: 1936, series: "старый кирпичный фонд центра" },
  { address: "г. Воронеж, ул. Студенческая, 14", street: "ул. Студенческая", lat: 51.675269, lng: 39.203916, x: 52, y: 41, year: 1938, series: "старый кирпичный фонд центра" },
  { address: "г. Воронеж, ул. Карла Маркса, 53", street: "ул. Карла Маркса", lat: 51.665026, lng: 39.202736, x: 51, y: 50, year: 1940, series: "старый кирпичный фонд центра" },
  { address: "г. Воронеж, ул. Карла Маркса, 55", street: "ул. Карла Маркса", lat: 51.665422, lng: 39.202913, x: 52, y: 50, year: 1949, series: "старый кирпичный фонд центра" },
  { address: "г. Воронеж, ул. Карла Маркса, 57", street: "ул. Карла Маркса", lat: 51.665729, lng: 39.201671, x: 51, y: 49, year: 1951, series: "старый кирпичный фонд центра" },
  { address: "г. Воронеж, ул. Комиссаржевской, 8", street: "ул. Комиссаржевской", lat: 51.671156, lng: 39.204066, x: 52, y: 45, year: 1916, series: "исторический кирпичный фонд центра" },
  { address: "г. Воронеж, ул. Комиссаржевской, 10", street: "ул. Комиссаржевской", lat: 51.671441, lng: 39.203067, x: 52, y: 45, year: 1914, series: "исторический кирпичный фонд центра" },
  { address: "г. Воронеж, ул. Комиссаржевской, 12", street: "ул. Комиссаржевской", lat: 51.671805, lng: 39.201478, x: 51, y: 44, year: 1918, series: "исторический кирпичный фонд центра" },
  { address: "г. Воронеж, ул. Моисеева, 35", street: "ул. Моисеева", lat: 51.650583, lng: 39.180581, x: 40, y: 62, year: 1960, series: "кирпичный пятиэтажный дом" },
  { address: "г. Воронеж, ул. Моисеева, 37", street: "ул. Моисеева", lat: 51.650983, lng: 39.180385, x: 40, y: 62, year: 1962, series: "кирпичный пятиэтажный дом" },
  { address: "г. Воронеж, ул. Моисеева, 39", street: "ул. Моисеева", lat: 51.650983, lng: 39.180385, x: 40, y: 62, year: 1964, series: "кирпичный пятиэтажный дом" },
  { address: "г. Воронеж, ул. Матросова, 4", street: "ул. Матросова", lat: 51.633267, lng: 39.180445, x: 40, y: 76, year: 1965, series: "кирпичный пятиэтажный дом" },
  { address: "г. Воронеж, ул. Матросова, 6", street: "ул. Матросова", lat: 51.635126, lng: 39.174525, x: 37, y: 75, year: 1966, series: "кирпичный пятиэтажный дом" },
  { address: "г. Воронеж, ул. Матросова, 8", street: "ул. Матросова", lat: 51.636438, lng: 39.170944, x: 35, y: 74, year: 1968, series: "кирпичный пятиэтажный дом" },
  { address: "г. Воронеж, ул. Депутатская, 9", street: "ул. Депутатская", lat: 51.650835, lng: 39.175723, x: 37, y: 62, year: 1970, series: "панельный левобережный фонд" },
  { address: "г. Воронеж, ул. Депутатская, 11", street: "ул. Депутатская", lat: 51.650791, lng: 39.174408, x: 37, y: 62, year: 1972, series: "панельный левобережный фонд" },
  { address: "г. Воронеж, ул. Депутатская, 13", street: "ул. Депутатская", lat: 51.650071, lng: 39.172543, x: 36, y: 62, year: 1974, series: "панельный левобережный фонд" },
  { address: "г. Воронеж, ул. Пеше-Стрелецкая, 88", street: "ул. Пеше-Стрелецкая", lat: 51.659229, lng: 39.139586, x: 18, y: 55, year: 1978, series: "панельный юго-западный фонд" },
  { address: "г. Воронеж, ул. Пеше-Стрелецкая, 90", street: "ул. Пеше-Стрелецкая", lat: 51.657267, lng: 39.141414, x: 19, y: 56, year: 1979, series: "панельный юго-западный фонд" },
  { address: "г. Воронеж, ул. Пеше-Стрелецкая, 92", street: "ул. Пеше-Стрелецкая", lat: 51.656566, lng: 39.139863, x: 18, y: 57, year: 1980, series: "панельный юго-западный фонд" },
  { address: "г. Воронеж, ул. Ростовская, 56", street: "ул. Ростовская", lat: 51.605366, lng: 39.241702, x: 72, y: 100, year: 1961, series: "старый левобережный фонд" },
  { address: "г. Воронеж, ул. Ростовская, 58", street: "ул. Ростовская", lat: 51.603230, lng: 39.237985, x: 70, y: 100, year: 1963, series: "старый левобережный фонд" },
  { address: "г. Воронеж, ул. Ростовская, 60", street: "ул. Ростовская", lat: 51.600066, lng: 39.243133, x: 73, y: 100, year: 1965, series: "старый левобережный фонд" },
  { address: "г. Воронеж, ул. Новосибирская, 26", street: "ул. Новосибирская", lat: 51.613756, lng: 39.235106, x: 68, y: 93, year: 1973, series: "панельный левобережный фонд" },
  { address: "г. Воронеж, ул. Новосибирская, 28", street: "ул. Новосибирская", lat: 51.614190, lng: 39.234246, x: 68, y: 92, year: 1975, series: "панельный левобережный фонд" },
  { address: "г. Воронеж, ул. Новосибирская, 30", street: "ул. Новосибирская", lat: 51.613695, lng: 39.236233, x: 69, y: 93, year: 1977, series: "панельный левобережный фонд" },
  { address: "г. Воронеж, ул. Димитрова, 65", street: "ул. Димитрова", lat: 51.672174, lng: 39.255253, x: 79, y: 44, year: 1968, series: "кирпичный пятиэтажный дом левый берег" },
  { address: "г. Воронеж, ул. Димитрова, 67", street: "ул. Димитрова", lat: 51.672174, lng: 39.255253, x: 79, y: 44, year: 1969, series: "кирпичный пятиэтажный дом левый берег" },
  { address: "г. Воронеж, ул. Димитрова, 69", street: "ул. Димитрова", lat: 51.672174, lng: 39.255253, x: 79, y: 44, year: 1970, series: "кирпичный пятиэтажный дом левый берег" },
  { address: "г. Воронеж, ул. Переверткина, 22", street: "ул. Переверткина", lat: 51.684080, lng: 39.258230, x: 81, y: 34, year: 1977, series: "панельный левобережный фонд" },
  { address: "г. Воронеж, ул. Переверткина, 24", street: "ул. Переверткина", lat: 51.685330, lng: 39.257684, x: 80, y: 33, year: 1979, series: "панельный левобережный фонд" },
  { address: "г. Воронеж, ул. Переверткина, 26", street: "ул. Переверткина", lat: 51.688112, lng: 39.259548, x: 81, y: 31, year: 1981, series: "панельный левобережный фонд" },
  { address: "г. Воронеж, ул. Артамонова, 36", street: "ул. Артамонова", lat: 51.717408, lng: 39.269874, x: 87, y: 6, year: 1972, series: "панельный северный микрорайон" },
  { address: "г. Воронеж, ул. Артамонова, 38", street: "ул. Артамонова", lat: 51.716339, lng: 39.269959, x: 87, y: 7, year: 1974, series: "панельный северный микрорайон" },
  { address: "г. Воронеж, ул. Артамонова, 40", street: "ул. Артамонова", lat: 51.715892, lng: 39.271002, x: 87, y: 8, year: 1976, series: "панельный северный микрорайон" },
];

function hashAddress(value: string) {
  return Array.from(value).reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) % 9973, 17);
}

function loadDgisMapgl() {
  if (window.mapgl) return Promise.resolve(window.mapgl);
  if (window.dgisMapglPromise) return window.dgisMapglPromise;

  window.dgisMapglPromise = new Promise((resolve, reject) => {
    const resolveMapgl = (mapgl: DgisMapglApi) => {
      window.mapgl = mapgl;
      resolve(mapgl);
    };

    const importMapgl = () => {
      if (!window.System?.import) {
        reject(new Error("SystemJS is not available"));
        return;
      }
      window.System.import("https://mapgl.2gis.com/api/js/v1")
        .then(resolveMapgl)
        .catch(reject);
    };

    if (window.System?.import) {
      importMapgl();
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://unpkg.com/systemjs@6.14.1/dist/system.min.js";
    script.onload = importMapgl;
    script.onerror = () => reject(new Error("Failed to load SystemJS"));
    document.head.appendChild(script);
  });

  return window.dgisMapglPromise;
}

function riskMarkerColor(level: RiskLevel) {
  if (level === "critical") return "#dc2626";
  if (level === "high") return "#f97316";
  if (level === "medium") return "#f59e0b";
  return "#0ea5e9";
}

function colorWithAlpha(hex: string, alpha: number) {
  const channel = Math.round(Math.max(0, Math.min(1, alpha)) * 255).toString(16).padStart(2, "0");
  return `${hex}${channel}`;
}

const riskMarkerIconCache = new Map<string, string>();
const riskMarkerSize: [number, number] = [38, 38];

function markerRenderSize(): [number, number] {
  return [riskMarkerSize[0], riskMarkerSize[1]];
}

function riskMarkerIcon(point: RiskPoint) {
  const cacheKey = `${point.level}-${point.source}-${point.score}`;
  const cached = riskMarkerIconCache.get(cacheKey);
  if (cached) return cached;

  const color = riskMarkerColor(point.level);
  const ring = point.source === "forecast" ? "#2563eb" : "#ffffff";
  const dash = point.source === "forecast" ? 'stroke-dasharray="6 4"' : "";
  const [size] = markerRenderSize();
  const center = size / 2;
  const ringWidth = 3;
  const outerRadius = 15;
  const innerRadius = 11;
  const fontSize = 10;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle cx="${center}" cy="${center}" r="${outerRadius}" fill="${color}" opacity="0.92" stroke="rgba(15,23,42,0.18)" stroke-width="1"/>
      <circle cx="${center}" cy="${center}" r="${outerRadius - 2}" fill="${color}" opacity="0.96" stroke="${ring}" stroke-width="${ringWidth}" ${dash}/>
      <circle cx="${center}" cy="${center}" r="${innerRadius}" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.42)" stroke-width="1"/>
      <text x="${center}" y="${center + 4}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="800" fill="#ffffff">${point.score}</text>
    </svg>
  `;
  const icon = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg.trim())}`;
  riskMarkerIconCache.set(cacheKey, icon);
  return icon;
}

function DgisMapLayer({ points, zones, onSelect }: { points: RiskPoint[]; zones: RiskZone[]; onSelect: (id: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<DgisMapInstance | null>(null);
  const mapglRef = useRef<DgisMapglApi | null>(null);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!dgisMapglApiKey || !containerRef.current) return;

    let disposed = false;
    setError("");

    loadDgisMapgl()
      .then((mapgl) => {
        if (disposed || !containerRef.current) return;

        mapglRef.current = mapgl;
        const map = new mapgl.Map(containerRef.current, {
          center: [39.205, 51.668],
          zoom: 12.2,
          key: dgisMapglApiKey
        });
        mapRef.current = map;
        setReady(true);
      })
      .catch(() => {
        if (!disposed) {
          setError("Не удалось загрузить карту 2ГИС. Проверьте ключ VITE_DGIS_MAPGL_KEY и доступ к mapgl.2gis.com.");
        }
      });

    return () => {
      disposed = true;
      setReady(false);
      mapRef.current?.destroy();
      mapRef.current = null;
      mapglRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!ready || !mapRef.current || !mapglRef.current) return;

    const map = mapRef.current;
    const mapgl = mapglRef.current;
    const circles = zones.map((zone) => {
      const color = riskMarkerColor(zone.level);
      return new mapgl.Circle(map, {
        coordinates: [zone.lng, zone.lat],
        radius: zone.radiusKm * 650,
        color: colorWithAlpha(color, 0.06),
        strokeColor: colorWithAlpha(color, 0.18),
        strokeWidth: 1,
        interactive: false,
        zIndex: 1
      });
    });

    return () => {
      circles.forEach((circle) => circle.destroy());
    };
  }, [ready, zones]);

  useEffect(() => {
    if (!ready || !mapRef.current || !mapglRef.current) return;

    const map = mapRef.current;
    const mapgl = mapglRef.current;
    const markers = points
      .filter((point) => typeof point.lat === "number" && typeof point.lng === "number")
      .map((point) => {
        const size = markerRenderSize();
        const marker = new mapgl.Marker(map, {
          coordinates: [point.lng as number, point.lat as number],
          icon: riskMarkerIcon(point),
          size,
          anchor: [size[0] / 2, size[1] / 2],
          zIndex: point.level === "critical" ? 16 : point.level === "high" ? 14 : point.source === "forecast" ? 9 : 10
        });
        marker.on("click", () => onSelect(point.id));
        return marker;
      });

    return () => {
      markers.forEach((marker) => marker.destroy());
    };
  }, [onSelect, points, ready]);

  if (!dgisMapglApiKey) {
    return (
      <div className="dgis-map-shell" aria-hidden="true">
        <div className="dgis-map-message">
          <b>Нужен ключ 2ГИС MapGL</b>
          <span>Добавьте VITE_DGIS_MAPGL_KEY и пересоберите frontend_doc, чтобы включить реальную карту Воронежа.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="dgis-map-shell" aria-hidden="true">
      <div className="dgis-map-node" ref={containerRef} />
      {error && <div className="dgis-map-message"><b>Карта не загрузилась</b><span>{error}</span></div>}
    </div>
  );
}

function riskText(application: Application) {
  return [application.address, application.street, application.problem, application.commission_analysis, application.status].filter(Boolean).join(" ").toLowerCase();
}

function normalizeAddress(value = "") {
  return value
    .toLowerCase()
    .replaceAll("ё", "е")
    .replace(/г\.\s*воронеж/g, "")
    .replace(/\bгород\s+воронеж\b/g, "")
    .replace(/\bул\.\s*/g, "")
    .replace(/\bулица\s+/g, "")
    .replace(/\bпр-т\b/g, "проспект")
    .replace(/\bпросп\.\s*/g, "проспект ")
    .replace(/\bд\.\s*/g, "")
    .replace(/[.,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findReference(address = "") {
  const normalized = normalizeAddress(address);
  if (!normalized) return null;

  const exact = referenceBuildings.find((item) => {
    const candidate = normalizeAddress(item.address);
    return normalized === candidate || normalized.includes(candidate) || candidate.includes(normalized);
  });
  if (exact) return exact;

  const tokens = normalized.split(" ");
  const house = tokens.find((token) => /\d/.test(token));
  if (!house) return null;

  return referenceBuildings.find((item) => {
    const candidate = normalizeAddress(item.address);
    return candidate.includes(house) && tokens.some((token) => token.length > 4 && candidate.includes(token));
  }) || null;
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

function analyzeRisk(application: Application, index: number): RiskPoint | null {
  const text = riskText(application);
  const reference = findReference(application.address || application.street || "");
  if (!reference) return null;
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
  const base: RiskPoint[] = applications
    .map(analyzeRisk)
    .filter((point): point is RiskPoint => Boolean(point));
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

const addressIssueExamples = [
  "осыпается фасадная отделка у пешеходной зоны",
  "требуется проверка карниза и креплений отделки",
  "есть риск падения штукатурного слоя",
  "видны признаки разрушения кровельного узла",
  "нужен осмотр водоотведения и примыканий кровли",
  "трещины фасада требуют инструментальной проверки",
  "подъездная группа нуждается в обследовании",
  "козырек входа требует оценки несущих элементов",
  "балконная плита имеет признаки износа",
  "межпанельные швы нуждаются в герметизации",
  "влага ускоряет разрушение отделочных слоев",
  "требуется ограждение зоны возможного падения",
  "старый фонд требует повторного фасадного обхода",
  "кровля дает следы протечек в верхних квартирах",
  "нужна проверка чердака после осадков",
  "есть признаки промерзания наружных стен",
  "проверить цоколь и подвальные конструкции",
  "осмотреть лестничный марш и площадки",
  "есть риск локального обвала отделки",
  "зафиксировать состояние фасада фотоосмотром",
  "проверить состояние кирпичной кладки",
  "оценить аварийность входной группы",
  "нужна комиссия по фасаду и кровле",
  "проверить крепления ограждений балконов",
  "осмотреть трещины около оконных проемов",
  "проверить деформации карнизной части",
  "проверить следы сырости в подъезде",
  "есть признаки износа старой кровли",
  "оценить риск падения фрагментов на проход",
  "проверить повреждения после ветра и осадков",
  "обследовать участок рядом с входом",
  "проверить состояние фасадных плит",
  "требуется контроль проблемного подъезда",
  "проверить узлы примыкания балконов",
  "зафиксировать дефекты наружной стены",
  "нужна проверка водостоков и свесов",
  "осмотреть аварийные элементы над тротуаром",
  "оценить состояние старых деревянных элементов",
  "проверить следы раскрытия швов",
  "требуется первичный инженерный осмотр",
  "проверить разрушение отделки в тамбуре",
  "осмотреть кровлю над крайним подъездом",
  "проверить безопасность прохода жильцов",
  "оценить риск повторного падения фрагментов",
  "проверить состояние фасада после ремонта",
  "нужна приоритетная проверка старого дома",
  "осмотреть повреждения возле балконов",
  "проверить влажные зоны и электробезопасность",
  "оценить состояние плит и открытой арматуры",
  "проверить фасадные дефекты по обращению"
];

function riskAddressSubtitle(point: RiskPoint) {
  if (point.source === "forecast") return `прогноз: ${point.issue.replace(/^похожий дом:\s*/i, "")}`;
  const group = riskIssueGroup(point);
  const seed = hashAddress(`${point.address}:${point.issue}:${point.score}`);
  const phrase = addressIssueExamples[seed % addressIssueExamples.length];
  return `${group}: ${phrase}`;
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

export function RiskMapPage({ show }: { show: (message: string) => void }) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [levelFilter, setLevelFilter] = useState<"all" | "critical" | "high" | "forecast">("all");

  useEffect(() => {
    const demoMode = isDemoMode();
    if (demoMode) {
      setApplications(demoApplications);
      fetchApplicationsWithoutRedirect()
        .then((backendApplications) => {
          if (backendApplications.length) {
            setApplications(mergeRiskMapApplications(backendApplications, demoApplications));
          }
        })
        .catch(() => undefined);
      return;
    }
    requestJson<{ applications?: Application[] }>("/applications/risk-map")
      .then((data) => setApplications(mergeWithPublicVoronezhApplications(data.applications || [])))
      .catch((error: Error) => show(error.message));
  }, []);

  const points = useMemo(() => buildRiskPoints(applications), [applications]);
  const zones = useMemo(() => buildRiskZones(points), [points]);
  const visiblePoints = useMemo(() => points.filter((point) => {
    if (levelFilter === "all") return true;
    if (levelFilter === "forecast") return point.source === "forecast";
    if (levelFilter === "high") return point.level === "high" || point.level === "critical";
    return point.level === "critical";
  }), [levelFilter, points]);
  const selected = useMemo(
    () => points.find((point) => point.id === selectedId) || visiblePoints[0] || points[0],
    [points, selectedId, visiblePoints]
  );
  const riskStats = useMemo(
    () => visiblePoints.slice().sort((a, b) => b.score - a.score).slice(0, 12),
    [visiblePoints]
  );
  const averageRiskScore = riskStats.length
    ? Math.round(riskStats.reduce((sum, point) => sum + point.score, 0) / riskStats.length)
    : 0;
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
              <DgisMapLayer points={visiblePoints} zones={zones} onSelect={setSelectedId} />
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

        <section className="risk-stats-panel">
          <div className="list-header">
            <div>
              <h2>Сравнение адресов по оценке</h2>
              <p>Показаны адреса из текущего фильтра, отсортированные по убыванию риска.</p>
            </div>
            <div className="risk-stats-summary">
              <span>Средняя оценка: <b>{averageRiskScore}</b></span>
              <span>Адресов: <b>{riskStats.length}</b></span>
            </div>
          </div>
          <div className="risk-stats-table-wrap">
            <table className="risk-stats-table">
              <thead>
                <tr>
                  <th>Адрес</th>
                  <th>Оценка</th>
                  <th>Уровень</th>
                  <th>Источник</th>
                </tr>
              </thead>
              <tbody>
                {riskStats.map((point) => (
                  <tr
                    key={point.id}
                    className={point.id === selected?.id ? "selected" : ""}
                    onClick={() => setSelectedId(point.id)}
                  >
                    <td className="risk-address-cell">
                      <strong>{point.address}</strong>
                      <span>{riskAddressSubtitle(point)}</span>
                    </td>
                    <td><span className={`risk-mini-score ${point.level}`}>{point.score}</span></td>
                    <td><span className={`status-badge risk-${point.level}`}>{riskLabel(point.level)}</span></td>
                    <td>{point.source === "forecast" ? "Прогноз" : "Заявление"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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


