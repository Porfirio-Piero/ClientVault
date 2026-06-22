# ClientVault — Product Requirements Document

**Project:** ClientVault — Freelancer Onboarding & Document Hub  
**Problem ID:** PROB-066  
**Score:** 11.5/10 (Tier 1)  
**Date:** 2026-06-21  
**Build Time Estimate:** 5 hours  
**Status:** Pre-validation

---

## 1. Problem Statement

78% of companies still track freelancers in Excel or Google Sheets (Wripple 2025 Team Up Survey). Every freelancer wastes 2-3 hours per new client chasing documents, contracts, and project briefs through email. There is no affordable, freelancer-first onboarding portal under $50/mo.

**Current alternatives:**
- Content Snare ($49/mo) — focused on real estate and content ops, not freelancer onboarding
- Dubsado ($40/mo) — CRM-first, not document-first
- GatherContent ($63/mo) — content operations, not freelancer onboarding
- Google Drive + email ($0) — chaos, no automation, no status tracking

**Gap:** No tool exists that is freelancer-first, document-portal focused, and under $30/mo.

---

## 2. Target Users

**Primary:** Freelancers (designers, developers, writers, marketers) who waste hours per client chasing documents during kickoff. They need a branded portal they can send to clients for document upload and intake forms.

**Secondary:** Small agencies (2-10 people) who onboard 5-20 freelancers per month and need a centralized document collection hub instead of email chaos.

**User persona:** Alex, freelance designer, $75/hr. Every new client = 3-4 emails over 5 days to collect brand assets, project brief, and signed contract. With ClientVault: sends one link, client uploads everything, Alex gets notified when complete.

---

## 3. Core Features (3 Maximum)

### Feature 1: Branded Client Portal + Share Links
- Custom-branded page with freelancer's logo and brand colors
- Client-facing page where clients upload documents and fill intake forms
- Guest mode access only — UUID link-based sharing, zero sign-in
- Mobile-responsive design

### Feature 2: Smart Intake Form Builder + Templates
- Drag-and-drop form fields: text, document attachment, checkbox, dropdown
- Pre-built templates: Design Brief, Development Project, Marketing Campaign, Consulting Engagement
- Save form configurations for reuse across clients
- Required vs. optional field marking

### Feature 3: Status Dashboard
- All clients/jobs at a glance with traffic-light status (green = complete, yellow = pending, red = overdue)
- Quick view of what's missing per client
- Sort by status, date, client name

---

## 4. Architecture (Overnight-Compatible)

**Stack:** Next.js 16 + TypeScript + Tailwind CSS v4  
**Storage:** Browser localStorage + IndexedDB (client-side only, zero backend, zero server)  
**Sharing:** UUID-based links encoded in URL (guest mode access, zero sign-in)  
**Document handling:** Client-side file attachment via IndexedDB with export capability  
**Export:** PDF and CSV export via client-side libraries (PapaParse, html2pdf)

### Key Architecture Decisions
1. Zero backend — all data stored in browser localStorage/IndexedDB only
2. Guest mode only — UUID links for client access, zero sign-in system
3. Zero external services — everything runs client-side in the browser
4. Zero live sync — status updates via local state only
5. Solo-user focus — one freelancer, multiple clients (not team-based)

### Pages (6 screens)
1. **Dashboard** — overview of all clients, status indicators, quick actions
2. **Client Detail** — individual client page with documents, forms, status
3. **Form Builder** — drag-and-drop intake form creator with templates
4. **Client Portal (Public)** — branded page clients see when they open the share link
5. **Settings** — brand colors, logo, default form, link expiration
6. **Templates Library** — pre-built intake form templates by industry

---

## 5. Feature Details

### Dashboard
- Grid/card view of all active clients
- Status badges: ✅ Complete, ⏳ Pending, 🔴 Overdue (based on 7-day deadline)
- Quick stats: total clients, completion rate, average days to complete
- Search and filter by name, status, date
- Action buttons: New Client, Share Link, View Details

