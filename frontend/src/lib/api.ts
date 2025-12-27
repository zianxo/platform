export interface Client {
    id: string;
    company_name: string;
    country?: string;
    timezone?: string;
    billing_currency?: string;
    status: 'LEAD' | 'QUALIFIED' | 'ACTIVE' | 'CHURNED' | 'ARCHIVED';
    industry?: string;
    address?: string;
    notes?: string;
    created_at: string;
}

export interface PlannedRole {
    id: string;
    project_id: string;
    role_name: string;
    count: number;
    bill_rate: number;
    created_at: string;
}

export interface TeamMember {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
}

export interface ParentProject {
  id: string;
  client_id: string;
  name: string;
  description: string;
  status: "TRIAL" | "ACTIVE" | "ENDING" | "ENDED";
  engagement_type?: "TIME_AND_MATERIALS" | "FIXED";
  monthly_budget?: number;
  target_hours_per_week?: number;
  billable_days_per_month?: number;
  planned_roles?: PlannedRole[];
  team_members?: TeamMember[];
  active_assignments_count?: number;
  current_weekly_hours?: number;
  actual_monthly_revenue?: number;
  actual_monthly_cost?: number;
  planned_monthly_revenue?: number;
  created_at: string;
}

export interface ProjectAssignment {
    id: string;
    project_id: string;
    client_id?: string;
    talent_id: string;
    role: string;
    hours_per_week?: number;
    monthly_client_rate?: number;
    monthly_contractor_cost: number;
    daily_payout_rate?: number;
    daily_bill_rate?: number;
    start_date: string;
    trial_end_date?: string;
    status: string;
    created_at: string;
}


export interface Project {
    id: string;
    client_id: string;
    talent_id: string;
    role: string;
    start_date: string;
    monthly_client_rate: number;
    monthly_contractor_cost: number;
    status: string;
    created_at: string;
}

export interface Talent {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
    seniority?: string;
    country?: string;
    source?: string;
    skills?: string[];
    notes?: string;
    linkedin_url?: string;
    timezone?: string;
    english_level?: string;
    status?: "SOURCED" | "PRE_SCREENED" | "BENCH_AVAILABLE" | "BENCH_UNAVAILABLE" | "ACTIVE_INTERVIEWING" | "PLACED" | "ARCHIVED";
    history?: {
        status: string;
        notes: string;
        changed_at: string;
    }[];
    created_at: string;
}

export interface Invoice {
    id: string;
    client_id: string;
    billing_month: string;
    total_amount: number;
    currency: string;
    status: "DRAFT" | "SENT" | "PAID" | "OVERDUE";
    line_items?: {
        description: string;
        amount: number;
        project_id?: string;
    }[];
    created_at: string;
}

export interface ContractorPayment {
    id: string;
    talent_id: string;
    project_id: string;
    billing_month: string;
    amount: number;
    status: "PENDING" | "PAID";
    created_at: string;
}

export interface Document {
    id: string;
    entity_type: string;
    entity_id: string;
    file_name: string;
    file_type?: string;
    file_size?: number;
    status: string;
    file_url: string;
    file_key: string;
    ocr_status?: string;
    content?: string;
    uploaded_at: string;
}

export interface Capital {
  id: string;
  name: string;
  balance: number;
  currency: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  name: string;
  total_amount: number;
  spent_amount?: number;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  budget_id?: string;
}

export interface Investment {
  id: string;
  name: string;
  investor: string;
  initial_amount: number;
  current_value: number;
  start_date: string;
  status: string;
}



