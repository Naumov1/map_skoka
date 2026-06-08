import { useState } from "react";
import type { Street } from "../../shared/types";
export function StreetFilters({ streets, selected, setSelected }: { streets: Street[]; selected: string[]; setSelected: (value: string[]) => void }) {
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


