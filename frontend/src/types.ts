export type Role = string | { value?: string; name?: string };

export interface User {
  id?: number | string;
  login?: string;
  username?: string;
  fio?: string;
  email?: string;
  role?: Role;
}

export interface Application {
  id: number | string;
  fio?: string;
  phone?: string;
  email?: string;
  street?: string;
  address?: string;
  cadastral_number?: string;
  problem?: string;
  commission_analysis?: string | null;
  status?: string;
  departure_date?: string | null;
  district?: string;
}

export interface CommissionAnalysis {
  applicant: string;
  address: string;
  category: string;
  urgency: string;
  what_happened: string;
  who_needed: string[];
  recommended_actions: string[];
  commission_focus: string[];
  risks: string[];
}

export interface Conclusion {
  id?: number | string;
  conclusion_id?: number | string;
  applications_id?: number | string;
  fio?: string;
  address?: string;
  phone?: string;
  create_date?: string;
  signed?: boolean;
  district?: string;
}

export interface Signature {
  conclusion_id: number | string;
  fio?: string;
  address?: string;
  cadastral_number?: string;
  district?: string;
}

export interface NotificationItem {
  id: number | string;
  text?: string;
  is_read?: boolean;
  read?: boolean;
}

export interface Street {
  street: string;
}
