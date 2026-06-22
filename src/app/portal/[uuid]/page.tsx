'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ClientPortalData, FormField, DocumentAttachment, BrandSettings } from '@/lib/types';
import { getPortalByUuid, getClient, getForm, getBrandSettings, savePortal, addActivity } from '@/lib/storage';
import { DEFAULT_BRAND } from '@/lib/types';

export default function ClientPortalPage() {
  const params = useParams();
  const uuid = params.uuid as string;

  const [portal, setPortal] = useState<ClientPortalData | null>(null);
  const [client, setClient] = useState<{ name: string; email: string } | null>(null);
  const [form, setForm] = useState<{ name: string; fields: FormField[] } | null>(null);
  const [brand, setBrand] = useState<BrandSettings>(DEFAULT_BRAND);
  const [formValues, setFormValues] = useState<Record<string, string | string[] | boolean>>({});
  const [documents, setDocuments] = useState<DocumentAttachment[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (uuid) loadPortalData();
  }, [uuid]);

  function loadPortalData() {
    const p = getPortalByUuid(uuid);
    if (!p) {
      setError('This link is invalid or has been revoked.');
      return;
    }

    // Check expiration
    const c = getClient(p.clientId);
    if (c) {
      setClient({ name: c.name, email: c.email });
      // Get brand from the freelancer's settings
      setBrand(getBrandSettings());
    }

    if (p.formSubmitted) {
      setSubmitted(true);
      setFormValues(p.formValues || {});
      setDocuments(p.receivedDocuments);
    }

    const f = getForm(p.formId);
    if (f) {
      setForm({ name: f.name, fields: f.fields });
      // Initialize form values
      const initValues: Record<string, string | string[] | boolean> = {};
      f.fields.forEach(field => {
        initValues[field.id] = field.type === 'checkbox' ? false : '';
      });
      setFormValues(p.formValues || initValues);
    } else {
      setError('The form associated with this link was not found.');
      return;
    }

    setPortal(p);

    // Update last accessed
    const updatedPortal = { ...p, lastAccessedAt: new Date().toISOString() };
    savePortal(updatedPortal);
  }

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400 text-lg">Loading portal...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Link Not Available</h1>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen" style={{ background: `linear-gradient(135deg, ${brand.primaryColor}15, ${brand.secondaryColor}15)` }}>
        {/* Branded Header */}
        <div className="portal-header text-white p-8 text-center" style={{ background: `linear-gradient(135deg, ${brand.primaryColor}, ${brand.secondaryColor})` }}>
          <h1 className="text-3xl font-bold">{brand.businessName}</h1>
          {brand.logo && <img src={brand.logo} alt="Logo" className="w-16 h-16 mx-auto mt-3 rounded-full" />}
        </div>

        <div className="max-w-lg mx-auto p-6">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Thank You!</h2>
            <p className="text-gray-600 mb-6">
              Your information and documents have been submitted successfully. {client?.name || 'The team'} will review everything and get back to you.
            </p>

            {/* Show submitted documents */}
            {documents.length > 0 && (
              <div className="text-left mb-6">
                <h3 className="font-semibold text-gray-700 mb-2">Submitted Documents ({documents.length})</h3>
                {documents.map(doc => (
                  <div key={doc.id} className="flex items-center gap-2 py-1 text-sm text-gray-600">
                    <span>📎</span>
                    <span>{doc.name}</span>
                    <span className="text-gray-400">({(doc.size / 1024).toFixed(1)} KB)</span>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-gray-400">This portal link has been marked as submitted. No further changes are needed.</p>
          </div>
        </div>
      </div>
    );
  }

  function handleFileUpload(fieldId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const attachment: DocumentAttachment = {
          id: crypto.randomUUID(),
          name: file.name,
          type: file.type,
          size: file.size,
          data: reader.result as string,
          uploadedAt: new Date().toISOString(),
        };
        setDocuments(prev => [...prev, attachment]);
        setFormValues(prev => ({
          ...prev,
          [fieldId]: [...(Array.isArray(prev[fieldId]) ? prev[fieldId] as string[] : []), attachment.id],
        }));
      };
      reader.readAsDataURL(file);
    });
  }

  function handleSubmit() {
    if (!portal || !form) return;

    // Validate required fields
    const missing = form.fields
      .filter(f => f.required)
      .filter(f => {
        const val = formValues[f.id];
        if (f.type === 'checkbox') return !val;
        if (f.type === 'document') return documents.length === 0;
        return !val || (typeof val === 'string' && !val.trim());
      });

    if (missing.length > 0) {
      alert(`Please fill in required fields: ${missing.map(f => f.label).join(', ')}`);
      return;
    }

    const updatedPortal: ClientPortalData = {
      ...portal,
      formSubmitted: true,
      submittedAt: new Date().toISOString(),
      formValues,
      receivedDocuments: documents,
    };

    savePortal(updatedPortal);
    if (client) {
      addActivity(portal.clientId, 'form_submitted', `Form submitted by ${client.name}`);
    }
    setSubmitted(true);
  }

  // Calculate completion progress
  const totalFields = form?.fields.length || 0;
  const filledFields = form?.fields.filter(f => {
    const val = formValues[f.id];
    if (f.type === 'checkbox') return val !== undefined;
    if (f.type === 'document') return documents.length > 0;
    return val && (typeof val === 'string' ? val.trim() : true);
  }).length || 0;
  const progress = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;

  return (
    <div className="min-h-screen" style={{ background: `linear-gradient(135deg, ${brand.primaryColor}10, ${brand.secondaryColor}10)` }}>
      {/* Branded Header */}
      <div className="portal-header text-white p-8 text-center" style={{ background: `linear-gradient(135deg, ${brand.primaryColor}, ${brand.secondaryColor})` }}>
        <h1 className="text-3xl font-bold">{brand.businessName}</h1>
        <p className="mt-2 opacity-90">Client Onboarding Portal</p>
        {brand.logo && <img src={brand.logo} alt="Logo" className="w-16 h-16 mx-auto mt-3 rounded-full" />}
      </div>

      <div className="max-w-2xl mx-auto p-6">
        {/* Progress Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm text-gray-500">{filledFields} of {totalFields} items</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(to right, ${brand.primaryColor}, ${brand.secondaryColor})`,
              }}
            />
          </div>
        </div>

        {/* Welcome */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Welcome! 👋</h2>
          <p className="text-gray-600">
            Please fill out the form below and upload any required documents. {client ? `${client.name} ` : ''}will review your submission.
          </p>
        </div>

        {/* Form Fields */}
        {form && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">{form.name}</h3>

            {form.fields.sort((a, b) => a.order - b.order).map(field => (
              <div key={field.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {field.helpText && (
                  <p className="text-xs text-gray-500 mb-2">{field.helpText}</p>
                )}

                {field.type === 'text' && (
                  <input
                    type="text"
                    value={typeof formValues[field.id] === 'string' ? formValues[field.id] as string : ''}
                    onChange={e => setFormValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                  />
                )}

                {field.type === 'paragraph' && (
                  <textarea
                    value={typeof formValues[field.id] === 'string' ? formValues[field.id] as string : ''}
                    onChange={e => setFormValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                  />
                )}

                {field.type === 'number' && (
                  <input
                    type="number"
                    value={typeof formValues[field.id] === 'string' ? formValues[field.id] as string : ''}
                    onChange={e => setFormValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                  />
                )}

                {field.type === 'date' && (
                  <input
                    type="date"
                    value={typeof formValues[field.id] === 'string' ? formValues[field.id] as string : ''}
                    onChange={e => setFormValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                )}

                {field.type === 'dropdown' && (
                  <select
                    value={typeof formValues[field.id] === 'string' ? formValues[field.id] as string : ''}
                    onChange={e => setFormValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select...</option>
                    {field.options?.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                )}

                {field.type === 'checkbox' && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formValues[field.id] === true}
                      onChange={e => setFormValues(prev => ({ ...prev, [field.id]: e.target.checked }))}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Yes</span>
                  </label>
                )}

                {field.type === 'document' && (
                  <div>
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                      <div className="text-center">
                        <span className="text-3xl">📤</span>
                        <p className="text-sm text-gray-500 mt-1">Click to upload or drag and drop</p>
                        <p className="text-xs text-gray-400">Any file type, max 10MB</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        multiple
                        onChange={e => handleFileUpload(field.id, e)}
                      />
                    </label>
                    {/* Show uploaded files for this field */}
                    {documents.filter(d => {
                      const fieldDocs = formValues[field.id];
                      return Array.isArray(fieldDocs) ? fieldDocs.includes(d.id) : false;
                    }).map(doc => (
                      <div key={doc.id} className="flex items-center gap-2 mt-2 p-2 bg-green-50 rounded-lg">
                        <span>✅</span>
                        <span className="text-sm text-gray-700">{doc.name}</span>
                        <button
                          onClick={() => {
                            setDocuments(prev => prev.filter(d => d.id !== doc.id));
                            setFormValues(prev => ({
                              ...prev,
                              [field.id]: (Array.isArray(prev[field.id]) ? prev[field.id] as string[] : []).filter(id => id !== doc.id),
                            }));
                          }}
                          className="text-red-400 hover:text-red-600 text-sm ml-auto"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Submit Button */}
        <div className="mt-6 mb-8">
          <button
            onClick={handleSubmit}
            className="w-full py-4 text-white text-lg font-semibold rounded-xl shadow-lg hover:opacity-90 transition-opacity"
            style={{ background: `linear-gradient(to right, ${brand.primaryColor}, ${brand.secondaryColor})` }}
          >
            Submit Information 📨
          </button>
          <p className="text-center text-xs text-gray-400 mt-3">
            Your data is stored locally in the browser. No server processing.
          </p>
        </div>
      </div>
    </div>
  );
}