import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  FileText,
  Users,
  Store,
  AlertTriangle,
  Lock,
  Globe2,
  Layers,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';

export const LandingPage: React.FC = () => {
  const [legalModalOpen, setLegalModalOpen] = useState<'privacy' | 'terms' | null>(null);

  const workflows = [
    { step: '01', title: 'Know', desc: 'Preloaded statutory compliance obligations for Bangladesh & international frameworks (Labour Act 2006, Cyber Security Act, ISO 27001).' },
    { step: '02', title: 'Assign', desc: 'Designate accountable internal owners with precise roles, deadlines, and recurrence schedules.' },
    { step: '03', title: 'Monitor', desc: 'Track overdue tasks, expiring vendor contracts, and missing evidence with automated notifications.' },
    { step: '04', title: 'Verify', desc: 'Attach tamper-evident supporting documents and conduct internal or auditor verification reviews.' },
    { step: '05', title: 'Improve', desc: 'Manage audit findings with rigorous Corrective & Preventive Action (CAPA) tracking.' },
  ];

  const features = [
    { icon: ShieldCheck, title: 'Centralized Compliance Register', desc: 'Maintain complete visibility over regulatory and internal mandates across operations, HR, security, and tax.' },
    { icon: FileText, title: 'Evidence & Document Locker', desc: 'Secure, access-controlled repository for licenses, audit reports, and statutory receipts.' },
    { icon: Users, title: 'HR Statutory Compliance', desc: 'Track Bangladesh Labour Act Sec 5 & 6 requirements, appointment records, service books, and safety briefings.' },
    { icon: Store, title: 'Vendor Registry & TPRM', desc: 'Manage third-party risk with categorized scoring, contract expiry alerts, and security review checklists.' },
    { icon: AlertTriangle, title: '5x5 Risk Scoring Matrix', desc: 'Visual Likelihood × Impact calculation to prioritize critical organizational vulnerabilities.' },
    { icon: Layers, title: 'Audit Findings & CAPA', desc: 'Convert inspection gaps into trackable corrective actions with authorized reviewer verification.' },
  ];

  return (
    <div className="min-h-screen bg-[#E5D3AF] text-stone-900 selection:bg-[#790D16] selection:text-white">
      {/* Top Banner & Header */}
      <nav className="h-20 px-6 md:px-12 max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#790D16] flex items-center justify-center text-white shadow-md shadow-[#790D16]/20">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-[#790D16] font-['Outfit']">
              TRIPRO <span className="text-stone-800 font-semibold text-sm">ECM</span>
            </span>
            <div className="text-[10px] text-stone-700 tracking-wider font-semibold uppercase">
              Compliance Operations SaaS
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link to="/login">
            <Button variant="ghost" size="sm" className="text-stone-800 hover:text-stone-950 font-semibold">
              Sign In
            </Button>
          </Link>
          <Link to="/signup">
            <Button variant="primary" size="sm" className="shadow-md">
              Start Free Trial <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-6 md:px-12 py-16 md:py-24 max-w-5xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF7F0] border border-[#A98E60]/40 text-xs font-semibold text-stone-800 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[#790D16] animate-pulse"></span>
          Tailored for Bangladesh, US & International Growing Businesses
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold text-stone-950 tracking-tight leading-[1.15] font-['Outfit']">
          Enterprise Compliance Management <br />
          <span className="text-[#790D16]">Without GRC Complexity</span>
        </h1>

        <p className="text-lg md:text-xl text-stone-700 max-w-2xl mx-auto leading-relaxed">
          A practical compliance operations platform that helps growing companies know obligations, assign owners, maintain evidence, and resolve audit gaps in one centralized workspace.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/signup" className="w-full sm:w-auto">
            <Button variant="primary" size="lg" className="w-full shadow-lg">
              Launch Workspace Now <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          </Link>
          <Link to="/login" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full bg-[#FAF7F0] border-[#A98E60]/50 hover:bg-white text-stone-800 font-semibold">
              Explore Interactive Demo
            </Button>
          </Link>
        </div>

        {/* Framework Badges */}
        <div className="pt-10 flex flex-wrap items-center justify-center gap-3 text-xs font-medium text-stone-700">
          <span className="px-3 py-1.5 rounded-lg bg-white/80 border border-stone-300">🇧🇩 Bangladesh Labour Act 2006</span>
          <span className="px-3 py-1.5 rounded-lg bg-white/80 border border-stone-300">🛡️ National Cyber Security Act</span>
          <span className="px-3 py-1.5 rounded-lg bg-white/80 border border-stone-300">🏢 BIDA & RJSC Corporate Filings</span>
          <span className="px-3 py-1.5 rounded-lg bg-white/80 border border-stone-300">🌐 ISO/IEC 27001:2022</span>
          <span className="px-3 py-1.5 rounded-lg bg-white/80 border border-stone-300">🔒 SOC 2 Type II</span>
        </div>
      </section>

      {/* Core Workflow Section */}
      <section className="px-6 md:px-12 py-16 bg-white border-y border-stone-200">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-xs font-bold text-[#790D16] uppercase tracking-widest">Operating Model</h2>
            <h3 className="text-3xl font-bold text-stone-900 mt-2 font-['Outfit']">The 5-Stage Compliance Engine</h3>
            <p className="text-sm text-stone-600 mt-2">
              Replace disorganized spreadsheets with a disciplined, continuous accountability loop.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {workflows.map((wf) => (
              <div
                key={wf.step}
                className="p-5 rounded-2xl bg-[#FAF7F0] border border-[#E5D3AF] relative hover:border-[#790D16] transition-all group"
              >
                <div className="text-2xl font-black text-[#790D16]/30 group-hover:text-[#790D16] transition-colors font-mono">
                  {wf.step}
                </div>
                <h4 className="text-base font-bold text-stone-900 mt-2">{wf.title}</h4>
                <p className="text-xs text-stone-600 mt-2 leading-relaxed">{wf.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="px-6 md:px-12 py-20 max-w-7xl mx-auto space-y-12">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-xs font-bold text-[#790D16] uppercase tracking-widest">Platform Capabilities</h2>
          <h3 className="text-3xl font-bold text-stone-900 mt-2 font-['Outfit']">Complete Operations Suite</h3>
          <p className="text-sm text-stone-700 mt-2">
            Engineered specifically for growing tech, SaaS, and professional service companies (10–49 employees).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl bg-white border border-stone-200/90 shadow-sm hover:shadow-md transition-all space-y-3"
            >
              <div className="w-10 h-10 rounded-xl bg-[#FDF2F3] text-[#790D16] flex items-center justify-center">
                <f.icon className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-stone-900">{f.title}</h4>
              <p className="text-xs text-stone-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section className="px-6 md:px-12 py-20 bg-[#FAF7F0] border-t border-stone-200">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-xs font-bold text-[#790D16] uppercase tracking-widest">Transparent Pricing</h2>
            <h3 className="text-3xl font-bold text-stone-900 mt-2 font-['Outfit']">Affordable for Growing Teams</h3>
            <p className="text-sm text-stone-600 mt-2">
              No six-figure enterprise contracts or lengthy implementation delays.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Starter */}
            <div className="p-8 rounded-2xl bg-white border border-stone-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold text-stone-500 uppercase">Starter</div>
                <div className="text-3xl font-extrabold text-stone-900 mt-2">$29 <span className="text-sm font-normal text-stone-500">/mo</span></div>
                <p className="text-xs text-stone-500 mt-2">For startups establishing foundational compliance.</p>
                <ul className="mt-6 space-y-2.5 text-xs text-stone-700">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Up to 15 employees</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Compliance Register & Tasks</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Secure Evidence Storage (5 GB)</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Due Date Alerts & In-app Center</li>
                </ul>
              </div>
              <Link to="/signup" className="mt-8">
                <Button variant="outline" size="sm" className="w-full">Get Started</Button>
              </Link>
            </div>

            {/* Growth (Highlighted) */}
            <div className="p-8 rounded-2xl bg-white border-2 border-[#790D16] shadow-lg flex flex-col justify-between relative">
              <div className="absolute -top-3 right-6 bg-[#790D16] text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
                Most Popular
              </div>
              <div>
                <div className="text-xs font-bold text-[#790D16] uppercase">Growth</div>
                <div className="text-3xl font-extrabold text-stone-900 mt-2">$79 <span className="text-sm font-normal text-stone-500">/mo</span></div>
                <p className="text-xs text-stone-500 mt-2">Complete suite for scaling B2B businesses (15–49 employees).</p>
                <ul className="mt-6 space-y-2.5 text-xs text-stone-700">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Unlimited team members</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Vendor TPRM & Risk Register</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> HR Statutory Checklist & Policies</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Audit Findings & CAPA Workflows</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Full Audit Logs & CSV Export</li>
                </ul>
              </div>
              <Link to="/signup" className="mt-8">
                <Button variant="primary" size="sm" className="w-full shadow-md">Start 14-Day Free Trial</Button>
              </Link>
            </div>

            {/* Enterprise */}
            <div className="p-8 rounded-2xl bg-white border border-stone-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold text-stone-500 uppercase">Enterprise</div>
                <div className="text-3xl font-extrabold text-stone-900 mt-2">$199 <span className="text-sm font-normal text-stone-500">/mo</span></div>
                <p className="text-xs text-stone-500 mt-2">For regulated institutions requiring dedicated audit support.</p>
                <ul className="mt-6 space-y-2.5 text-xs text-stone-700">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Dedicated external auditor read-only seats</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Custom regulatory framework mappings</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Automated BullMQ background workers</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Priority SLA & Onboarding Assistance</li>
                </ul>
              </div>
              <Link to="/signup" className="mt-8">
                <Button variant="outline" size="sm" className="w-full">Contact Sales</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 md:px-12 py-12 max-w-7xl mx-auto border-t border-stone-300 text-xs text-stone-600 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="font-bold text-stone-900 text-sm font-['Outfit']">TRIPRO ECM</div>
          <div>Enterprise Compliance Management SaaS for Growing Businesses.</div>
        </div>

        <div className="flex items-center gap-6">
          <button
            onClick={() => setLegalModalOpen('privacy')}
            className="hover:text-stone-950 underline transition-colors"
          >
            Privacy Policy Placeholder
          </button>
          <button
            onClick={() => setLegalModalOpen('terms')}
            className="hover:text-stone-950 underline transition-colors"
          >
            Terms of Service Placeholder
          </button>
          <Link to="/login" className="hover:text-stone-950 underline transition-colors">
            App Login
          </Link>
        </div>
      </footer>

      {/* Privacy Policy & Terms Modal */}
      <Modal
        isOpen={!!legalModalOpen}
        onClose={() => setLegalModalOpen(null)}
        title={legalModalOpen === 'privacy' ? 'Privacy Policy (Placeholder for Review)' : 'Terms of Service (Placeholder for Review)'}
        description="Notice: This document is a placeholder and must be formally verified by qualified legal counsel."
      >
        <div className="space-y-4 text-xs text-stone-700 leading-relaxed">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 font-medium">
            ⚠️ Regulatory Compliance Disclaimer: Preloaded templates and guidance reflect general operational standards and Bangladesh statutory references (such as the Bangladesh Labour Act 2006). They do not constitute formal legal advice.
          </div>
          <p>
            TriPro ECM collects only data strictly necessary for tenant organization compliance management. Tenant documents, employee records, and audit evidence are isolated through database-level authorization and access-controlled streaming endpoints.
          </p>
          <p>
            Data retention is configurable by organization administrators. All sensitive changes are logged in an append-only audit trail.
          </p>
          <div className="flex justify-end pt-4">
            <Button variant="secondary" size="sm" onClick={() => setLegalModalOpen(null)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
