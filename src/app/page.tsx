'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Client, STATUS_COLORS } from '@/lib/types';
import { getClients, getPortals, getDashboardStats, deleteClient, addActivity, saveClient } from '@/lib/storage';
import { formatDate, getStatusDeadline, exportClientsCSV, downloadCSV, exportToPDF } from '@/lib/utils';

export default function DashboardPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [stats, setStats] = useState({ total: 0, complete: 0, active: 0, overdue: 0, completionRate: 0, avgDays: 0 });
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', email: '', projectType: '', deadline: '' });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    refreshData();
  }, []);

  function refreshData() {
    const allClients = getClients();
    const s = getDashboardStats();
    setClients(allClients);
    setStats(s);
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-lg">Loading ClientVault...</div>
      </div>
    );
  }

  const filtered = clients
    .map(c => ({ ...c, status: getStatusDeadline(c) }))
    .filter(c => {
      const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase()) ||
        c.projectType.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === 'all' || c.status === filterStatus;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  function handleAddClient() {
    if (!newClient.name || !newClient.email) return;
    const id = crypto.randomUUID();
    const client: Client = {
      id,
      name: newClient.name,
      email: newClient.email,
      projectType: newClient.projectType || 'General',
      status: 'active',
      createdAt: new Date().toISOString(),
      deadline: newClient.deadline || undefined,
    };
    saveClient(client);
    addActivity(id, 'status_change', `Client "${client.name}" added`);
    setShowNewClient(false);
    setNewClient({ name: '', email: '', projectType: '', deadline: '' });
    refreshData();
  }

  function handleDeleteClient(id: string) {
    if (!confirm('Delete this client and all their data?')) return;
    const c = clients.find(cl => cl.id === id);
    deleteClient(id);
    if (c) addActivity(id, 'note_added', `Client "${c.name}" deleted`);
    refreshData();
  }

  function handleExportCSV() {
    const csv = exportClientsCSV(clients, getPortals());
    downloadCSV(csv, `clientvault-export-${new Date().toISOString().split('T')[0]}.csv`);
  }

  function handleExportPDF() {
    exportToPDF('dashboard-content', `clientvault-${new Date().toISOString().split('T')[0]}.pdf`);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🔐</span>
              <Link href="/" className="text-xl font-bold text-gray-900">ClientVault</Link>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/forms" className="text-sm text-gray-600 hover:text-gray-900">Forms</Link>
              <Link href="/templates" className="text-sm text-gray-600 hover:text-gray-900">Templates</Link>
              <Link href="/settings" className="text-sm text-gray-600 hover:text-gray-900">Settings</Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="dashboard-content">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 mt-1">Track clients, documents, and onboarding progress</p>
          </div>
          <div className="flex gap-3">
            <button onClick={handleExportCSV} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
              📊 Export CSV
            </button>
            <button onClick={handleExportPDF} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
              📄 Export PDF
            </button>
            <button onClick={() => setShowNewClient(true)} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              + New Client
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-500">Total Clients</div>
          </div>
          <div className="bg-green-50 rounded-xl p-4 border border-green-200">
            <div className="text-2xl font-bold text-green-700">{stats.complete}</div>
            <div className="text-sm text-green-600">Complete ✅</div>
          </div>
          <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
            <div className="text-2xl font-bold text-yellow-700">{stats.active}</div>
            <div className="text-sm text-yellow-600">Pending ⏳</div>
          </div>
          <div className="bg-red-50 rounded-xl p-4 border border-red-200">
            <div className="text-2xl font-bold text-red-700">{stats.overdue}</div>
            <div className="text-sm text-red-600">Overdue 🔴</div>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <div className="text-2xl font-bold text-blue-700">{stats.completionRate}%</div>
            <div className="text-sm text-blue-600">Completion Rate</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="flex gap-2">
            {['all', 'active', 'complete', 'overdue'].map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  filterStatus === s
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s === 'all' ? 'All' : STATUS_COLORS[s as keyof typeof STATUS_COLORS]?.icon + ' ' + s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Client Cards */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No clients yet</h3>
            <p className="text-gray-500 mb-6">Add your first client to get started with ClientVault</p>
            <button onClick={() => setShowNewClient(true)} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              + Add Client
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(client => {
              const sc = STATUS_COLORS[client.status];
              const portals = getPortals();
              const portal = portals.find(p => p.clientId === client.id);
              return (
                <div key={client.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">{client.name}</h3>
                      <p className="text-sm text-gray-500">{client.email}</p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${sc.bg} ${sc.text}`}>
                      {sc.icon} {client.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1 mb-4">
                    <div className="flex items-center gap-2">
                      <span>📁</span>
                      <span>{client.projectType}</span>
                    </div>
                    {client.deadline && (
                      <div className="flex items-center gap-2">
                        <span>📅</span>
                        <span>Deadline: {formatDate(client.deadline)}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span>📨</span>
                      <span>{portal?.formSubmitted ? 'Form submitted' : 'Awaiting response'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                    <Link
                      href={`/client/${client.id}`}
                      className="flex-1 text-center px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                      View Details
                    </Link>
                    <button
                      onClick={() => handleDeleteClient(client.id)}
                      className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New Client Modal */}
      {showNewClient && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add New Client</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={newClient.name}
                  onChange={e => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Client name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={newClient.email}
                  onChange={e => setNewClient(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="client@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Type</label>
                <select
                  value={newClient.projectType}
                  onChange={e => setNewClient(prev => ({ ...prev, projectType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select type...</option>
                  <option value="Design">Design</option>
                  <option value="Development">Development</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Consulting">Consulting</option>
                  <option value="General">General</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deadline (optional)</label>
                <input
                  type="date"
                  value={newClient.deadline}
                  onChange={e => setNewClient(prev => ({ ...prev, deadline: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNewClient(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddClient}
                disabled={!newClient.name || !newClient.email}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Add Client
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}