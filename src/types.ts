export interface NewsletterProduct {
  name: string;
  features: string[];
  target: string;
  benefit: string;
}

export interface NewsletterSummary {
  title: string;
  highlights: string[];
  mainProducts: NewsletterProduct[];
  salesPoint: string;
  notes: string;
}

export interface Newsletter {
  id: string;
  name: string;
  folder: '생명보험' | '손해보험';
  insurer: string;
  publishMonth: string;
  size: string;
  modifiedTime: string;
  summary: NewsletterSummary;
  demoPdfUrl?: string; // fallback PDF url
}

export interface GoogleUser {
  email: string;
  name: string;
  picture: string;
}
