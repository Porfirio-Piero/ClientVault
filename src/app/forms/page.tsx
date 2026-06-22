'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { IntakeForm, FormField } from '@/lib/types';
import { getForms, saveForm, deleteForm, seedTemplatesIfNeeded } from '@/lib/storage';

const FIELD_TYPES: { value: FormField['type']; label: string; icon: string }[] = [
  { value: 'text', label: 'Text Input', icon: '📝' },
  { value: 'paragraph', label: 'Paragraph', icon: '📄' },
  { value: 'document', label: 'File Upload', icon: '📎' },
  { value: 'checkbox', label: 'Checkbox', icon: '☑️' },
  { value: 'dropdown', label: 'Dropdown', icon: '📋' },
  { value: 'date', label: 'Date', icon: '📅' },
  { value: 'number', label: 'Number', icon: '🔢' },
];

export default function FormsPage() {
  const [forms, setForms] = useState<IntakeForm[]>([]);
  const [mounted, setMounted] = useState(false);
  const [editingForm, setEditingForm] = useState<IntakeForm | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);

  useEffect(() => {
    setMounted(true);
    seedTemplatesIfNeeded();
    refreshForms();
  }, []);

  function refreshForms() {
    setForms(getForms());
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-lg">Loading...</div>
      </div>
    );
  }

  function handleCreateForm() {
    const newForm: IntakeForm = {
      id: crypto.randomUUID(),
      name: '',
      description: '',
      fields: [],
      isTemplate: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setEditingForm(newForm);
    setShowBuilder(true);
  }

  function handleEditForm(form: IntakeForm) {
    setEditingForm({ ...form });
    setShowBuilder(true);
  }

  function handleDuplicateForm(form: IntakeForm) {
    const dup: IntakeForm = {
      ...form,
      id: crypto.randomUUID(),
      name: `${form.name} (Copy)`,
      isTemplate: false,
      fields: form.fields.map(f => ({ ...f, id: crypto.randomUUID() })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveForm(dup);
    refreshForms();
  }

  function handleDeleteForm(id: string) {
    if (!confirm('Delete this form?')) return;
    deleteForm(id);
    refreshForms();
  }

  function handleSaveForm() {
    if (!editingForm) return;
    if (!editingForm.name.trim()) {
      alert('Please enter a form name');
      return;
    }
    saveForm({ ...editingForm, updatedAt: new Date().toISOString() });
    setShowBuilder(false);
    setEditingForm(null);
    refreshForms();
  }

  function addField(type: FormField['type']) {
    if (!editingForm) return;
    const newField: FormField = {
      id: crypto.randomUUID(),
      type,
      label: type.charAt(0).toUpperCase() + type.slice(1) + ' Field',
      required: false,
      order: editingForm.fields.length,
      ...(type === 'dropdown' ? { options: ['Option 1', 'Option 2'] } : {}),
    };
    setEditingForm({
      ...editingForm,
      fields: [...editingForm.fields, newField],
    });
  }

  function updateField(fieldId: string, updates: Partial<FormField>) {
    if (!editingForm) return;
    setEditingForm({
      ...editingForm,
      fields: editingForm.fields.map(f =>
        f.id === fieldId ? { ...f, ...updates } : f
      ),
    });
  }

  function removeField(fieldId: string) {
    if (!editingForm) return;
    setEditingForm({
      ...editingForm,
      fields: editingForm.fields.filter(f => f.id !== fieldId),
    });
  }

  function moveField(fieldId: string, direction: 'up' | 'down') {
    if (!editingForm) return;
    const fields = [...editingForm.fields];
    const idx = fields.findIndex(f => f.id === fieldId);
    if (direction === 'up' && idx > 0) {
      [fields[idx], fields[idx - 1]] = [fields[idx - 1], fields[idx]];
    } else if (direction === 'down' && idx < fields.length - 1) {
      [fields[idx], fields[idx + 1]] = [fields[idx + 1], fields[idx]];
    }
    setEditingForm({ ...editingForm, fields: fields.map((f, i) => ({ ...f, order: i })) });
  }

  const templates = forms.filter(f => f.isTemplate);
  const custom = forms.filter(f => !f.isTemplate);

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
              <span className="text-sm text-blue-600 font-medium">Forms</span>
              <Link href="/templates" className="text-sm text-gray-600 hover:text-gray-900">Templates</Link>
              <Link href="/settings" className="text-sm text-gray-600 hover:text-gray-900">Settings</Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!showBuilder ? (
          <>
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Form Builder</h1>
                <p className="text-gray-500 mt-1">Create and manage intake forms for your clients</p>
              </div>
              <button onClick={handleCreateForm} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                + New Form
              </button>
            </div>

            {/* Templates Section */}
            {templates.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">📋 Templates</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {templates.map(form => {
                    const categoryIcons: Record<string, string> = { design: '🎨', development: '💻', marketing: '📣', consulting: '💼' };
                    return (
                      <div key={form.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-2xl">{categoryIcons[form.templateCategory || 'custom'] || '📋'}</span>
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Template</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1">{form.name}</h3>
                        <p className="text-xs text-gray-500 mb-3">{form.fields.length} fields</p>
                        <div className="flex gap-2">
                          <button onClick={() => handleDuplicateForm(form)} className="flex-1 text-center px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100">
                            Use Template
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Custom Forms Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">✏️ Custom Forms</h2>
              {custom.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                  <div className="text-5xl mb-4">📝</div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No custom forms yet</h3>
                  <p className="text-gray-500 mb-4">Create a form or duplicate a template to get started</p>
                  <button onClick={handleCreateForm} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Create Form
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {custom.map(form => (
                    <div key={form.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{form.name}</h3>
                        <p className="text-sm text-gray-500">{form.fields.length} fields · Updated {new Date(form.updatedAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleEditForm(form)} className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Edit</button>
                        <button onClick={() => handleDuplicateForm(form)} className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Duplicate</button>
                        <button onClick={() => handleDeleteForm(form.id)} className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          /* Form Builder UI */
          <div>
            <div className="flex items-center gap-4 mb-6">
              <button onClick={() => { setShowBuilder(false); setEditingForm(null); }} className="text-sm text-gray-500 hover:text-gray-700">← Back to Forms</button>
              <h1 className="text-2xl font-bold text-gray-900">
                {editingForm?.fields.length === 0 ? 'Create New Form' : `Edit: ${editingForm?.name || 'Untitled'}`}
              </h1>
            </div>

            {/* Form Settings */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Form Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Form Name *</label>
                  <input
                    type="text"
                    value={editingForm?.name || ''}
                    onChange={e => editingForm && setEditingForm({ ...editingForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Client Onboarding Form"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={editingForm?.description || ''}
                    onChange={e => editingForm && setEditingForm({ ...editingForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Brief description of this form"
                  />
                </div>
              </div>
            </div>

            {/* Add Fields */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Fields</h2>
              <div className="flex flex-wrap gap-2">
                {FIELD_TYPES.map(ft => (
                  <button
                    key={ft.value}
                    onClick={() => addField(ft.value)}
                    className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm flex items-center gap-1.5"
                  >
                    <span>{ft.icon}</span>
                    <span>{ft.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Field List */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Form Fields ({editingForm?.fields.length || 0})</h2>
              {editingForm && editingForm.fields.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  Click a field type above to add it to your form
                </div>
              ) : (
                <div className="space-y-4">
                  {editingForm?.fields.map((field, idx) => (
                    <div key={field.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{FIELD_TYPES.find(t => t.value === field.type)?.icon}</span>
                          <span className="font-medium text-gray-900">{field.type.charAt(0).toUpperCase() + field.type.slice(1)} Field</span>
                          <span className="text-xs text-gray-400">#{idx + 1}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => moveField(field.id, 'up')} disabled={idx === 0} className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30">↑</button>
                          <button onClick={() => moveField(field.id, 'down')} disabled={idx === editingForm.fields.length - 1} className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30">↓</button>
                          <button onClick={() => removeField(field.id)} className="p-1 text-red-400 hover:text-red-600 ml-2">✕</button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Label</label>
                          <input
                            type="text"
                            value={field.label}
                            onChange={e => updateField(field.id, { label: e.target.value })}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Help Text</label>
                          <input
                            type="text"
                            value={field.helpText || ''}
                            onChange={e => updateField(field.id, { helpText: e.target.value })}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-3">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={e => updateField(field.id, { required: e.target.checked })}
                            className="rounded border-gray-300"
                          />
                          <span>Required</span>
                        </label>
                        {field.type === 'dropdown' && (
                          <div className="flex-1">
                            <label className="block text-xs text-gray-600 mb-1">Options (comma-separated)</label>
                            <input
                              type="text"
                              value={field.options?.join(', ') || ''}
                              onChange={e => updateField(field.id, {
                                options: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
                              })}
                              className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Save Button */}
            <div className="flex gap-3">
              <button onClick={() => { setShowBuilder(false); setEditingForm(null); }} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleSaveForm} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Save Form
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}