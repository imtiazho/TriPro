import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { ComplianceObligation, ObligationStatus } from '../../types';
import {
  ShieldCheck,
  Plus,
  Search,
  Filter,
  Download,
  Calendar,
  User as UserIcon,
  Clock,
  FileText,
  AlertCircle,
  CheckCircle2,
  X,
  History,
} from 'lucide-react';
import { Card, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Drawer } from '../../components/common/Drawer';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';

export const CompliancePage: React.FC = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [page, setPage] = useState(1);

  // Modals & Drawers
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedObligation, setSelectedObligation] = useState<ComplianceObligation | null>(null);

  // Form State for Adding Obligation
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    framework: 'Bangladesh Labour Act 2006',
    category: 'Labor & Employment',
    priority: 'medium',
    status: 'not_started',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    recurrence: 'none',
  });

  // Query Obligations
  const { data: responseData, isLoading } = useQuery({
    queryKey: ['obligations', { search, selectedStatus, selectedCategory, selectedPriority, page }],
    queryFn: () =>
      api.compliance.list({
        search: search || undefined,
        status: selectedStatus || undefined,
        category: selectedCategory || undefined,
        priority: selectedPriority || undefined,
        page,
        limit: 15,
      }),
  });

  const obligations: ComplianceObligation[] = responseData?.data || [];
  const pagination = responseData?.pagination;

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => api.compliance.create(data),
    onSuccess: () => {
      toast.success('Obligation Registered', 'New compliance requirement saved to the register.');
      setIsAddModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['obligations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
    onError: (err: any) => {
      toast.error('Failed to Create', err.response?.data?.error?.message || 'Error saving obligation.');
    },
  });

  // Status Change Mutation
  const statusMutation = useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: string; note: string }) =>
      api.compliance.update(id, { status, statusNote: note }),
    onSuccess: (updated) => {
      toast.success('Status Updated', `Obligation moved to ${updated.status}.`);
      setSelectedObligation(updated);
      queryClient.invalidateQueries({ queryKey: ['obligations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 font-['Outfit'] flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-[#790D16]" /> Compliance Register
          </h1>
          <p className="text-xs text-stone-600 mt-1">
            Central repository of statutory, regulatory, and internal governance obligations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={api.reports.exportCSV()}
            download
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white border border-stone-300 text-stone-700 hover:bg-stone-50 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-stone-500" /> Export CSV
          </a>
          <Button variant="primary" size="sm" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> Add Obligation
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search obligations by title, framework, or law..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-[#790D16] bg-stone-50/50"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="text-xs border border-stone-200 rounded-lg px-2.5 py-2 bg-white text-stone-700 outline-none focus:ring-1 focus:ring-[#790D16]"
            >
              <option value="">All Statuses</option>
              <option value="compliant">Compliant</option>
              <option value="in_progress">In Progress</option>
              <option value="pending_review">Pending Review</option>
              <option value="needs_attention">Needs Attention</option>
              <option value="non_compliant">Non-Compliant</option>
              <option value="not_started">Not Started</option>
            </select>

            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="text-xs border border-stone-200 rounded-lg px-2.5 py-2 bg-white text-stone-700 outline-none focus:ring-1 focus:ring-[#790D16]"
            >
              <option value="">All Categories</option>
              <option value="Labor & Employment">Labor & Employment</option>
              <option value="Data Protection & Cybersecurity">Data Protection & Cybersecurity</option>
              <option value="Corporate & Tax">Corporate & Tax</option>
              <option value="Environmental & Safety">Environmental & Safety</option>
              <option value="Industry Specific">Industry Specific</option>
            </select>

            <select
              value={selectedPriority}
              onChange={(e) => {
                setSelectedPriority(e.target.value);
                setPage(1);
              }}
              className="text-xs border border-stone-200 rounded-lg px-2.5 py-2 bg-white text-stone-700 outline-none focus:ring-1 focus:ring-[#790D16]"
            >
              <option value="">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Obligations Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <LoadingSkeleton rows={6} />
            </div>
          ) : obligations.length === 0 ? (
            <EmptyState
              title="No compliance obligations found"
              description="Adjust your search filters or register a new compliance mandate."
              actionLabel="Add Obligation"
              onAction={() => setIsAddModalOpen(true)}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F0] border-b border-stone-200 text-stone-600 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-5">Obligation Details</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4">Evidence</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium">
                  {obligations.map((item) => (
                    <tr
                      key={item._id}
                      onClick={() => setSelectedObligation(item)}
                      className="hover:bg-stone-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-5 max-w-sm">
                        <div className="font-semibold text-stone-900 group-hover:text-[#790D16] transition-colors leading-tight">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-stone-500 mt-0.5 truncate">
                          {item.framework}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-stone-700">{item.category}</td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            item.priority === 'critical'
                              ? 'rose'
                              : item.priority === 'high'
                              ? 'amber'
                              : item.priority === 'medium'
                              ? 'slate'
                              : 'sand'
                          }
                          size="sm"
                        >
                          {item.priority}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="py-3.5 px-4 text-stone-700 font-mono text-[11px]">
                        {new Date(item.dueDate).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4">
                        {item.evidenceIds && item.evidenceIds.length > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                            <FileText className="w-3.5 h-3.5" /> {item.evidenceIds.length} file(s)
                          </span>
                        ) : (
                          <span className="text-[11px] text-amber-700 font-medium flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" /> Missing
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedObligation(item);
                          }}
                          className="text-[#790D16] hover:underline font-semibold text-[11px]"
                        >
                          Details →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Drawer: Detailed Obligation View & Lifecycle Transition */}
      <Drawer
        isOpen={!!selectedObligation}
        onClose={() => setSelectedObligation(null)}
        title={selectedObligation?.title || 'Obligation Details'}
        description={`Framework: ${selectedObligation?.framework}`}
        width="xl"
      >
        {selectedObligation && (
          <div className="space-y-6 text-xs">
            {/* Status Change Controls */}
            <div className="p-4 rounded-xl bg-[#FAF7F0] border border-[#E5D3AF] space-y-3">
              <div className="font-bold text-stone-900 text-sm">Update Obligation Status</div>
              <p className="text-[11px] text-stone-600">
                Transitions update the audit trail and require verification notes.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {(['compliant', 'in_progress', 'pending_review', 'needs_attention', 'non_compliant'] as ObligationStatus[]).map(
                  (s) => (
                    <button
                      key={s}
                      onClick={() =>
                        statusMutation.mutate({
                          id: selectedObligation._id,
                          status: s,
                          note: `Status transition initiated via drawer to ${s}`,
                        })
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        selectedObligation.status === s
                          ? 'bg-[#790D16] text-white border-[#790D16]'
                          : 'bg-white border-stone-200 text-stone-700 hover:border-stone-400'
                      }`}
                    >
                      {s.replace('_', ' ').toUpperCase()}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <div className="font-bold text-stone-900 text-xs uppercase tracking-wider">Requirement Description</div>
              <p className="p-3 bg-stone-50 rounded-lg border border-stone-200 text-stone-700 leading-relaxed">
                {selectedObligation.description}
              </p>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-3 p-4 bg-stone-50 rounded-xl border border-stone-200 text-stone-700">
              <div>
                <span className="text-stone-500 block text-[10px] uppercase font-bold">Category</span>
                <span className="font-semibold">{selectedObligation.category}</span>
              </div>
              <div>
                <span className="text-stone-500 block text-[10px] uppercase font-bold">Priority</span>
                <span className="font-semibold uppercase">{selectedObligation.priority}</span>
              </div>
              <div>
                <span className="text-stone-500 block text-[10px] uppercase font-bold">Due Date</span>
                <span className="font-semibold font-mono">{new Date(selectedObligation.dueDate).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-stone-500 block text-[10px] uppercase font-bold">Recurrence</span>
                <span className="font-semibold capitalize">{selectedObligation.recurrence}</span>
              </div>
            </div>

            {/* Attached Evidence */}
            <div className="space-y-2">
              <div className="font-bold text-stone-900 text-xs uppercase tracking-wider flex items-center justify-between">
                <span>Attached Evidence Documents</span>
                <span className="text-[11px] text-stone-500 font-normal">
                  {selectedObligation.evidenceIds?.length || 0} file(s)
                </span>
              </div>
              {selectedObligation.evidenceIds && selectedObligation.evidenceIds.length > 0 ? (
                <div className="space-y-2">
                  {selectedObligation.evidenceIds.map((doc: any) => (
                    <div
                      key={doc._id}
                      className="p-3 bg-white rounded-lg border border-stone-200 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-4 h-4 text-[#790D16]" />
                        <span className="font-medium text-stone-800 truncate">{doc.fileName || doc.originalName}</span>
                      </div>
                      <a
                        href={api.evidence.download(doc._id)}
                        className="text-[#790D16] hover:underline font-semibold flex-shrink-0 ml-2"
                      >
                        Download
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-amber-50/60 border border-amber-200 text-amber-800 text-xs">
                  No supporting documents attached yet. Please upload verifying evidence in the Evidence Locker.
                </div>
              )}
            </div>

            {/* Lifecycle History */}
            <div className="space-y-2">
              <div className="font-bold text-stone-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-stone-500" /> Audit Lifecycle History
              </div>
              <div className="divide-y divide-stone-100 max-h-48 overflow-y-auto bg-stone-50 rounded-xl p-3 border border-stone-200">
                {selectedObligation.history && selectedObligation.history.length > 0 ? (
                  selectedObligation.history.map((h, i) => (
                    <div key={i} className="py-2 text-[11px] flex justify-between items-start">
                      <div>
                        <span className="font-semibold text-stone-900 uppercase">{h.newStatus}</span>
                        {h.note && <div className="text-stone-500 italic mt-0.5">{h.note}</div>}
                      </div>
                      <span className="text-stone-400 font-mono text-[10px]">
                        {new Date(h.changedAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-stone-400 py-2 text-center">No history logs recorded.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Modal: Add New Obligation */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Compliance Obligation"
        description="Register a new legal, standard, or internal compliance requirement."
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-stone-700 mb-1">Obligation Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Annual Hazardous Workplace Safety & Chemical Inspection"
              className="w-full px-3 py-2 border border-stone-300 rounded-lg outline-none focus:ring-2 focus:ring-[#790D16]"
            />
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Requirement Description</label>
            <textarea
              required
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detail specific regulatory section, proof requirements, and operational steps..."
              className="w-full px-3 py-2 border border-stone-300 rounded-lg outline-none focus:ring-2 focus:ring-[#790D16]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Framework / Standard</label>
              <select
                value={formData.framework}
                onChange={(e) => setFormData({ ...formData, framework: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg outline-none bg-white"
              >
                <option value="Bangladesh Labour Act 2006">Bangladesh Labour Act 2006</option>
                <option value="National Cyber Security Act (Bangladesh)">National Cyber Security Act (Bangladesh)</option>
                <option value="BIDA & RJSC Corporate Filings">BIDA & RJSC Corporate Filings</option>
                <option value="ISO/IEC 27001:2022">ISO/IEC 27001:2022</option>
                <option value="SOC 2 Type II">SOC 2 Type II</option>
                <option value="Internal Governance Policy">Internal Governance Policy</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg outline-none bg-white"
              >
                <option value="Labor & Employment">Labor & Employment</option>
                <option value="Data Protection & Cybersecurity">Data Protection & Cybersecurity</option>
                <option value="Corporate & Tax">Corporate & Tax</option>
                <option value="Environmental & Safety">Environmental & Safety</option>
                <option value="Vendor Management">Vendor Management</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg outline-none bg-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Initial Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg outline-none bg-white"
              >
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="compliant">Compliant</option>
                <option value="needs_attention">Needs Attention</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Recurrence</label>
              <select
                value={formData.recurrence}
                onChange={(e) => setFormData({ ...formData, recurrence: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg outline-none bg-white"
              >
                <option value="none">None</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annual">Annual</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Due Date</label>
            <input
              type="date"
              required
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg outline-none bg-white font-mono"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-stone-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={createMutation.isPending}>
              Save Obligation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
