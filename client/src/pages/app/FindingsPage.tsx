import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Finding, CorrectiveAction } from '../../types';
import {
  AlertOctagon,
  Plus,
  CheckCircle2,
  Clock,
  Calendar,
  Layers,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { Card, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';

export const FindingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [selectedSeverity, setSelectedSeverity] = useState('');
  const [isAddFindingModalOpen, setIsAddFindingModalOpen] = useState(false);
  const [selectedFindingForAction, setSelectedFindingForAction] = useState<Finding | null>(null);

  // New Finding Form
  const [newFinding, setNewFinding] = useState({
    title: '',
    description: '',
    source: 'Compliance Audit',
    severity: 'medium',
    rootCause: '',
  });

  // New CAPA Action Form
  const [newAction, setNewAction] = useState({
    title: '',
    actionPlan: '',
    targetDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  // Query Findings
  const { data: responseData, isLoading } = useQuery({
    queryKey: ['findings', { selectedSeverity }],
    queryFn: () =>
      api.findings.list({
        severity: selectedSeverity || undefined,
      }),
  });

  const findings: Finding[] = responseData?.data || [];

  // Mutations
  const createFindingMutation = useMutation({
    mutationFn: (data: any) => api.findings.create(data),
    onSuccess: () => {
      toast.success('Finding Recorded', 'Audit finding logged.');
      setIsAddFindingModalOpen(false);
      setNewFinding({
        title: '',
        description: '',
        source: 'Compliance Audit',
        severity: 'medium',
        rootCause: '',
      });
      queryClient.invalidateQueries({ queryKey: ['findings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
  });

  const createActionMutation = useMutation({
    mutationFn: ({ findingId, data }: { findingId: string; data: any }) =>
      api.findings.createAction(findingId, data),
    onSuccess: () => {
      toast.success('CAPA Action Created', 'Corrective action plan assigned.');
      setSelectedFindingForAction(null);
      setNewAction({
        title: '',
        actionPlan: '',
        targetDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
      queryClient.invalidateQueries({ queryKey: ['findings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
  });

  const verifyActionMutation = useMutation({
    mutationFn: (actionId: string) =>
      api.findings.updateAction(actionId, {
        status: 'verified',
        verificationNotes: 'Verified and signed off by authorized compliance reviewer.',
      }),
    onSuccess: () => {
      toast.success('Action Verified', 'Authorized verification sign-off completed.');
      queryClient.invalidateQueries({ queryKey: ['findings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 font-['Outfit'] flex items-center gap-2.5">
            <AlertOctagon className="w-6 h-6 text-[#790D16]" /> Findings & Corrective Actions (CAPA)
          </h1>
          <p className="text-xs text-stone-600 mt-1">
            Capture deficiencies from internal inspections or regulatory reviews and track verifiable resolution.
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={() => setIsAddFindingModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> Log Audit Finding
        </Button>
      </div>

      {/* Findings List */}
      {isLoading ? (
        <LoadingSkeleton rows={6} />
      ) : findings.length === 0 ? (
        <EmptyState
          title="No audit findings recorded"
          description="Log deficiencies or non-compliances to initiate corrective action remediation."
          actionLabel="Log Finding"
          onAction={() => setIsAddFindingModalOpen(true)}
        />
      ) : (
        <div className="space-y-4">
          {findings.map((f) => (
            <Card key={f._id} className="border-stone-200">
              <CardContent className="p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-900 text-sm">{f.title}</span>
                      <Badge
                        variant={
                          f.severity === 'critical'
                            ? 'rose'
                            : f.severity === 'high'
                            ? 'rose'
                            : f.severity === 'medium'
                            ? 'amber'
                            : 'slate'
                        }
                        size="sm"
                      >
                        {f.severity.toUpperCase()}
                      </Badge>
                      <span className="text-[11px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full capitalize">
                        {f.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-500 font-medium">
                      Source: {f.source} · Identified on {new Date(f.identifiedDate).toLocaleDateString()}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs self-start sm:self-auto"
                    onClick={() => setSelectedFindingForAction(f)}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add CAPA Action
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-stone-50 rounded-xl p-3 border border-stone-200">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-stone-500 block">Description</span>
                    <p className="text-stone-700 mt-0.5 leading-relaxed">{f.description}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-stone-500 block">Root Cause Analysis</span>
                    <p className="text-stone-700 mt-0.5 leading-relaxed">
                      {f.rootCause || 'Root cause investigation underway.'}
                    </p>
                  </div>
                </div>

                {/* Linked Corrective Actions */}
                <div className="space-y-2 pt-1">
                  <div className="text-[11px] font-bold uppercase text-stone-600 tracking-wider">
                    Corrective Actions ({f.correctiveActions?.length || 0})
                  </div>
                  {f.correctiveActions && f.correctiveActions.length > 0 ? (
                    <div className="space-y-2">
                      {f.correctiveActions.map((act) => (
                        <div
                          key={act._id}
                          className="p-3 rounded-lg bg-white border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <div className="font-semibold text-stone-900">{act.title}</div>
                            <div className="text-stone-600 text-[11px] mt-0.5">{act.actionPlan}</div>
                            <div className="text-[10px] text-stone-400 font-mono mt-1">
                              Target Date: {new Date(act.targetDate).toLocaleDateString()}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                act.status === 'verified'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : act.status === 'completed'
                                  ? 'bg-sky-100 text-sky-800'
                                  : 'bg-stone-100 text-stone-700'
                              }`}
                            >
                              {act.status}
                            </span>
                            {act.status !== 'verified' && (
                              <Button
                                size="sm"
                                variant="primary"
                                className="text-[11px] py-1"
                                onClick={() => verifyActionMutation.mutate(act._id)}
                              >
                                <Check className="w-3 h-3 mr-1" /> Sign-off Verification
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg border border-dashed border-stone-200 text-center text-xs text-stone-400">
                      No corrective action plan created yet for this finding.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal: Log Audit Finding */}
      <Modal
        isOpen={isAddFindingModalOpen}
        onClose={() => setIsAddFindingModalOpen(false)}
        title="Log Audit Finding / Non-Compliance"
        description="Records an inspection observation, audit gap, or regulatory deficiency."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createFindingMutation.mutate(newFinding);
          }}
          className="space-y-4 text-xs"
        >
          <div>
            <label className="block font-semibold text-stone-700 mb-1">Finding Title</label>
            <input
              type="text"
              required
              value={newFinding.title}
              onChange={(e) => setNewFinding({ ...newFinding, title: e.target.value })}
              placeholder="e.g. Incomplete Fire Extinguisher Inspection Tags in Dhaka HQ"
              className="w-full px-3 py-2 border border-stone-300 rounded-lg outline-none focus:ring-2 focus:ring-[#790D16]"
            />
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Deficiency Description</label>
            <textarea
              required
              rows={2}
              value={newFinding.description}
              onChange={(e) => setNewFinding({ ...newFinding, description: e.target.value })}
              placeholder="State observations, evidence inspected, and requirements violated..."
              className="w-full px-3 py-2 border border-stone-300 rounded-lg outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Audit Source</label>
              <select
                value={newFinding.source}
                onChange={(e) => setNewFinding({ ...newFinding, source: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg outline-none bg-white"
              >
                <option value="Compliance Audit">Compliance Audit</option>
                <option value="Risk Review">Risk Review</option>
                <option value="Vendor Assessment">Vendor Assessment</option>
                <option value="Internal Inspection">Internal Inspection</option>
                <option value="External Regulator">External Regulator</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Severity</label>
              <select
                value={newFinding.severity}
                onChange={(e) => setNewFinding({ ...newFinding, severity: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg outline-none bg-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Root Cause Analysis</label>
            <textarea
              rows={2}
              value={newFinding.rootCause}
              onChange={(e) => setNewFinding({ ...newFinding, rootCause: e.target.value })}
              placeholder="Why did this gap occur? (Process failure, missing checklist, vendor delay)..."
              className="w-full px-3 py-2 border border-stone-300 rounded-lg outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-stone-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddFindingModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={createFindingMutation.isPending}>
              Record Finding
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add CAPA Action */}
      <Modal
        isOpen={!!selectedFindingForAction}
        onClose={() => setSelectedFindingForAction(null)}
        title="Add Corrective Action (CAPA)"
        description={`Remediation plan for: "${selectedFindingForAction?.title}"`}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (selectedFindingForAction) {
              createActionMutation.mutate({
                findingId: selectedFindingForAction._id,
                data: newAction,
              });
            }
          }}
          className="space-y-4 text-xs"
        >
          <div>
            <label className="block font-semibold text-stone-700 mb-1">Corrective Action Title</label>
            <input
              type="text"
              required
              value={newAction.title}
              onChange={(e) => setNewAction({ ...newAction, title: e.target.value })}
              placeholder="e.g. Schedule emergency contractor to service and re-tag all cylinders"
              className="w-full px-3 py-2 border border-stone-300 rounded-lg outline-none focus:ring-2 focus:ring-[#790D16]"
            />
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Action Plan & Deliverables</label>
            <textarea
              required
              rows={3}
              value={newAction.actionPlan}
              onChange={(e) => setNewAction({ ...newAction, actionPlan: e.target.value })}
              placeholder="Explain tangible deliverables required before sign-off..."
              className="w-full px-3 py-2 border border-stone-300 rounded-lg outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Resolution Target Date</label>
            <input
              type="date"
              required
              value={newAction.targetDate}
              onChange={(e) => setNewAction({ ...newAction, targetDate: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg outline-none font-mono"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-stone-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setSelectedFindingForAction(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={createActionMutation.isPending}>
              Assign Action Plan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
