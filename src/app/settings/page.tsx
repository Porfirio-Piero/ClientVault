'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BrandSettings } from '@/lib/types';
import { getBrandSettings, saveBrandSettings, exportAllData, clearAllData, getForms } from '@/lib/storage';
import { downloadCSV, exportClientsCSV } from '@/lib/utils';
import { getClients, getPortals } from '@/lib/storage';
import { DEFAULT_BRAND } from '@/lib/types';

export default function SettingsPage() {
  const [brand, setBrand] = useState<BrandSettings>(DEFAULT_BRAND);
  const [mounted, setMounted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>('');

  useEffect(() => {
    setMounted(true);
    setBrand(getBrandSettings());
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-lg">Loading...</div>
      </div>
    );
  }

  function handleSave() {
    saveBrandSettings(brand);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setBrand(prev => ({ ...prev, logo: dataUrl }));
      setLogoPreview(dataUrl);
    };
    reader.readAsDataURL(file);
  }

  function handleExportAll() {
    const data = exportAllData();
    const blob = new Blob([data], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `clientvault-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function handleExportCSV() {
    const csv = exportClientsCSV(getClients(), getPortals());
    downloadCSV(csv, `clientvault-clients-${new Date().toISOString().split('T')[0]}.csv`);
  }

  function handleClearAll() {
    if (!showClearConfirm) {
      setShowClearConfirm(true);
      return;
    }
    clearAllData();
    setBrand(DEFAULT_BRAND);
    setShowClearConfirm(false);
    alert('All data has been cleared.');
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
              <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">Dashboard</Link>
              <Link href="/forms" className="text-sm text-gray-600 hover:text-gray-900">Forms</Link>
              <Link href="/templates" className="text-sm text-gray-600 hover:text-gray-900">Templates</Link>
              <span className="text-sm text-blue-600 font-medium">Settings</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-500 mb-8">Customize your branding, defaults, and data management</p>

        {/* Brand Settings */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">🎨 Brand Customization</h2>

          <div className="space-y-5">
            {/* Logo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Business Logo</label>
              <div className="flex items-center gap-4">
                {(logoPreview || brand.logo) ? (
                  <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
                    <img src={logoPreview || brand.logo} alt="Logo" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center border border-gray-200 border-dashed">
                    <span className="text-2xl text-gray-300">📷</span>
                  </div>
                )}
                <div>
                  <label className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer">
                    Upload Logo
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  </label>
                  {brand.logo && (
                    <button
                      onClick={() => { setBrand(prev => ({ ...prev, logo: undefined })); setLogoPreview(''); }}
                      className="ml-3 text-sm text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Business Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
              <input
                type="text"
                value={brand.businessName}
                onChange={e => setBrand(prev => ({ ...prev, businessName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Your business name"
              />
            </div>

            {/* Colors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={brand.primaryColor}
                    onChange={e => setBrand(prev => ({ ...prev, primaryColor: e.target.value }))}
                    className="w-10 h-10 rounded cursor-pointer border border-gray-300"
                  />
                  <input
                    type="text"
                    value={brand.primaryColor}
                    onChange={e => setBrand(prev => ({ ...prev, primaryColor: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={brand.secondaryColor}
                    onChange={e => setBrand(prev => ({ ...prev, secondaryColor: e.target.value }))}
                    className="w-10 h-10 rounded cursor-pointer border border-gray-300"
                  />
                  <input
                    type="text"
                    value={brand.secondaryColor}
                    onChange={e => setBrand(prev => ({ ...prev, secondaryColor: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="p-4 rounded-xl border border-gray-200">
              <p className="text-sm text-gray-500 mb-2">Preview</p>
              <div
                className="portal-header rounded-lg p-4 text-white text-center"
                style={{ background: `linear-gradient(135deg, ${brand.primaryColor}, ${brand.secondaryColor})` }}
              >
                <div className="flex items-center justify-center gap-2">
                  {(logoPreview || brand.logo) && (
                    <img src={logoPreview || brand.logo} alt="Logo" className="w-8 h-8 rounded-full" />
                  )}
                  <span className="text-lg font-bold">{brand.businessName || 'My Business'}</span>
                </div>
                <p className="text-sm opacity-80 mt-1">Client Onboarding Portal</p>
              </div>
            </div>
          </div>
        </div>

        {/* Default Settings */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">⚙️ Defaults</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Intake Form</label>
              <select
                value={brand.defaultFormId || ''}
                onChange={e => setBrand(prev => ({ ...prev, defaultFormId: e.target.value || undefined }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No default (choose each time)</option>
                {getForms().map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Link Expiration</label>
              <select
                value={brand.linkExpirationDays}
                onChange={e => setBrand(prev => ({ ...prev, linkExpirationDays: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value={7}>7 days</option>
                <option value={30}>30 days</option>
                <option value={0}>Never expires</option>
              </select>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">💾 Data Management</h2>
          <p className="text-sm text-gray-500 mb-4">
            All data is stored locally in your browser. No server processing. Export regularly for backup.
          </p>
          <div className="flex flex-wrap gap-3">
            <button onClick={handleExportAll} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
              📦 Export All (JSON)
            </button>
            <button onClick={handleExportCSV} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
              📊 Export Clients (CSV)
            </button>
            <button
              onClick={handleClearAll}
              className={`px-4 py-2 rounded-lg text-sm ${
                showClearConfirm
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'border border-red-300 text-red-600 hover:bg-red-50'
              }`}
            >
              {showClearConfirm ? '⚠️ Confirm: Delete ALL Data' : '🗑️ Clear All Data'}
            </button>
          </div>
          {showClearConfirm && (
            <p className="text-sm text-red-500 mt-2">
              This will permanently delete all clients, forms, and settings. Click again to confirm.
            </p>
          )}
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            {saved ? '✅ Saved!' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}