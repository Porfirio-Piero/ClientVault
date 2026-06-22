'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Client, IntakeForm, ClientPortalData, ActivityEntry, STATUS_COLORS, DocumentAttachment } from '@/lib/types';
import { getClient, getForm, getPortals, saveClient, savePortal, addActivity, getActivity } from '@/lib/storage';
import { formatDate, formatRelativeTime, generateShareUrl, getStatusDeadline } from '@/lib/utils';

export default function ClientDetailPage() {
  const params = useParams();
  const clientId = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [portal, setPortal] = useState<ClientPortalData | null>(null);
  const [form, setForm] = useState<IntakeForm | null>(null);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [mounted, setMounted] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ name: '', email: '', projectType: '', deadline: '', notes: '' });
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadData();
  }, [clientId]);

  function loadData() {
    const c = getClient(clientId);
    if (c) {
      const withStatus = { ...c, status: getStatusDeadline(c) };
      setClient(withStatus);
      setEditData({
        name: c.name,
        email: c.email,
        projectType: c.projectType,
        deadline: c.deadline || '',
        notes: c.notes || '',
      });

      const portals = getPortals();
      const p = portals.find(p => p.clientId === clientId);
      if (p) {
        setPortal(p);
        if (p.formId) {
          const f = getForm(p.formId);
          if (f) setForm(f);
        }
      }
    }
    const act = getActivity().filter(a => a.clientId === clientId);
    setActivity(act);
  }

  if (!mounted || !client) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-lg">{!client && mounted ? 'Client not found' : 'Loading...'}</div>
        {(!client && mounted) && (
          <Link href="/" className="mt-4 text-blue-600 hover:underline block">← Back to Dashboard</Link>
        )}
      </div>
    );
  }

  const sc = STATUS_COLORS[client.status];

  function handleGenerateLink() {
    if (!client) return;
    const uuid = crypto.randomUUID();
    const formId = client.formId || form?.id || 'tpl-design';
    const newPortal: ClientPortalData = {
      id: crypto.randomUUID(),
      clientId: client.id,
      formId,
      shareUuid: uuid,
      formSubmitted: false,
      receivedDocuments: [],
      createdAt: new Date().toISOString(),
    };
    savePortal(newPortal);
    const updatedClient = { ...client, shareLink: generateShareUrl(uuid) };
    saveClient(updatedClient);
    addActivity(client.id, 'link_generated', `Share link generated for ${client.name}`);
    setPortal(newPortal);
    setClient(updatedClient);
    setLinkCopied(false);
  }

  function handleRevokeLink() {
    if (!portal || !client) return;
    if (!confirm('Revoke this share link? The client will no longer be able to access the portal.')) return;
    // Remove the portal
    const portals = getPortals().filter(p => p.id !== portal.id);
    localStorage.setItem('cv_portals', JSON.stringify(portals));
    const updatedClient: Client = { ...client, shareLink: undefined };
    saveClient(updatedClient);
    addActivity(client.id, 'link_revoked', `Share link revoked for ${client.name}`);
    setPortal(null);
    setClient(updatedClient);
  }

  function handleCopyLink() {
    if (!portal) return;
    const url = generateShareUrl(portal.shareUuid);
    navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  function handleSaveEdit() {
    if (!client) return;
    const updated: Client = {
      ...client,
      name: editData.name,
      email: editData.email,
      projectType: editData.projectType,
      deadline: editData.deadline || undefined,
      notes: editData.notes || undefined,
    };
    saveClient(updated);
    addActivity(client.id, 'note_added', `Client details updated for ${updated.name}`);
    setClient({ ...updated, status: getStatusDeadline(updated) });
    setEditing(false);
  }

  function handleMarkComplete() {
    if (!client) return;
    const updated = { ...client, status: 'complete' as const };
    saveClient(updated);
    addActivity(client.id, 'status_change', `${client.name} marked as complete`);
    setClient(updated);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">← Dashboard</Link>
              <span className="text-gray-300">|</span>
              <span className="text-xl font-bold text-gray-900">🔐 ClientVault</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/forms" className="text-sm text-gray-600 hover:text-gray-900">Forms</Link>
              <Link href="/templates" className="text-sm text-gray-600 hover:text-gray-900">Templates</Link>
              <Link href="/settings" className="text-sm text-gray-600 hover:text-gray-900">Settings</Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Client Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="flex-1">
              {editing ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editData.name}
                    onChange={e => setEditData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-lg font-semibold"
                  />
                  <input
                    type="email"
                    value={editData.email}
                    onChange={e => setEditData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <select
                    value={editData.projectType}
                    onChange={e => setEditData(prev => ({ ...prev, projectType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="Design">Design</option>
                    <option value="Development">Development</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Consulting">Consulting</option>
                    <option value="General">General</option>
                  </select>
                  <input
                    type="date"
                    value={editData.deadline}
                    onChange={e => setEditData(prev => ({ ...prev, deadline: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <textarea
                    value={editData.notes}
                    onChange={e => setEditData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows={3}
                    placeholder="Notes..."
                  />
                  <div className="flex gap-2">
                    <button onClick={handleSaveEdit} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">Save</button>
                    <button onClick={() => setEditing(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${sc.bg} ${sc.text}`}>
                      {sc.icon} {client.status}
                    </span>
                  </div>
                  <p className="text-gray-500">{client.email}</p>
                  <div className="flex gap-4 mt-2 text-sm text-gray-600">
                    <span>📁 {client.projectType}</span>
                    {client.deadline && <span>📅 Due {formatDate(client.deadline)}</span>}
                    <span>Added {formatDate(client.createdAt)}</span>
                  </div>
                  {client.notes && <p className="mt-2 text-sm text-gray-500 italic">{client.notes}</p>}
                </>
              )}
            </div>
            {!editing && (
              <div className="flex gap-2">
                <button onClick={() => setEditing(true)} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">✏️ Edit</button>
                {client.status !== 'complete' && (
                  <button onClick={handleMarkComplete} className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">✅ Complete</button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Share Link Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">🔗 Share Link</h2>
          {!portal ? (
            <div>
              <p className="text-gray-500 mb-3">Generate a share link for your client to upload documents and fill the intake form.</p>
              <button onClick={handleGenerateLink} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Generate Share Link
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={generateShareUrl(portal.shareUuid)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono"
                />
                <button onClick={handleCopyLink} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm">
                  {linkCopied ? '✅ Copied!' : '📋 Copy'}
                </button>
                <button onClick={handleRevokeLink} className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm">
                  🚫 Revoke
                </button>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>📨 {portal.formSubmitted ? 'Form submitted' : 'Awaiting response'}</span>
                <span>📎 {portal.receivedDocuments.length} document{portal.receivedDocuments.length !== 1 ? 's' : ''}</span>
                {portal.lastAccessedAt && <span>Last accessed {formatRelativeTime(portal.lastAccessedAt)}</span>}
              </div>
            </div>
          )}
        </div>

        {/* Documents Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📎 Documents</h2>
          {portal && portal.receivedDocuments.length > 0 ? (
            <div className="space-y-2">
              {portal.receivedDocuments.map((doc: DocumentAttachment) => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📄</span>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{doc.name}</div>
                      <div className="text-xs text-gray-500">{(doc.size / 1024).toFixed(1)} KB · {formatDate(doc.uploadedAt)}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = doc.data;
                      link.download = doc.name;
                      link.click();
                    }}
                    className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    ⬇️ Download
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No documents received yet. Share the link with your client to get started.</p>
          )}
        </div>

        {/* Form Submission Section */}
        {portal?.formSubmitted && portal.formValues && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">📋 Form Submission</h2>
            <div className="space-y-3">
              {form?.fields.map(field => (
                <div key={field.id} className="flex flex-col sm:flex-row gap-2 p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700 w-48 shrink-0">{field.label}</span>
                  <span className="text-sm text-gray-900">
                    {portal.formValues?.[field.id] !== undefined
                      ? String(portal.formValues[field.id])
                      : '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activity Timeline */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📝 Activity Timeline</h2>
          {activity.length > 0 ? (
            <div className="space-y-3">
              {activity.slice(0, 20).map(entry => (
                <div key={entry.id} className="flex gap-3 text-sm">
                  <span className="text-gray-400 w-20 shrink-0">{formatRelativeTime(entry.timestamp)}</span>
                  <span className="text-gray-700">{entry.description}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No activity yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}