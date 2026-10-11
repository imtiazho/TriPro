import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Risk } from '../../types';
import {
  AlertTriangle,
  Plus,
  Search,
  ShieldAlert,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';

export const RisksPage: React.FC = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);

  // Add Risk Form
  const [newRisk, setNewRisk] = useState({
    title: '',
    description: '',
    category: 'Regulatory',
    likelihood: 3,
    impact: 3,
    mitigationPlan: '',
  });

  // Query Risks
  const { data: responseData, isLoading } = useQuery({
    queryKey: ['risks', { selectedCategory }],
    queryFn: () =>
      api.risks.list({
        category: selectedCategory || undefined,
      }),
  });

  const risks: Risk[] = responseData?.data || [];

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => api.risks.create(data),
    onSuccess: () => {
      toast.success('Risk Logged', 'Vulnerability added to Risk Register.');
      setIsAddModalOpen(false);
      setNewRisk({
        title: '',
        description: '',
        category: 'Regulatory',
        likelihood: 3,
        impact: 3,
        mitigationPlan: '',
      });
      queryClient.invalidateQueries({ queryKey: ['risks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 font-['Outfit'] flex items-center gap-2.5">
            <AlertTriangle className="w-6 h-6 text-[#790D16]" /> Risk Register & 5×5 Matrix
          </h1>
          <p className="text-xs text-stone-600 mt-1">
            Likelihood × Impact matrix scoring to systematically monitor and mitigate enterprise vulnerabilities.
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> Log Risk
        </Button>
      </div>

      {/* 5x5 Heat Map Visualizer & Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader
            title="5×5 Likelihood vs. Impact Risk Heatmap"
            description="Numbers represent active risks mapped to specific severity coordinates"
          />
          <CardContent className="p-6">
            <div className="flex flex-col gap-1 text-xs">
              {/* Likelihood (5 down to 1) */}
              {[5, 4, 3, 2, 1].map((lh) => (
                <div key={lh} className="flex items-center gap-2">
                  <span className="w-16 font-mono text-[10px] text-stone-500 font-semibold text-right">
                    L{lh} ({lh === 5 ? 'Almost Certain' : lh === 4 ? 'Likely' : lh === 3 ? 'Possible' : lh === 2 ? 'Unlikely' : 'Rare'})
                  </span>
                  <div className="grid grid-cols-5 gap-1.5 flex-1">
                    {[1, 2, 3, 4, 5].map((imp) => {
                      const score = lh * imp;
                      const count = risks.filter((r) => r.likelihood === lh && r.impact === imp).length;

                      const bg =
                        score >= 20
                          ? 'bg-[#790D16] text-white'
                          : score >= 12
                          ? 'bg-rose-600 text-white'
                          : score >= 6
                          ? 'bg-amber-500 text-stone-950 font-bold'
                          : 'bg-emerald-600 text-white';

                      return (
                        <div
                          key={imp}
                          className={`h-11 rounded-lg flex flex-col items-center justify-center font-bold font-mono transition-transform hover:scale-105 shadow-sm cursor-pointer ${bg}`}
                          title={`Likelihood ${lh} x Impact ${imp} = Score ${score}`}
                        >
                          <span className="text-[10px] opacity-75">{score}</span>
                          <span className="text-xs font-black">{count > 0 ? `${count} risk` : '-'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              {/* Impact Axis */}
              <div className="flex items-center gap-2 pt-1 pl-16">
                <div className="grid grid-cols-5 gap-1.5 flex-1 text-center font-mono text-[10px] text-stone-500 font-semibold">
                  <div>I1 (Negligible)</div>
                  <div>I2 (Minor)</div>
                  <div>I3 (Moderate)</div>
                  <div>I4 (Major)</div>
                  <div>I5 (Catastrophic)</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scoring Methodology Card */}
        <Card>
          <CardHeader title="Scoring Methodology" description="Documented 1-25 scoring threshold" />
          <CardContent className="p-6 pt-0 space-y-3 text-xs">
            <div className="p-3 rounded-lg bg-[#790D16] text-white">
              <div className="font-bold flex items-center justify-between">
                <span>Critical (20 - 25)</span>
                <span className="font-mono text-[11px]">Immediate Board Escalation</span>
              </div>
              <p className="text-[10px] opacity-90 mt-1">Requires immediate remediation plan within 48 hours.</p>
            </div>
            <div className="p-3 rounded-lg bg-rose-600 text-white">
              <div className="font-bold flex items-center justify-between">
                <span>High (12 - 19)</span>
                <span className="font-mono text-[11px]">Senior Leadership</span>
              </div>
              <p className="text-[10px] opacity-90 mt-1">Active mitigation strategy reviewed weekly.</p>
            </div>
            <div className="p-3 rounded-lg bg-amber-500 text-stone-950">
              <div className="font-bold flex items-center justify-between">
                <span>Medium (6 - 11)</span>
                <span className="font-mono text-[11px]">Operational Focus</span>
              </div>
              <p className="text-[10px] opacity-90 mt-1">Managed under routine departmental controls.</p>
            </div>
            <div className="p-3 rounded-lg bg-emerald-600 text-white">
              <div className="font-bold flex items-center justify-between">
                <span>Low (1 - 5)</span>
                <span className="font-mono text-[11px]">Accepted Baseline</span>
              </div>
              <p className="text-[10px] opacity-90 mt-1">Periodically reviewed on annual audit cycle.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risks Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <LoadingSkeleton rows={5} />
            </div>
          ) : risks.length === 0 ? (
            <EmptyState
              title="No risks recorded in register"
              description="Log enterprise vulnerabilities to visualize risk posture on the heat map."
              actionLabel="Log Risk"
              onAction={() => setIsAddModalOpen(true)}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F0] border-b border-stone-200 text-stone-600 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-5">Risk Title</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Likelihood × Impact</th>
                    <th className="py-3 px-4">Calculated Score</th>
                    <th className="py-3 px-4">Mitigation Status</th>
                    <th className="py-3 px-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium">
                  {risks.map((r) => (
                    <tr
                      key={r._id}
                      onClick={() => setSelectedRisk(r)}
                      className="hover:bg-stone-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-5 max-w-sm">
                        <div className="font-semibold text-stone-900 group-hover:text-[#790D16] transition-colors leading-tight">
                          {r.title}
                        </div>
                        <div className="text-[11px] text-stone-500 mt-0.5 truncate">{r.description}</div>
                      </td>
                      <td className="py-3.5 px-4 text-stone-700">{r.category}</td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-stone-700">
                        L{r.likelihood} × I{r.impact}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            r.riskLevel === 'critical'
                              ? 'rose'
                              : r.riskLevel === 'high'
                              ? 'rose'
                              : r.riskLevel === 'medium'
                              ? 'amber'
                              : 'emerald'
                          }
                          size="sm"
                        >
                          {r.riskScore}/25 ({r.riskLevel.toUpperCase()})
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize bg-stone-100 text-stone-700">
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRisk(r);
                          }}
                          className="text-[#790D16] hover:underline font-semibold text-[11px]"
                        >
                          Plan →
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

      {/* Modal: Risk Detail & Mitigation Plan */}
      <Modal
        isOpen={!!selectedRisk}
        onClose={() => setSelectedRisk(null)}
        title={selectedRisk ? selectedRisk.title : 'Risk Details'}
        description={`Calculated Score: ${selectedRisk?.riskScore}/25 (${selectedRisk?.riskLevel.toUpperCase()})`}
      >
        {selectedRisk && (
          <div className="space-y-4 text-xs">
            <div>
              <div className="font-semibold text-stone-700">Vulnerability Description</div>
              <p className="mt-1 p-3 bg-stone-50 rounded-lg border border-stone-200 text-stone-700 leading-relaxed">
                {selectedRisk.description}
              </p>
            </div>

            <div>
              <div className="font-semibold text-stone-700">Mitigation Strategy Plan</div>
              <p className="mt-1 p-3 bg-[#FAF7F0] rounded-lg border border-[#E5D3AF] text-stone-800 leading-relaxed">
                {selectedRisk.mitigationPlan || 'No explicit mitigation strategy logged yet.'}
              </p>
            </div>

            <div className="flex justify-end pt-3 border-t border-stone-100">
              <Button size="sm" variant="secondary" onClick={() => setSelectedRisk(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Add Risk */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Log Vulnerability / Operational Risk"
        description="Records a new risk with 5x5 Likelihood x Impact scoring."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate(newRisk);
          }}
          className="space-y-4 text-xs"
        >
          <div>
            <label className="block font-semibold text-stone-700 mb-1">Risk Title</label>
            <input
              type="text"
              required
              value={newRisk.title}
              onChange={(e) => setNewRisk({ ...newRisk, title: e.target.value })}
              placeholder="e.g. Critical Information Infrastructure (CII) Data Center Outage"
              className="w-full px-3 py-2 border border-stone-300 rounded-lg outline-none focus:ring-2 focus:ring-[#790D16]"
            />
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Description</label>
            <textarea
              required
              rows={2}
              value={newRisk.description}
              onChange={(e) => setNewRisk({ ...newRisk, description: e.target.value })}
              placeholder="Explain potential failure mode and operational impact..."
              className="w-full px-3 py-2 border border-stone-300 rounded-lg outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Category</label>
              <select
                value={newRisk.category}
                onChange={(e) => setNewRisk({ ...newRisk, category: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg outline-none bg-white"
              >
                <option value="Regulatory">Regulatory</option>
                <option value="Operational">Operational</option>
                <option value="Security & Privacy">Security & Privacy</option>
                <option value="Financial">Financial</option>
                <option value="Vendor / Third-Party">Vendor / Third-Party</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Likelihood (1 - 5)</label>
              <select
                value={newRisk.likelihood}
                onChange={(e) => setNewRisk({ ...newRisk, likelihood: parseInt(e.target.value, 10) })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg outline-none bg-white font-mono"
              >
                <option value={1}>1 - Rare</option>
                <option value={2}>2 - Unlikely</option>
                <option value={3}>3 - Possible</option>
                <option value={4}>4 - Likely</option>
                <option value={5}>5 - Almost Certain</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Impact (1 - 5)</label>
              <select
                value={newRisk.impact}
                onChange={(e) => setNewRisk({ ...newRisk, impact: parseInt(e.target.value, 10) })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg outline-none bg-white font-mono"
              >
                <option value={1}>1 - Negligible</option>
                <option value={2}>2 - Minor</option>
                <option value={3}>3 - Moderate</option>
                <option value={4}>4 - Major</option>
                <option value={5}>5 - Catastrophic</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Mitigation Plan</label>
            <textarea
              rows={2}
              value={newRisk.mitigationPlan}
              onChange={(e) => setNewRisk({ ...newRisk, mitigationPlan: e.target.value })}
              placeholder="Controls or redundancy measures deployed..."
              className="w-full px-3 py-2 border border-stone-300 rounded-lg outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-stone-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={createMutation.isPending}>
              Save Risk
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
