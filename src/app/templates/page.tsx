'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { IntakeForm } from '@/lib/types';
import { getForms, saveForm, seedTemplatesIfNeeded } from '@/lib/storage';

const TEMPLATE_DESCRIPTIONS: Record<string, { icon: string; color: string; desc: string; features: string[] }> = {
  design: {
    icon: '🎨',
    color: 'from-purple-500 to-pink-500',
    desc: 'Collect brand assets, project goals, and visual preferences from design clients.',
    features: ['Brand guidelines upload', 'Logo file collection', 'Color palette capture', 'Design inspiration links', 'Budget & timeline fields'],
  },
  development: {
    icon: '💻',
    color: 'from-blue-500 to-cyan-500',
    desc: 'Gather technical requirements, access credentials, and project specs.',
    features: ['Tech stack selection', 'Codebase upload', 'Documentation collection', 'Hosting details', 'Budget & deadline'],
  },
  marketing: {
    icon: '📣',
    color: 'from-orange-500 to-red-500',
    desc: 'Collect campaign briefs, creative assets, and KPIs from marketing clients.',
    features: ['Campaign naming', 'Target audience', 'Channel selection', 'Creative asset upload', 'Start & end dates'],
  },
  consulting: {
    icon: '💼',
    color: 'from-green-500 to-emerald-500',
    desc: 'Collect scope, deliverables, and access requirements from consulting clients.',
    features: ['Scope of work', 'Meeting cadence', 'Deliverable templates', 'Access requirements', 'Success criteria'],
  },
};

export default function TemplatesPage() {
  const [forms, setForms] = useState<IntakeForm[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    seedTemplatesIfNeeded();
    setForms(getForms());
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-lg">Loading...</div>
      </div>
    );
  }

  const templates = forms.filter(f => f.isTemplate);

  function handleUseTemplate(template: IntakeForm) {
    const newForm: IntakeForm = {
      ...template,
      id: crypto.randomUUID(),
      name: `${template.name} (Custom)`,
      isTemplate: false,
      fields: template.fields.map(f => ({ ...f, id: crypto.randomUUID() })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveForm(newForm);
    // Navigate to forms page to continue editing
    window.location.href = '/forms';
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
              <span className="text-sm text-blue-600 font-medium">Templates</span>
              <Link href="/settings" className="text-sm text-gray-600 hover:text-gray-900">Settings</Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Template Library</h1>
          <p className="text-gray-500 mt-1">Pre-built intake form templates by industry. Use one as-is or customize it for your workflow.</p>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {templates.map(template => {
            const meta = TEMPLATE_DESCRIPTIONS[template.templateCategory || 'design'];
            return (
              <div key={template.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                {/* Header with gradient */}
                <div className={`bg-gradient-to-r ${meta.color} p-6 text-white`}>
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{meta.icon}</span>
                    <div>
                      <h2 className="text-xl font-bold">{template.name}</h2>
                      <p className="text-sm opacity-90">{template.fields.length} fields</p>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="p-6">
                  <p className="text-gray-600 mb-4">{meta.desc}</p>

                  {/* Features */}
                  <div className="space-y-2 mb-6">
                    {meta.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                        <span className="text-green-500">✓</span>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Fields Preview */}
                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-xs text-gray-400 mb-2">Form fields:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {template.fields.slice(0, 6).map(field => (
                        <span key={field.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {field.label}
                        </span>
                      ))}
                      {template.fields.length > 6 && (
                        <span className="text-xs bg-gray-100 text-gray-400 px-2 py-1 rounded">
                          +{template.fields.length - 6} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => handleUseTemplate(template)}
                      className={`flex-1 py-2.5 text-white rounded-lg font-medium bg-gradient-to-r ${meta.color} hover:opacity-90 transition-opacity`}
                    >
                      Use This Template
                    </button>
                    <Link
                      href="/forms"
                      className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm text-gray-700"
                    >
                      Customize
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Create Custom */}
        <div className="mt-8 bg-white rounded-2xl border-2 border-dashed border-gray-300 p-8 text-center">
          <div className="text-4xl mb-3">✏️</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Build Your Own Form</h3>
          <p className="text-gray-500 mb-4">Start from scratch and create a custom intake form tailored to your workflow.</p>
          <Link
            href="/forms"
            className="inline-block px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Create Custom Form
          </Link>
        </div>
      </div>
    </div>
  );
}