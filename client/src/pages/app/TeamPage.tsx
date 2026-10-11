import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  UserPlus,
  Users,
  Shield,
  Mail,
  CheckCircle2,
  Clock,
  MoreVertical,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { useToast } from '../../context/ToastContext';

export const TeamPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { role } = useAuth();
  const toast = useToast();

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'compliance-manager',
    department: 'Compliance & Risk',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['team-members'],
    queryFn: () => api.organization.getMembers(),
  });

  const members = data?.members || [];
  const pendingInvitations = data?.pendingInvitations || [];

  const inviteMutation = useMutation({
    mutationFn: (payload: any) => api.organization.inviteMember(payload),
    onSuccess: (res: any) => {
      toast.success('Invitation Sent', res.message || 'Invitation created successfully.');
      setIsInviteModalOpen(false);
      setInviteForm({ email: '', role: 'compliance-manager', department: 'Compliance & Risk' });
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
    onError: (err: any) => {
      toast.error('Invitation Failed', err.response?.data?.error?.message || 'Error inviting member.');
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ membershipId, newRole }: { membershipId: string; newRole: string }) =>
      api.organization.updateMemberRole(membershipId, { role: newRole }),
    onSuccess: () => {
      toast.success('Role Updated', 'Member permission role modified.');
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
  });

  const canManage = role === 'super-admin' || role === 'organization-admin';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 font-['Outfit'] flex items-center gap-2.5">
            <Users className="w-6 h-6 text-[#790D16]" /> Team & Access Control
          </h1>
          <p className="text-xs text-stone-600 mt-1">
            Manage organization members, role-based access permissions, and pending onboarding invitations.
          </p>
        </div>

        {canManage && (
          <Button variant="primary" size="sm" onClick={() => setIsInviteModalOpen(true)}>
            <UserPlus className="w-4 h-4 mr-1" /> Invite Colleague
          </Button>
        )}
      </div>

      {/* Members Table */}
      <Card>
        <CardHeader
          title="Active Organization Members"
          description={`${members.length} team members associated with this workspace`}
        />
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <LoadingSkeleton rows={5} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F0] border-b border-stone-200 text-stone-600 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-5">Member</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Role & Permissions</th>
                    <th className="py-3 px-4">Status</th>
                    {canManage && <th className="py-3 px-4 text-right">Role Assignment</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium">
                  {members.map((m: any) => (
                    <tr key={m.membershipId} className="hover:bg-stone-50/80 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-stone-900">
                          {m.user?.displayName || 'User'}
                        </div>
                        <div className="text-[11px] text-stone-500 font-mono mt-0.5">{m.user?.email}</div>
                      </td>
                      <td className="py-3.5 px-4 text-stone-700">{m.department || 'General'}</td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            m.role === 'organization-admin'
                              ? 'burgundy'
                              : m.role === 'compliance-manager'
                              ? 'amber'
                              : m.role === 'auditor'
                              ? 'slate'
                              : 'sand'
                          }
                          size="sm"
                        >
                          {m.role}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Active
                        </span>
                      </td>
                      {canManage && (
                        <td className="py-3.5 px-4 text-right">
                          <select
                            value={m.role}
                            onChange={(e) =>
                              updateRoleMutation.mutate({
                                membershipId: m.membershipId,
                                newRole: e.target.value,
                              })
                            }
                            className="text-xs border border-stone-200 rounded-lg px-2 py-1 bg-white text-stone-700 outline-none"
                          >
                            <option value="organization-admin">Organization Admin</option>
                            <option value="compliance-manager">Compliance Manager</option>
                            <option value="hr-manager">HR Manager</option>
                            <option value="vendor-manager">Vendor Manager</option>
                            <option value="employee">Employee</option>
                            <option value="auditor">Auditor (Read-Only)</option>
                          </select>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <Card>
          <CardHeader title="Pending Invitations" description="Invited members awaiting activation" />
          <CardContent className="p-0">
            <div className="divide-y divide-stone-100">
              {pendingInvitations.map((inv: any) => (
                <div key={inv._id} className="p-4 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-stone-900">{inv.email}</span>
                    <span className="text-stone-500 ml-2">({inv.department})</span>
                    <div className="text-[11px] text-stone-400 font-mono mt-0.5">
                      Invited as: {inv.role} · Expires: {new Date(inv.expiresAt).toLocaleDateString()}
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Pending Activation
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal: Invite Member */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite Team Member"
        description="Onboard an administrator, compliance lead, or auditor to your organization."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            inviteMutation.mutate(inviteForm);
          }}
          className="space-y-4 text-xs"
        >
          <div>
            <label className="block font-semibold text-stone-700 mb-1">Colleague Work Email</label>
            <input
              type="email"
              required
              value={inviteForm.email}
              onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
              placeholder="colleague@company.com"
              className="w-full px-3 py-2 border border-stone-300 rounded-lg outline-none focus:ring-2 focus:ring-[#790D16]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Assigned Role</label>
              <select
                value={inviteForm.role}
                onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg outline-none bg-white"
              >
                <option value="organization-admin">Organization Admin</option>
                <option value="compliance-manager">Compliance Manager</option>
                <option value="hr-manager">HR Manager</option>
                <option value="vendor-manager">Vendor Manager</option>
                <option value="employee">Employee</option>
                <option value="auditor">Auditor (Read-Only)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Department</label>
              <input
                type="text"
                value={inviteForm.department}
                onChange={(e) => setInviteForm({ ...inviteForm, department: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg outline-none"
              />
            </div>
          </div>

          <div className="p-3 bg-[#FAF7F0] rounded-lg border border-[#E5D3AF] text-stone-600 text-[11px]">
            🔒 Least Privilege Principle: Users receive strictly bounded permissions according to their role. Auditors cannot modify or delete records.
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-stone-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsInviteModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={inviteMutation.isPending}>
              Send Invitation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
