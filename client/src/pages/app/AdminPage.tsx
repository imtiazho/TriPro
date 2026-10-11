import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldAlert,
  Building2,
  Users,
  Activity,
  Plus,
  Shield,
  Server,
  FileText,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { useToast } from '../../context/ToastContext';

export const AdminPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { role } = useAuth();
  const toast = useToast();

  const [isNewOrgModalOpen, setIsNewOrgModalOpen] = useState(false);
  const [newOrg, setNewOrg] = useState({
    name: '',
    slug: '',
    country: 'Bangladesh',
    industry: 'Technology / B2B SaaS',
    subscriptionTier: 'growth',
  });

  // Query platform stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.admin.getStats(),
  });

  // Query tenant organizations
  const { data: orgsData, isLoading: orgsLoading } = useQuery({
    queryKey: ['admin-orgs'],
    queryFn: () => api.admin.getOrganizations(),
  });

  const organizations = orgsData?.data || [];

  // Query platform audit logs
  const { data: auditData } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: () => api.admin.getAuditLogs({ limit: 20 }),
  });

  const auditLogs = auditData?.data || [];

  // Mutations
  const createOrgMutation = useMutation({
    mutationFn: (data: any) => api.admin.createOrganization(data),
    onSuccess: () => {
      toast.success('Organization Provisioned', 'New tenant organization created.');
      setIsNewOrgModalOpen(false);
      setNewOrg({
        name: '',
        slug: '',
        country: 'Bangladesh',
        industry: 'Technology / B2B SaaS',
        subscriptionTier: 'growth',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-orgs'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (err: any) => {
      toast.error('Provisioning Failed', err.response?.data?.error?.message || 'Error creating organization.');
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.admin.updateOrgStatus(id, status),
    onSuccess: (updated) => {
      toast.success('Status Updated', `Tenant status changed to ${updated.status}.`);
      queryClient.invalidateQueries({ queryKey: ['admin-orgs'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });

  if (role !== 'super-admin') {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-rose-200 text-rose-800 space-y-2">
        <ShieldAlert className="w-8 h-8 text-rose-700 mx-auto" />
        <h3 className="font-bold text-lg">Access Denied</h3>
        <p className="text-xs max-w-sm mx-auto">
          You lack Super-Admin privileges. Platform administration is restricted to authorized server-bootstrapped accounts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 font-['Outfit'] flex items-center gap-2.5">
            <ShieldAlert className="w-6 h-6 text-[#790D16]" /> Super-Admin Platform Portal
          </h1>
          <p className="text-xs text-stone-600 mt-1">
            Global multi-tenant oversight, tenant lifecycle administration, and system health monitoring.
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={() => setIsNewOrgModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> Provision Organization
        </Button>
      </div>

      {/* Platform KPIs */}
      {statsLoading || !stats ? (
        <LoadingSkeleton rows={2} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500">Tenant Organizations</span>
              <Building2 className="w-4 h-4 text-[#790D16]" />
            </div>
            <div className="text-2xl font-black text-stone-900 mt-2 font-mono">
              {stats.totalOrgs}
            </div>
            <div className="text-[11px] text-emerald-700 font-semibold mt-1">
              {stats.activeOrgs} active workspaces
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500">Platform Users</span>
              <Users className="w-4 h-4 text-[#790D16]" />
            </div>
            <div className="text-2xl font-black text-stone-900 mt-2 font-mono">
              {stats.totalUsers}
            </div>
            <div className="text-[11px] text-stone-500 mt-1">Across all organizations</div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500">Compliance Records</span>
              <Activity className="w-4 h-4 text-[#790D16]" />
            </div>
            <div className="text-2xl font-black text-stone-900 mt-2 font-mono">
              {stats.totalObligations}
            </div>
            <div className="text-[11px] text-stone-500 mt-1">Active regulatory items</div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500">Platform Audit Events</span>
              <Server className="w-4 h-4 text-[#790D16]" />
            </div>
            <div className="text-2xl font-black text-stone-900 mt-2 font-mono">
              {stats.totalAudits}
            </div>
            <div className="text-[11px] text-stone-500 mt-1">Immutable security records</div>
          </Card>
        </div>
      )}

      {/* Tenant Organizations Table */}
      <Card>
        <CardHeader
          title="Tenant Organizations Registry"
          description="Manage client organizations, tier allocations, and suspension states"
        />
        <CardContent className="p-0">
          {orgsLoading ? (
            <div className="p-6">
              <LoadingSkeleton rows={4} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F0] border-b border-stone-200 text-stone-600 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-5">Organization</th>
                    <th className="py-3 px-4">Jurisdiction & Industry</th>
                    <th className="py-3 px-4">Subscription Tier</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium">
                  {organizations.map((org: any) => (
                    <tr key={org._id} className="hover:bg-stone-50/80 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-stone-900">{org.name}</div>
                        <div className="text-[11px] text-stone-500 font-mono mt-0.5">{org.slug}</div>
                      </td>
                      <td className="py-3.5 px-4 text-stone-700">
                        {org.country} · <span className="text-stone-500">{org.industry}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="sand" size="sm">
                          {org.subscriptionTier.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={org.status === 'active' ? 'emerald' : 'rose'}
                          size="sm"
                        >
                          {org.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          size="sm"
                          variant={org.status === 'active' ? 'outline' : 'primary'}
                          className="text-[11px] py-1"
                          onClick={() =>
                            toggleStatusMutation.mutate({
                              id: org._id,
                              status: org.status === 'active' ? 'suspended' : 'active',
                            })
                          }
                        >
                          {org.status === 'active' ? 'Suspend' : 'Activate'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Global Administrative Audit Logs */}
      <Card>
        <CardHeader
          title="Global Administrative Audit Trail"
          description="Cross-tenant audit history for compliance and security oversight"
        />
        <CardContent className="p-6 pt-0">
          <div className="divide-y divide-stone-100 max-h-64 overflow-y-auto">
            {auditLogs.map((log: any) => (
              <div key={log._id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-stone-900">{log.action}</span>
                  <span className="text-stone-500 ml-2 font-mono">[{log.resourceType}]</span>
                  <div className="text-[10px] text-stone-500">
                    Actor: {log.actorEmail} ({log.actorRole}) · Org: {log.organizationId?.name || 'Platform'}
                  </div>
                </div>
                <div className="text-stone-400 font-mono text-[10px]">
                  {new Date(log.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modal: Provision Organization */}
      <Modal
        isOpen={isNewOrgModalOpen}
        onClose={() => setIsNewOrgModalOpen(false)}
        title="Provision Tenant Organization"
        description="Initializes a new isolated multi-tenant organization workspace."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createOrgMutation.mutate(newOrg);
          }}
          className="space-y-4 text-xs"
        >
          <div>
            <label className="block font-semibold text-stone-700 mb-1">Organization Name</label>
            <input
              type="text"
              required
              value={newOrg.name}
              onChange={(e) => {
                const nameVal = e.target.value;
                setNewOrg({
                  ...newOrg,
                  name: nameVal,
                  slug: nameVal.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'),
                });
              }}
              placeholder="e.g. Dhaka FinTech Innovations Ltd."
              className="w-full px-3 py-2 border border-stone-300 rounded-lg outline-none focus:ring-2 focus:ring-[#790D16]"
            />
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Organization Slug (URL identifier)</label>
            <input
              type="text"
              required
              value={newOrg.slug}
              onChange={(e) => setNewOrg({ ...newOrg, slug: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg outline-none font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Country</label>
              <select
                value={newOrg.country}
                onChange={(e) => setNewOrg({ ...newOrg, country: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg outline-none bg-white"
              >
                <option value="Bangladesh">Bangladesh</option>
                <option value="USA">United States</option>
                <option value="International">International</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Subscription Tier</label>
              <select
                value={newOrg.subscriptionTier}
                onChange={(e) => setNewOrg({ ...newOrg, subscriptionTier: e.target.value as any })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg outline-none bg-white"
              >
                <option value="starter">Starter</option>
                <option value="growth">Growth</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-stone-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsNewOrgModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={createOrgMutation.isPending}>
              Provision Workspace
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
