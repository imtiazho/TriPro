import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Vendor } from '../../types';
import {
  Store,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  FileCheck,
  Shield,
  Clock,
} from 'lucide-react';
import { Card, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';

export const VendorsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [selectedRisk, setSelectedRisk] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  // Add Vendor Form
  const [newVendor, setNewVendor] = useState({
    name: '',
    category: 'SaaS Software',
    contactPerson: '',
    email: '',
    phone: '',
    riskLevel: 'medium',
    riskScore: 50,
    contractStartDate: new Date().toISOString().split('T')[0],
    contractExpiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  // Query Vendors
  const { data: responseData, isLoading } = useQuery({
    queryKey: ['vendors', { search, selectedRisk }],
    queryFn: () =>
      api.vendors.list({
        search: search || undefined,
        riskLevel: selectedRisk || undefined,
      }),
  });

  const vendors: Vendor[] = responseData?.data || [];

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => api.vendors.create(data),
    onSuccess: () => {
      toast.success('Vendor Registered', 'Third-party vendor added to TPRM registry.');
      setIsAddModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
  });

  // Update Review Decision Mutation
  const decisionMutation = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: string }) =>
      api.vendors.update(id, { lastReviewDecision: decision }),
    onSuccess: (updated) => {
      toast.success('Review Recorded', `Vendor assessment status: ${updated.lastReviewDecision}.`);
      setSelectedVendor(updated);
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 font-['Outfit'] flex items-center gap-2.5">
            <Store className="w-6 h-6 text-[#790D16]" /> Vendor Registry & TPRM
          </h1>
          <p className="text-xs text-stone-600 mt-1">
            Third-party risk management, security review checklists, and contract expiry tracking.
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> Add Vendor
        </Button>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search vendors by name, contact, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-[#790D16] bg-stone-50/50"
            />
          </div>

          <select
            value={selectedRisk}
            onChange={(e) => setSelectedRisk(e.target.value)}
            className="text-xs border border-stone-200 rounded-lg px-3 py-2 bg-white text-stone-700 outline-none"
          >
            <option value="">All Risk Tiers</option>
            <option value="critical">Critical Risk</option>
            <option value="high">High Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="low">Low Risk</option>
          </select>
        </CardContent>
      </Card>

      {/* Vendors Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <LoadingSkeleton rows={5} />
            </div>
          ) : vendors.length === 0 ? (
            <EmptyState
              title="No vendors found"
              description="Register cloud providers, SaaS tools, and external service contractors."
              actionLabel="Add Vendor"
              onAction={() => setIsAddModalOpen(true)}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F0] border-b border-stone-200 text-stone-600 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-5">Vendor Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Risk Tier</th>
                    <th className="py-3 px-4">Decision Status</th>
                    <th className="py-3 px-4">Contract Expiry</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium">
                  {vendors.map((v) => {
                    const isExpiring =
                      v.contractExpiryDate &&
                      new Date(v.contractExpiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

                    return (
                      <tr
                        key={v._id}
                        onClick={() => setSelectedVendor(v)}
                        className="hover:bg-stone-50/80 transition-colors cursor-pointer group"
                      >
                        <td className="py-3.5 px-5">
                          <div className="font-semibold text-stone-900 group-hover:text-[#790D16] transition-colors leading-tight">
                            {v.name}
                          </div>
                          <div className="text-[11px] text-stone-500 mt-0.5">
                            {v.contactPerson} · {v.email}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-stone-700">{v.category}</td>
                        <td className="py-3.5 px-4">
                          <Badge
                            variant={
                              v.riskLevel === 'critical'
                                ? 'rose'
                                : v.riskLevel === 'high'
                                ? 'amber'
                                : v.riskLevel === 'medium'
                                ? 'slate'
                                : 'emerald'
                            }
                            size="sm"
                          >
                            {v.riskLevel.toUpperCase()} ({v.riskScore}/100)
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${
                              v.lastReviewDecision === 'approved'
                                ? 'bg-emerald-50 text-emerald-800'
                                : v.lastReviewDecision === 'conditional'
                                ? 'bg-amber-50 text-amber-800'
                                : 'bg-stone-100 text-stone-700'
                            }`}
                          >
                            {v.lastReviewDecision || 'Pending'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {v.contractExpiryDate ? (
                            <span
                              className={`font-mono text-[11px] font-semibold ${
                                isExpiring ? 'text-amber-700 font-bold' : 'text-stone-700'
                              }`}
                            >
                              {new Date(v.contractExpiryDate).toLocaleDateString()}
                              {isExpiring && ' (Expiring)'}
                            </span>
                          ) : (
                            <span className="text-stone-400">None</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedVendor(v);
                            }}
                            className="text-[#790D16] hover:underline font-semibold text-[11px]"
                          >
                            Review →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal: Vendor Review & TPRM Decision */}
      <Modal
        isOpen={!!selectedVendor}
        onClose={() => setSelectedVendor(null)}
        title={selectedVendor ? selectedVendor.name : 'Vendor Review'}
        description={`Category: ${selectedVendor?.category} · Contact: ${selectedVendor?.email}`}
      >
        {selectedVendor && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-[#FAF7F0] rounded-xl border border-[#E5D3AF] flex items-center justify-between">
              <div>
                <div className="font-bold text-stone-900 text-sm">TPRM Assessment Decision</div>
                <div className="text-[11px] text-stone-500 mt-0.5">
                  Current Decision: <strong className="capitalize text-stone-800">{selectedVendor.lastReviewDecision}</strong>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() =>
                    decisionMutation.mutate({ id: selectedVendor._id, decision: 'approved' })
                  }
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    decisionMutation.mutate({ id: selectedVendor._id, decision: 'conditional' })
                  }
                >
                  Conditional
                </Button>
              </div>
            </div>

            {/* Checklist */}
            <div className="space-y-2">
              <div className="font-bold text-stone-900 uppercase tracking-wider text-[11px]">
                Due Diligence Verification Checklist
              </div>
              <div className="space-y-1.5">
                {selectedVendor.checklist?.map((chk, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg border border-stone-200 bg-stone-50 flex items-center justify-between"
                  >
                    <span className="font-semibold text-stone-800">{chk.item}</span>
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                        chk.completed ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'
                      }`}
                    >
                      {chk.completed ? 'Verified' : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 text-stone-600 text-[11px] leading-relaxed">
              ℹ️ <strong>Disclaimer:</strong> Vendor risk scores are decision-support indicators, not legal guarantees that a vendor is safe or compliant.
            </div>

            <div className="flex justify-end pt-3 border-t border-stone-100">
              <Button size="sm" variant="secondary" onClick={() => setSelectedVendor(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Add Vendor */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Vendor to TPRM Registry"
        description="Register a third-party service provider or software vendor."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate(newVendor);
          }}
          className="space-y-4 text-xs"
        >
          <div>
            <label className="block font-semibold text-stone-700 mb-1">Vendor Organization Name</label>
            <input
              type="text"
              required
              value={newVendor.name}
              onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })}
              placeholder="e.g. Amazon Web Services (AWS) or Datadog"
              className="w-full px-3 py-2 border border-stone-300 rounded-lg outline-none focus:ring-2 focus:ring-[#790D16]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Vendor Category</label>
              <select
                value={newVendor.category}
                onChange={(e) => setNewVendor({ ...newVendor, category: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg outline-none bg-white"
              >
                <option value="Cloud Provider">Cloud Provider</option>
                <option value="SaaS Software">SaaS Software</option>
                <option value="Professional Services">Professional Services</option>
                <option value="Hardware / IT">Hardware / IT</option>
                <option value="Legal & Financial">Legal & Financial</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Risk Tier</label>
              <select
                value={newVendor.riskLevel}
                onChange={(e) => setNewVendor({ ...newVendor, riskLevel: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg outline-none bg-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Primary Contact Name</label>
              <input
                type="text"
                required
                value={newVendor.contactPerson}
                onChange={(e) => setNewVendor({ ...newVendor, contactPerson: e.target.value })}
                placeholder="Account Representative"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Contact Email</label>
              <input
                type="email"
                required
                value={newVendor.email}
                onChange={(e) => setNewVendor({ ...newVendor, email: e.target.value })}
                placeholder="support@vendor.com"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Contract Expiry Date</label>
            <input
              type="date"
              required
              value={newVendor.contractExpiryDate}
              onChange={(e) => setNewVendor({ ...newVendor, contractExpiryDate: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg outline-none font-mono"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-stone-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={createMutation.isPending}>
              Register Vendor
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
