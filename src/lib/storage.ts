// ClientVault — Storage Layer
// localStorage + IndexedDB for browser-only persistence

import { Client, IntakeForm, BrandSettings, ClientPortalData, ActivityEntry, DocumentAttachment, DEFAULT_BRAND, FormField } from './types';

// ============ localStorage Keys ============
const KEYS = {
  CLIENTS: 'cv_clients',
  FORMS: 'cv_forms',
  BRAND: 'cv_brand',
  PORTALS: 'cv_portals',
  ACTIVITY: 'cv_activity',
} as const;

// ============ localStorage CRUD ============

function getFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Storage write failed:', e);
  }
}

// ============ Client Operations ============

export function getClients(): Client[] {
  return getFromStorage<Client[]>(KEYS.CLIENTS, []);
}

export function getClient(id: string): Client | undefined {
  return getClients().find(c => c.id === id);
}

export function saveClient(client: Client): void {
  const clients = getClients();
  const idx = clients.findIndex(c => c.id === client.id);
  if (idx >= 0) {
    clients[idx] = client;
  } else {
    clients.push(client);
  }
  setToStorage(KEYS.CLIENTS, clients);
}

export function deleteClient(id: string): void {
  const clients = getClients().filter(c => c.id !== id);
  setToStorage(KEYS.CLIENTS, clients);
  // Also clean up related portal and activity
  const portals = getPortals().filter(p => p.clientId !== id);
  setToStorage(KEYS.PORTALS, portals);
  const activity = getActivity().filter(a => a.clientId !== id);
  setToStorage(KEYS.ACTIVITY, activity);
}

// ============ Form Operations ============

export function getForms(): IntakeForm[] {
  return getFromStorage<IntakeForm[]>(KEYS.FORMS, []);
}

export function getForm(id: string): IntakeForm | undefined {
  return getForms().find(f => f.id === id);
}

export function saveForm(form: IntakeForm): void {
  const forms = getForms();
  const idx = forms.findIndex(f => f.id === form.id);
  if (idx >= 0) {
    forms[idx] = form;
  } else {
    forms.push(form);
  }
  setToStorage(KEYS.FORMS, forms);
}

export function deleteForm(id: string): void {
  const forms = getForms().filter(f => f.id !== id);
  setToStorage(KEYS.FORMS, forms);
}

// ============ Brand Settings ============

export function getBrandSettings(): BrandSettings {
  return getFromStorage<BrandSettings>(KEYS.BRAND, DEFAULT_BRAND);
}

export function saveBrandSettings(settings: BrandSettings): void {
  setToStorage(KEYS.BRAND, settings);
}

// ============ Portal Operations ============

export function getPortals(): ClientPortalData[] {
  return getFromStorage<ClientPortalData[]>(KEYS.PORTALS, []);
}

export function getPortal(id: string): ClientPortalData | undefined {
  return getPortals().find(p => p.id === id);
}

export function getPortalByUuid(uuid: string): ClientPortalData | undefined {
  return getPortals().find(p => p.shareUuid === uuid);
}

export function savePortal(portal: ClientPortalData): void {
  const portals = getPortals();
  const idx = portals.findIndex(p => p.id === portal.id);
  if (idx >= 0) {
    portals[idx] = portal;
  } else {
    portals.push(portal);
  }
  setToStorage(KEYS.PORTALS, portals);
}

// ============ Activity Operations ============

export function getActivity(): ActivityEntry[] {
  return getFromStorage<ActivityEntry[]>(KEYS.ACTIVITY, []);
}

export function addActivity(clientId: string, type: ActivityEntry['type'], description: string): void {
  const activity = getActivity();
  activity.unshift({
    id: crypto.randomUUID(),
    clientId,
    type,
    description,
    timestamp: new Date().toISOString(),
  });
  // Keep last 200 entries
  if (activity.length > 200) activity.length = 200;
  setToStorage(KEYS.ACTIVITY, activity);
}

// ============ Stats ============

export function getDashboardStats() {
  const clients = getClients();
  const total = clients.length;
  const complete = clients.filter(c => c.status === 'complete').length;
  const active = clients.filter(c => c.status === 'active').length;
  const overdue = clients.filter(c => c.status === 'overdue').length;
  const completionRate = total > 0 ? Math.round((complete / total) * 100) : 0;

  // Calculate average days to complete
  const portals = getPortals();
  const submitted = portals.filter(p => p.formSubmitted && p.submittedAt);
  let avgDays = 0;
  if (submitted.length > 0) {
    const totalDays = submitted.reduce((sum, p) => {
      const created = new Date(p.createdAt).getTime();
      const submitted = new Date(p.submittedAt!).getTime();
      return sum + (submitted - created) / (1000 * 60 * 60 * 24);
    }, 0);
    avgDays = Math.round(totalDays / submitted.length);
  }

  return { total, complete, active, overdue, completionRate, avgDays };
}

// ============ Data Export ============

export function exportAllData(): string {
  return JSON.stringify({
    clients: getClients(),
    forms: getForms(),
    portals: getPortals(),
    activity: getActivity(),
    brand: getBrandSettings(),
  }, null, 2);
}

export function clearAllData(): void {
  Object.values(KEYS).forEach(key => localStorage.removeItem(key));
}

// ============ Template Forms ============

