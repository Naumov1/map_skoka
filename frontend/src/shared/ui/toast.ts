import { useCallback, useState } from "react";

export type Toast = { id: number; text: string };
export function useToast() {
  const [toast, setToast] = useState<Toast | null>(null);
  const show = useCallback((text: string) => {
    const next = { id: Date.now(), text };
    setToast(next);
    setTimeout(() => setToast((current) => (current?.id === next.id ? null : current)), 3500);
  }, []);
  return { toast, show };
}