const NEXT_PUBLIC_API_URL = "/api";

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
      this.token = token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...options.headers,
    };

    // Note: We still allow explicit token setting for now during transition or non-cookie usage,
    // but the primary mechanism will be cookies managed by the browser for /api calls.
    if (this.token) {
        (headers as Record<string, string>)["Authorization"] = `Bearer ${this.token}`;
    }

    const res = await fetch(`${NEXT_PUBLIC_API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const error = await res.text();
      try {
          const jsonError = JSON.parse(error);
          throw new Error(jsonError.error || jsonError.message || `API request failed: ${res.statusText}`);
      } catch (e) {
          throw new Error(error || `API request failed: ${res.statusText}`);
      }
    }

    if (res.status === 204) {
        return {} as T;
    }

    const contentType = res.headers.get("Content-Type");
    if (contentType && contentType.includes("application/json")) {
        return res.json();
    }

    return {} as T;
  }

  get auth() {
      return {
          login: (username: string, password: string) => this.request<{ token: string; user: any }>("/auth/login", { 
              method: "POST", 
              body: JSON.stringify({ username, password }) 
          }),
          register: (data: any) => this.request<any>("/auth/register", {
              method: "POST",
              body: JSON.stringify(data)
          }),
          me: () => this.request<any>("/auth/me"),
          updateProfile: (data: any) => this.request<any>("/auth/me", {
              method: "PUT",
              body: JSON.stringify(data)
          }),
      }
  }

  get skills() {
      return {
          list: () => this.request<{id: string, name: string, category: string}[]>("/skills"),
          create: (name: string, category: string = "General") => this.request<any>("/skills", {
              method: "POST",
              body: JSON.stringify({ name, category })
          }),
          delete: (id: string) => this.request<any>(`/skills?id=${id}`, {
              method: "DELETE"
          }),
          updateCategory: (oldName: string, newName: string) => this.request<any>("/skills/category", {
              method: "PUT",
              body: JSON.stringify({ oldName, newName })
          }),
      }
  }

  get talent() {
    return {
      list: () => this.request<Talent[]>("/talent"),
      get: (id: string) => this.request<Talent>(`/talent/${id}`),
      create: (data: Partial<Talent>) => this.request<Talent>("/talent", { method: "POST", body: JSON.stringify(data) }),
      update: (id: string, data: Partial<Talent>) => this.request<Talent>(`/talent/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    };
  }

  get clients() {
    return {
      list: () => this.request<Client[]>("/clients"),
      create: (data: Partial<Client>) => this.request<Client>("/clients", { method: "POST", body: JSON.stringify(data) }),
      update: (id: string, data: Partial<Client>) => this.request<Client>(`/clients/${id}`, { method: "PUT", body: JSON.stringify(data) }),
      createContact: (clientId: string, data: any) => this.request<any>(`/clients/${clientId}/contacts`, {
          method: "POST",
          body: JSON.stringify(data)
      }),
      listContacts: (clientId: string) => this.request<any[]>(`/clients/${clientId}/contacts`),
      updateContact: (clientId: string, contactId: string, data: any) => this.request<any>(`/clients/${clientId}/contacts/${contactId}`, {
          method: "PUT",
          body: JSON.stringify(data)
      }),
      deleteContact: (clientId: string, contactId: string) => this.request<any>(`/clients/${clientId}/contacts/${contactId}`, {
          method: "DELETE"
      }),
      archive: (id: string) => this.request<any>(`/clients/${id}/archive`, {
          method: "PUT"
      }),
    };
  }

  get projects() {
  
  // Update Project interface compatibility or replace
  // For backwards compat with existing UI code, I'll keep 'Project' type but map it to Assignment? 
  // No, I should refactor UI to use 'Assignment' where applicable.
  // But strictly, 'Project' usually means the Placement. 
  // I will introduce 'assignments' namespace.
  
    return {
      list: () => this.request<ParentProject[]>("/projects"),
      get: (id: string) => this.request<ParentProject>(`/projects/${id}`),
      create: (data: Partial<ParentProject>) => this.request<ParentProject>("/projects", { method: "POST", body: JSON.stringify(data) }),
      update: (id: string, data: Partial<ParentProject>) => this.request<ParentProject>(`/projects/${id}`, { method: "PUT", body: JSON.stringify(data) }),
      delete: (id: string) => this.request<void>(`/projects/${id}`, { method: "DELETE" }),
      
      assignments: {
          list: () => this.request<ProjectAssignment[]>("/assignments"),
          get: (id: string) => this.request<ProjectAssignment>(`/assignments/${id}`),
          create: (data: Partial<ProjectAssignment>) => this.request<ProjectAssignment>("/assignments", { method: "POST", body: JSON.stringify(data) }),
          update: (id: string, data: Partial<ProjectAssignment>) => this.request<ProjectAssignment>(`/assignments/${id}`, { method: "PUT", body: JSON.stringify(data) }),
          delete: (id: string) => this.request<void>(`/assignments/${id}`, { method: "DELETE" }),
          listByProject: (projectId: string) => this.request<ProjectAssignment[]>(`/projects/${projectId}/assignments`),
      },
    }
  }

  get invoices() {
      return {
          list: () => this.request<Invoice[]>("/invoices"),
          create: (data: Partial<Invoice>) => this.request<Invoice>("/invoices", { method: "POST", body: JSON.stringify(data) }),
      }
  }

  get payments() {
      return {
          list: () => this.request<ContractorPayment[]>("/payments"),
          create: (data: Partial<ContractorPayment>) => this.request<ContractorPayment>("/payments", { method: "POST", body: JSON.stringify(data) }),
      }
  }

  get contracts() {
      return {
          list: () => this.request<any[]>("/contracts"),
          create: (data: any) => this.request<any>("/contracts", { method: "POST", body: JSON.stringify(data) }),
          delete: (id: string) => this.request<void>(`/contracts/${id}`, { method: "DELETE" }),
      }
  }

  get documents() {
      return {
          list: () => this.request<Document[]>("/documents"),
          create: (data: Partial<Document>) => this.request<Document>("/documents", { method: "POST", body: JSON.stringify(data) }),
          delete: (id: string) => this.request<void>(`/documents/${id}`, { method: "DELETE" }),
          update: (id: string, data: Partial<Document>) => this.request<void>(`/documents/${id}`, { method: "PUT", body: JSON.stringify(data) }),
      }
  }

  get users() {
      return {
          create: (data: any) => this.request<any>("/users", {
              method: "POST",
              body: JSON.stringify(data)
          }),
          list: (clientId?: string) => this.request<any[]>(`/users${clientId ? `?client_id=${clientId}` : ''}`),
          update: (id: string, data: any) => this.request<any>(`/users/${id}`, {
              method: "PUT",
              body: JSON.stringify(data)
          }),
          delete: (id: string) => this.request<void>(`/users/${id}`, { method: "DELETE" }),
      }
  }

  get finance() {
    return {
      capital: {
        list: () => this.request<Capital[]>("/finance/capital"),
        create: (data: Partial<Capital>) => this.request<Capital>("/finance/capital", { method: "POST", body: JSON.stringify(data) }),
      },
      budgets: {
        list: () => this.request<Budget[]>("/finance/budgets"),
        create: (data: Partial<Budget>) => this.request<Budget>("/finance/budgets", { method: "POST", body: JSON.stringify(data) }),
      },
      expenses: {
        list: () => this.request<Expense[]>("/finance/expenses"),
        create: (data: Partial<Expense>) => this.request<Expense>("/finance/expenses", { method: "POST", body: JSON.stringify(data) }),
      },
      investments: {
        list: () => this.request<Investment[]>("/finance/investments"),
        create: (data: Partial<Investment>) => this.request<Investment>("/finance/investments", { method: "POST", body: JSON.stringify(data) }),
      }
    };
  }
}

export const api = new ApiClient();
