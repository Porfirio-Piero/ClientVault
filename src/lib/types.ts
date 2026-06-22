// ClientVault — Type Definitions
// All data models for the freelancer onboarding & document hub

export interface BrandSettings {
  businessName: string;
  logo?: string; // base64 encoded
  primaryColor: string;
  secondaryColor: string;
  defaultFormId?: string;
  linkExpirationDays: number; // 7, 30, or 0 (never)
}

export interface FormField {
  id: string;
  type: 'text' | 'paragraph' | 'document' | 'checkbox' | 'dropdown' | 'date' | 'number';
  label: string;
  helpText?: string;
  required: boolean;
  options?: string[]; // for dropdown type
  order: number;
}

export interface IntakeForm {
  id: string;
  name: string;
  description?: string;
  fields: FormField[];
  isTemplate: boolean;
  templateCategory?: 'design' | 'development' | 'marketing' | 'consulting' | 'custom';
  createdAt: string;
  updatedAt: string;
}

export interface DocumentAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  data: string; // base64 encoded file data
  uploadedAt: string;
}

export interface FormSubmission {
  formId: string;
  clientPortalId: string;
  values: Record<string, string | string[] | boolean>;
  documents: DocumentAttachment[];
  submittedAt: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  projectType: string;
  status: 'active' | 'complete' | 'overdue';
  formId?: string;
  shareLink?: string;
  createdAt: string;
  deadline?: string;
  notes?: string;
}

export interface ClientPortalData {
  id: string;
  clientId: string;
  formId: string;
  shareUuid: string;
  formSubmitted: boolean;
  submittedAt?: string;
  receivedDocuments: DocumentAttachment[];
  formValues?: Record<string, string | string[] | boolean>;
  lastAccessedAt?: string;
  createdAt: string;
}

export interface ActivityEntry {
  id: string;
  clientId: string;
  type: 'document_received' | 'form_submitted' | 'link_generated' | 'link_revoked' | 'status_change' | 'note_added';
  description: string;
  timestamp: string;
}

export type ClientStatus = 'active' | 'complete' | 'overdue';

export const STATUS_COLORS: Record<ClientStatus, { bg: string; text: string; icon: string }> = {
  active: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '⏳' },
  complete: { bg: 'bg-green-100', text: 'text-green-800', icon: '✅' },
  overdue: { bg: 'bg-red-100', text: 'text-red-800', icon: '🔴' },
};

export const DEFAULT_BRAND: BrandSettings = {
  businessName: 'My Business',
  primaryColor: '#3B82F6',
  secondaryColor: '#10B981',
  linkExpirationDays: 30,
};