### Client Detail Page
- Client name, email, project type
- Document checklist with attachment status per item
- Intake form submission status
- Timeline of activity (document added, form submitted)
- Share link management (generate, copy, revoke, set expiration)

### Form Builder
- Left sidebar: field types (Text, Paragraph, Document Attachment, Checkbox, Dropdown, Date, Number)
- Center: form preview with drag-to-reorder
- Right sidebar: field settings (required/optional, label, help text, choices for dropdown)
- Templates: one-click load pre-built forms
- Save/load custom forms to localStorage

### Client Portal (Public View)
- Freelancer's branded header (logo + colors)
- Intake form sections
- Document attachment areas with drag-and-drop
- Progress indicator (X of Y items complete)
- Submit button with confirmation
- Guest mode — just the UUID link, zero signup

### Settings
- Brand customization: logo attachment, primary color, secondary color, business name
- Default form selection
- Link expiration: 7 days, 30 days, or never
- Export preferences (PDF, CSV)
- Data management: export all, clear all

### Templates Library
- Design Brief: project goals, brand guidelines, document attachments (logo, fonts, colors), timeline, budget
- Development Project: tech stack, existing codebase access, documentation links, hosting details, timeline
- Marketing Campaign: target audience, channels, brand voice, creative assets, KPIs
- Consulting Engagement: scope of work, meeting cadence, deliverables, access requirements

---

## 6. Out of Scope (Not Building)

- Team accounts or collaboration features
- Live sync or instant notifications
- Payment processing or invoicing
- CRM features (pipelines, deal tracking)
- Email sending (reminders are aspirational, not core)
- Mobile app (responsive web only)
- Cloud storage or server-side persistence
- Sign-in system or user accounts
- Third-party connections (Stripe, Slack, etc.)
- Custom domains or white-labeling

---

## 7. Monetization

- **Free tier:** 3 active clients, 1 custom form, basic templates
- **Pro tier ($15/mo):** Unlimited clients, unlimited forms, all templates, export to PDF/CSV
- **Premium tier ($29/mo):** Everything in Pro + priority support, advanced analytics, custom branding

**Positioning:** 95% cheaper than Content Snare, 100x better than email+Drive chaos.

---

## 8. Competitor Analysis

| Feature | ClientVault | Content Snare | Dubsado | GatherContent | Google Drive |
|---------|------------|---------------|---------|---------------|-------------|
| Price | $15-29/mo | $49/mo | $40/mo | $63/mo | Free |
| Freelancer-first | ✅ | ❌ (real estate) | ❌ (CRM) | ❌ (content ops) | ❌ |
| Guest link access | ✅ | ❌ | ❌ | ❌ | ❌ |
| Intake form builder | ✅ | ✅ | ✅ | ❌ | ❌ |
| Branded portal | ✅ | ✅ | ✅ | ✅ | ❌ |
| Status tracking | ✅ | ✅ | ✅ | ✅ | ❌ |
| Template library | ✅ | ❌ | ❌ | ✅ | ❌ |
| Offline capable | ✅ | ❌ | ❌ | ❌ | ❌ |
| Setup time | 2 min | 15 min | 30 min | 20 min | varies |

---

## 9. Success Metrics

- Working app with all 3 core features in ≤5 hours
- Client portal loads and accepts document attachments via UUID link
- Form builder creates and saves custom forms
- Dashboard shows client status with traffic-light indicators
- All data persists in browser storage across sessions
- Export to PDF/CSV works correctly

---

## 10. Technical Notes

- Use `crypto.randomUUID()` for UUID generation (link sharing)
- IndexedDB for document storage (documents, logos)
- localStorage for form configurations, client data, settings
- `next/dynamic` with `ssr: false` for client-only components
- PapaParse for CSV export, html2pdf.js for PDF generation
- All pages must be responsive and work on mobile
- Zero server-side code needed — entirely browser-based app