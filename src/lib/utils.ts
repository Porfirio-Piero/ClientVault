// ClientVault — Export Utilities
// CSV (PapaParse) and PDF (html2pdf.js) export

import Papa from 'papaparse';
import { Client, ClientPortalData } from './types';

export function exportClientsCSV(clients: Client[], portals: ClientPortalData[]): string {
  const data = clients.map(client => {
    const portal = portals.find(p => p.clientId === client.id);
    return {
      name: client.name,
      email: client.email,
      projectType: client.projectType,
      status: client.status,
      formSubmitted: portal?.formSubmitted ? 'Yes' : 'No',
      submittedAt: portal?.submittedAt || '',
      shareLink: client.shareLink || '',
      createdAt: client.createdAt,
      deadline: client.deadline || '',
    };
  });
  return Papa.unparse(data);
}

export function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export async function exportToPDF(elementId: string, filename: string): Promise<void> {
  const html2pdf = (await import('html2pdf.js')).default;
  const element = document.getElementById(elementId);
  if (!element) return;

  const opt = {
    margin: [10, 10, 10, 10] as [number, number, number, number],
    filename,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
  };

  await html2pdf().set(opt).from(element).save();
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatRelativeTime(dateStr: string): string {
  if (!dateStr) return '—';
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(dateStr);
}

export function getStatusDeadline(client: Client): Client['status'] {
  if (client.status === 'complete') return 'complete';
  if (client.deadline) {
    const deadlineDate = new Date(client.deadline);
    const now = new Date();
    if (deadlineDate < now) return 'overdue';
  }
  return client.status;
}

export function generateShareUrl(uuid: string): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/portal/${uuid}`;
  }
  return `/portal/${uuid}`;
}