import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Settings, Building2, Bell, Shield, Save } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { useToast } from '../../context/ToastContext';

export const SettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { currentOrganization, refreshUser, role } = useAuth();
  const toast = useToast();

  const [name, setName] = useState('');
  const [country, setCountry] = useState('Bangladesh');
  const [industry, setIndustry] = useState('Technology / SaaS');
  const [frameworks, setFrameworks] = useState<string[]>([]);
  const [emailAlerts, setEmailAlerts] = useState(true);

  const { data: orgData, isLoading } = useQuery({
    queryKey: ['org-settings'],
    queryFn: () => api.organization.get(),
  });

  useEffect(() => {
    if (orgData) {
      setName(orgData.name || '');
      setCountry(orgData.country || 'Bangladesh');
      setIndustry(orgData.industry || 'Technology / SaaS');
      setFrameworks(orgData.complianceFrameworks || []);
      setEmailAlerts(orgData.settings?.notificationPreferences?.emailAlerts ?? true);
    }
  }, [orgData]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.organization.update(data),
    onSuccess: () => {
      toast.success('Settings Saved', 'Organization settings updated successfully.');
      queryClient.invalidateQueries({ queryKey: ['org-settings'] });
      refreshUser();
    },
    onError: (err: any) => {
      toast.error('Failed to Update', err.response?.data?.error?.message || 'Error updating settings.');
    },
  });

  const availableFrameworks = [
    'Bangladesh Labour Act 2006',
    'National Cyber Security Act (Bangladesh)',
    'BIDA & Registrar of Joint Stock Companies (RJSC) Filings',
    'ISO/IEC 27001:2022',
    'SOC 2 Type II',
    'Payment Card Industry Data Security Standard (PCI-DSS)',
  ];

  const toggleFramework = (fw: string) => {
    setFrameworks((prev) =>
      prev.includes(fw) ? prev.filter((f) => f !== fw) : [...prev, fw]
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      name,
      country,
      industry,
      complianceFrameworks: frameworks,
      settings: {
        notificationPreferences: {
          emailAlerts,
        },
      },
    });
  };

  const canEdit = role === 'super-admin' || role === 'organization-admin';

  if (isLoading) return <LoadingSkeleton rows={6} />;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 font-['Outfit'] flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-[#790D16]" /> Organization Workspace Settings
        </h1>
        <p className="text-xs text-stone-600 mt-1">
          Manage regulatory framework subscriptions, tenant localization, and notification preferences.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Workspace Identity */}
        <Card>
          <CardHeader title="Organization Profile" description="Basic business identity and geographical jurisdiction" />
          <CardContent className="p-6 space-y-4">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Company Legal Name</label>
              <input
                type="text"
                disabled={!canEdit}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg outline-none focus:ring-2 focus:ring-[#790D16] disabled:bg-stone-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Country / Jurisdiction</label>
                <select
                  disabled={!canEdit}
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg outline-none bg-white disabled:bg-stone-100"
                >
                  <option value="Bangladesh">Bangladesh (Primary Market)</option>
                  <option value="USA">United States</option>
                  <option value="International">International</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Industry Sector</label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg outline-none disabled:bg-stone-100"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Regulatory Framework Mappings */}
        <Card>
          <CardHeader
            title="Subscribed Compliance Frameworks"
            description="Select frameworks to populate compliance registers and preloaded statutory obligations"
          />
          <CardContent className="p-6 space-y-2">
            {availableFrameworks.map((fw) => {
              const isChecked = frameworks.includes(fw);
              return (
                <label
                  key={fw}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                    isChecked
                      ? 'bg-[#FAF7F0] border-[#E5D3AF] text-stone-900 font-semibold'
                      : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Shield className="w-4 h-4 text-[#790D16]" />
                    <span>{fw}</span>
                  </div>
                  <input
                    type="checkbox"
                    disabled={!canEdit}
                    checked={isChecked}
                    onChange={() => toggleFramework(fw)}
                    className="w-4 h-4 text-[#790D16] rounded border-stone-300 focus:ring-[#790D16]"
                  />
                </label>
              );
            })}
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card>
          <CardHeader title="Alert Preferences" description="Automated task reminders and expiry warning cadence" />
          <CardContent className="p-6">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="font-semibold text-stone-900">Email Due Date & Expiry Reminders</div>
                <div className="text-[11px] text-stone-500">
                  Notify owners 30 days and 7 days prior to compliance deadlines and document expirations.
                </div>
              </div>
              <input
                type="checkbox"
                disabled={!canEdit}
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="w-4 h-4 text-[#790D16] rounded border-stone-300 focus:ring-[#790D16]"
              />
            </label>
          </CardContent>
        </Card>

        {canEdit && (
          <div className="flex justify-end">
            <Button type="submit" variant="primary" size="md" isLoading={updateMutation.isPending}>
              <Save className="w-4 h-4 mr-1.5" /> Save Workspace Settings
            </Button>
          </div>
        )}
      </form>
    </div>
  );
};
