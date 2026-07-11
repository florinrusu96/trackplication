export interface User {
  id: string;
  email: string;
}

export interface TokenResponse {
  token: string;
  user: User;
}

export type Status =
  | "Applied"
  | "Interviewing"
  | "Offer"
  | "Rejected"
  | "Ghosted";

export interface Application {
  id: string;
  company: string;
  role: string;
  location: string | null;
  salary_text: string | null;
  status: Status;
  source: string | null;
  url: string | null;
  requirements: string[];
  notes: string;
  applied_at: string; // ISO date
  created_at: string;
  updated_at: string;
}

/** Shape returned by POST /api/extract and submitted to POST /api/applications. */
export interface Extracted {
  company: string;
  role: string;
  location: string | null;
  salary_text: string | null;
  source: string | null;
  url: string | null;
  requirements: string[];
}
