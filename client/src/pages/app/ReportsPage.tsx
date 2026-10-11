import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import {
  BarChart3,
  Download,
  ShieldCheck,
  FileSpreadsheet,
  AlertTriangle,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';

export const ReportsPage: React.FC = () => {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: () => api.reports.getDashboard(),
  });

  if (isLoading || !metrics) {
    return <LoadingSkeleton rows={8} />;
  }

  const categoryData = metrics.obligations.byCategory || [];

  const riskData = [
    { name: 'Critical', count: metrics.risks.critical, color: '#790D16' },
    { name: 'High', count: metrics.risks.high, color: '#DC2626' },
    { name: 'Medium', count: metrics.risks.medium, color: '#D97706' },
    { name: 'Low', count: metrics.risks.low, color: '#166534' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 font-['Outfit'] flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-[#790D16]" /> Reports & Compliance Analytics
          </h1>
          <p className="text-xs text-stone-600 mt-1">
            Aggregated audit readiness reports, framework coverage analysis, and statutory CSV exports.
          </p>
        </div>

        <a
          href={api.reports.exportCSV()}
          download
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-[#790D16] text-white hover:bg-[#640E15] transition-colors shadow-sm"
        >
          <FileSpreadsheet className="w-4 h-4" /> Export Complete Audit CSV
        </a>
      </div>

      {/* Analytics Visuals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Obligations by Category */}
        <Card>
          <CardHeader
            title="Compliance Obligations by Domain"
            description="Framework coverage across operations"
          />
          <CardContent className="p-6">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F5EFE3" />
                  <XAxis dataKey="category" stroke="#78716C" fontSize={10} tickLine={false} />
                  <YAxis stroke="#78716C" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FAF7F0', borderColor: '#E5D3AF', borderRadius: '8px', fontSize: '11px' }}
                  />
                  <Bar dataKey="count" fill="#790D16" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Enterprise Risk Distribution */}
        <Card>
          <CardHeader
            title="Enterprise Risk Tiering"
            description="Active operational vulnerabilities by severity"
          />
          <CardContent className="p-6">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F5EFE3" />
                  <XAxis dataKey="name" stroke="#78716C" fontSize={11} tickLine={false} />
                  <YAxis stroke="#78716C" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FAF7F0', borderColor: '#E5D3AF', borderRadius: '8px', fontSize: '11px' }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {riskData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 space-y-2">
          <div className="text-xs font-semibold text-stone-500">Statutory Health Index</div>
          <div className="text-3xl font-black text-[#790D16] font-mono">{metrics.healthScore}%</div>
          <p className="text-[11px] text-stone-600">
            Based on completed statutory obligations and resolved findings.
          </p>
        </Card>

        <Card className="p-6 space-y-2">
          <div className="text-xs font-semibold text-stone-500">Document Locker Adherence</div>
          <div className="text-3xl font-black text-stone-900 font-mono">
            {metrics.obligations.total - metrics.evidence.missing}/{metrics.obligations.total}
          </div>
          <p className="text-[11px] text-stone-600">
            Obligations with verified tamper-evident supporting documentation.
          </p>
        </Card>

        <Card className="p-6 space-y-2">
          <div className="text-xs font-semibold text-stone-500">Third-Party Risk Review</div>
          <div className="text-3xl font-black text-stone-900 font-mono">
            {metrics.vendors.total - metrics.vendors.underReview}/{metrics.vendors.total}
          </div>
          <p className="text-[11px] text-stone-600">
            Registered vendors with concluded security & SLA assessments.
          </p>
        </Card>
      </div>
    </div>
  );
};
