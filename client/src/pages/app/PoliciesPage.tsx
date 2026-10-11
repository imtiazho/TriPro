import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Policy } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  BookOpen,
  Plus,
  CheckCircle2,
  Clock,
  Check,
  FileText,
  Search,
  Eye,
} from 'lucide-react';
import { Card, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';

export const PoliciesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);

  // New Policy Form
  const [newPolicy, setNewPolicy] = useState({
    title: '',
    code: '',
    category: 'Information Security',
    version: '1.0',
    status: 'published',
    content: '',
  });

  // Query Policies
  const { data: responseData, isLoading } = useQuery({
    queryKey: ['policies', search],
    queryFn: () => api.policies.list({ search: search || undefined }),
  });

  const policies: Policy[] = responseData?.data || [];

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => api.policies.create(data),
    onSuccess: () => {
      toast.success('Policy Published', 'Governance document registered.');
      setIsAddModalOpen(false);
      setNewPolicy({
        title: '',
        code: '',
        category: 'Information Security',
        version: '1.0',
        status: 'published',
        content: '',
      });
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
  });

  // Acknowledge Mutation
  const ackMutation = useMutation({
    mutationFn: (id: string) => api.policies.acknowledge(id),
    onSuccess: () => {
      toast.success('Policy Acknowledged', 'Your formal acknowledgment has been recorded in the audit trail.');
      setSelectedPolicy(null);
      queryClient.invalidateQueries({ queryKey: ['policies'] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 font-['Outfit'] flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-[#790D16]" /> Policy Management
          </h1>
          <p className="text-xs text-stone-600 mt-1">
            Internal governance documents, version control, and verifiable employee policy acknowledgment.
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> New Policy
        </Button>
      </div>

      {/* Policies Grid */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <LoadingSkeleton rows={5} />
            </div>
          ) : policies.length === 0 ? (
            <EmptyState
              title="No internal policies registered"
              description="Create enterprise governance policies (Acceptable Use, Code of Conduct, Information Security)."
              actionLabel="New Policy"
              onAction={() => setIsAddModalOpen(true)}
            />
          ) : (
            <div className="divide-y divide-stone-100">
              {policies.map((pol) => {
                const isAcknowledged =
                  user && pol.acknowledgments?.some((a) => a.userId === user.id);

                return (
                  <div
                    key={pol._id}
                    onClick={() => setSelectedPolicy(pol)}
                    className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-stone-50/80 transition-colors cursor-pointer group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#790D16] bg-[#FDF2F3] px-2 py-0.5 rounded">
                          {pol.code}
                        </span>
                        <h4 className="font-semibold text-stone-900 group-hover:text-[#790D16] transition-colors text-sm">
                          {pol.title}
                        </h4>
                        <span className="text-[10px] text-stone-500 font-mono">v{pol.version}</span>
                        <Badge variant={pol.status === 'published' ? 'emerald' : 'slate'} size="sm">
                          {pol.status.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-xs text-stone-500 line-clamp-1 max-w-xl">{pol.content}</p>
                      <div className="flex items-center gap-3 text-[11px] text-stone-400 font-medium pt-1">
                        <span>Category: {pol.category}</span>
                        <span>·</span>
                        <span>{pol.acknowledgments?.length || 0} Staff Acknowledged</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      {isAcknowledged ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Acknowledged
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            ackMutation.mutate(pol._id);
                          }}
                        >
                          <Check className="w-3.5 h-3.5 mr-1" /> Acknowledge
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal: View Full Policy & Acknowledge */}
      <Modal
        isOpen={!!selectedPolicy}
        onClose={() => setSelectedPolicy(null)}
        title={selectedPolicy ? `${selectedPolicy.code}: ${selectedPolicy.title}` : 'Policy'}
        description={`Version ${selectedPolicy?.version} · Category: ${selectedPolicy?.category}`}
        maxWidth="xl"
      >
        {selectedPolicy && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-stone-800 leading-relaxed font-sans text-xs whitespace-pre-wrap">
              {selectedPolicy.content}
            </div>

            <div className="p-3 bg-[#FAF7F0] rounded-xl border border-[#E5D3AF] flex items-center justify-between">
              <div>
                <div className="font-bold text-stone-900 text-xs">Employee Governance Acknowledgment</div>
                <div className="text-[11px] text-stone-600">
                  {selectedPolicy.acknowledgments?.length || 0} employees have formally confirmed understanding.
                </div>
              </div>
              <Button
                size="sm"
                variant="primary"
                onClick={() => ackMutation.mutate(selectedPolicy._id)}
              >
                <Check className="w-3.5 h-3.5 mr-1" /> Confirm Acknowledgment
              </Button>
            </div>

            <div className="flex justify-end pt-2">
              <Button size="sm" variant="secondary" onClick={() => setSelectedPolicy(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Add Policy */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register Internal Governance Policy"
        description="Creates a company compliance policy with version tracking."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate(newPolicy);
          }}
          className="space-y-4 text-xs"
        >
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block font-semibold text-stone-700 mb-1">Policy Title</label>
              <input
                type="text"
                required
                value={newPolicy.title}
                onChange={(e) => setNewPolicy({ ...newPolicy, title: e.target.value })}
                placeholder="e.g. Remote Work Security & Cryptographic Key Management"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg outline-none focus:ring-2 focus:ring-[#790D16]"
              />
            </div>
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Policy Code</label>
              <input
                type="text"
                required
                value={newPolicy.code}
                onChange={(e) => setNewPolicy({ ...newPolicy, code: e.target.value })}
                placeholder="SEC-POL-005"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg outline-none uppercase font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Category</label>
              <input
                type="text"
                required
                value={newPolicy.category}
                onChange={(e) => setNewPolicy({ ...newPolicy, category: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Version Number</label>
              <input
                type="text"
                required
                value={newPolicy.version}
                onChange={(e) => setNewPolicy({ ...newPolicy, version: e.target.value })}
                placeholder="1.0"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Policy Content Text</label>
            <textarea
              required
              rows={4}
              value={newPolicy.content}
              onChange={(e) => setNewPolicy({ ...newPolicy, content: e.target.value })}
              placeholder="State formal mandates, requirements, responsibilities, and disciplinary consequences..."
              className="w-full px-3 py-2 border border-stone-300 rounded-lg outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-stone-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={createMutation.isPending}>
              Publish Policy
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