export function getTemplateForms(): IntakeForm[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'tpl-design',
      name: 'Design Brief',
      description: 'Collect brand assets, project goals, and visual preferences from design clients.',
      isTemplate: true,
      templateCategory: 'design',
      createdAt: now,
      updatedAt: now,
      fields: [
        { id: 'f1', type: 'text', label: 'Project Name', required: true, order: 0 },
        { id: 'f2', type: 'paragraph', label: 'Project Goals & Description', required: true, helpText: 'What are you trying to achieve?', order: 1 },
        { id: 'f3', type: 'document', label: 'Brand Guidelines', required: false, helpText: 'Upload your brand guide PDF or images', order: 2 },
        { id: 'f4', type: 'document', label: 'Logo Files', required: true, helpText: 'Upload logo in SVG, PNG, or AI format', order: 3 },
        { id: 'f5', type: 'document', label: 'Fonts & Typography', required: false, helpText: 'Upload font files or list font names', order: 4 },
        { id: 'f6', type: 'dropdown', label: 'Budget Range', required: true, options: ['Under $1K', '$1K-$5K', '$5K-$10K', '$10K+'], order: 5 },
        { id: 'f7', type: 'date', label: 'Target Completion Date', required: true, order: 6 },
        { id: 'f8', type: 'text', label: 'Brand Colors', required: false, helpText: 'List primary and secondary hex codes', order: 7 },
        { id: 'f9', type: 'paragraph', label: 'Design Inspiration / References', required: false, helpText: 'Links to designs you like', order: 8 },
      ],
    },
    {
      id: 'tpl-development',
      name: 'Development Project',
      description: 'Gather technical requirements, access credentials, and project specs from dev clients.',
      isTemplate: true,
      templateCategory: 'development',
      createdAt: now,
      updatedAt: now,
      fields: [
        { id: 'f1', type: 'text', label: 'Project Name', required: true, order: 0 },
        { id: 'f2', type: 'paragraph', label: 'Project Description', required: true, order: 1 },
        { id: 'f3', type: 'dropdown', label: 'Tech Stack', required: true, options: ['React/Next.js', 'Vue/Nuxt', 'Angular', 'Python/Django', 'Node.js/Express', 'Other'], order: 2 },
        { id: 'f4', type: 'document', label: 'Existing Codebase / Repository', required: false, helpText: 'Upload a zip or share a repo link', order: 3 },
        { id: 'f5', type: 'document', label: 'Documentation & Specs', required: false, order: 4 },
        { id: 'f6', type: 'text', label: 'Hosting Details', required: false, helpText: 'Where is it deployed or planned to deploy?', order: 5 },
        { id: 'f7', type: 'date', label: 'Launch Deadline', required: true, order: 6 },
        { id: 'f8', type: 'number', label: 'Estimated Budget ($)', required: true, order: 7 },
        { id: 'f9', type: 'checkbox', label: 'I have existing APIs that need integration', required: false, order: 8 },
      ],
    },
    {
      id: 'tpl-marketing',
      name: 'Marketing Campaign',
      description: 'Collect campaign briefs, creative assets, and KPIs from marketing clients.',
      isTemplate: true,
      templateCategory: 'marketing',
      createdAt: now,
      updatedAt: now,
      fields: [
        { id: 'f1', type: 'text', label: 'Campaign Name', required: true, order: 0 },
        { id: 'f2', type: 'paragraph', label: 'Target Audience', required: true, helpText: 'Who are we trying to reach?', order: 1 },
        { id: 'f3', type: 'dropdown', label: 'Channel', required: true, options: ['Social Media', 'Email', 'PPC/Ads', 'Content', 'Multi-Channel'], order: 2 },
        { id: 'f4', type: 'document', label: 'Creative Assets', required: false, helpText: 'Upload images, videos, copy', order: 3 },
        { id: 'f5', type: 'paragraph', label: 'Brand Voice & Tone', required: false, order: 4 },
        { id: 'f6', type: 'text', label: 'Key KPIs', required: false, helpText: 'What metrics matter most?', order: 5 },
        { id: 'f7', type: 'date', label: 'Campaign Start Date', required: true, order: 6 },
        { id: 'f8', type: 'date', label: 'Campaign End Date', required: true, order: 7 },
      ],
    },
    {
      id: 'tpl-consulting',
      name: 'Consulting Engagement',
      description: 'Collect scope, deliverables, and access requirements from consulting clients.',
      isTemplate: true,
      templateCategory: 'consulting',
      createdAt: now,
      updatedAt: now,
      fields: [
        { id: 'f1', type: 'text', label: 'Engagement Title', required: true, order: 0 },
        { id: 'f2', type: 'paragraph', label: 'Scope of Work', required: true, order: 1 },
        { id: 'f3', type: 'dropdown', label: 'Meeting Cadence', required: true, options: ['Weekly', 'Bi-weekly', 'Monthly', 'As needed'], order: 2 },
        { id: 'f4', type: 'document', label: 'Deliverables Template', required: false, order: 3 },
        { id: 'f5', type: 'text', label: 'Access Requirements', required: false, helpText: 'What tools/platforms do you need access to?', order: 4 },
        { id: 'f6', type: 'number', label: 'Duration (weeks)', required: true, order: 5 },
        { id: 'f7', type: 'paragraph', label: 'Success Criteria', required: false, helpText: 'How will we measure success?', order: 6 },
      ],
    },
  ];
}

export function seedTemplatesIfNeeded(): void {
  const existing = getForms();
  const templates = getTemplateForms();
  for (const tpl of templates) {
    if (!existing.find(f => f.id === tpl.id)) {
      saveForm(tpl);
    }
  }
}