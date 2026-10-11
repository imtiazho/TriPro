import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { User, Shield, Building2, Save } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { useToast } from '../../context/ToastContext';

export const ProfilePage: React.FC = () => {
  const { user, currentOrganization, role, refreshUser } = useAuth();
  const toast = useToast();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.auth.updateProfile({ displayName });
      toast.success('Profile Saved', 'Display name updated.');
      await refreshUser();
    } catch {
      toast.error('Update Failed', 'Unable to save profile modifications.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 font-['Outfit'] flex items-center gap-2.5">
          <User className="w-6 h-6 text-[#790D16]" /> Personal Account & Identity
        </h1>
        <p className="text-xs text-stone-600 mt-1">
          Review your authorized RBAC role, active organization membership, and profile settings.
        </p>
      </div>

      <Card>
        <CardHeader title="Account Details" description="Verified through Firebase Authentication" />
        <CardContent className="p-6">
          <form onSubmit={handleUpdate} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Work Email</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-stone-100 text-stone-500 font-mono"
              />
              <span className="text-[10px] text-stone-400 mt-0.5 block">Managed by corporate identity provider</span>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Full Display Name</label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg outline-none focus:ring-2 focus:ring-[#790D16]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-stone-500 font-bold uppercase text-[10px] block">Assigned Role</span>
                <span className="font-semibold text-stone-900 capitalize text-sm">{role?.replace('-', ' ')}</span>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-stone-500 font-bold uppercase text-[10px] block">Active Workspace</span>
                <span className="font-semibold text-stone-900 text-sm truncate block">
                  {currentOrganization?.name || 'Workspace'}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-stone-100">
              <Button type="submit" variant="primary" size="sm" isLoading={loading}>
                <Save className="w-3.5 h-3.5 mr-1" /> Update Profile
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
