import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  AlertTriangle,
  Clock,
  FileText,
  AlertOctagon,
  Users,
  Store,
  ArrowUpRight,
  TrendingUp,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { Link } from 'react-router-dom';
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
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const { currentOrganization } = useAuth();

  const { data: metrics, isLoading } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: () => api.reports.getDashboard(),
    refetchInterval: 60000, // auto-refresh every minute
  });

  if (isLoading || !metrics) {
    return (
      <div className="space-y-6">
        <div className="h-12 bg-white/60 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="h-32 bg-white/60 rounded-xl animate-pulse" />
          <div className="h-32 bg-white/60 rounded-xl animate-pulse" />
          <div className="h-32 bg-white/60 rounded-xl animate-pulse" />
          <div className="h-32 bg-white/60 rounded-xl animate-pulse" />
        </div>
        <LoadingSkeleton rows={8} />
      </div>
    );
  }

  // Visual Category chart data
  const categoryData = metrics.obligations.byCategory || [];

  // Donut chart data for status
  const statusPieData = [
    { name: 'Compliant', value: metrics.obligations.compliant, color: '#166534' },
    { name: 'In Progress', value: metrics.obligations.in_progress, color: '#0284C7' },
    { name: 'Pending Review', value: metrics.obligations.pending_review, color: '#D97706' },
    { name: 'Needs Attention', value: metrics.obligations.needs_attention, color: '#790D16' },
    { name: 'Non-Compliant', value: metrics.obligations.non_compliant, color: '#DC2626' },
    { name: 'Not Started', value: metrics.obligations.not_started, color: '#78716C' },
  ].filter((item) => item.value > 0);

  return (
    <div className="space-y-6">
      {/* Top Banner with Health Score */}
      <div className="bg-white rounded-2xl border border-stone-200/90 p-6 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#FAF7F0] border border-[#E5D3AF] text-[11px] font-semibold text-stone-700">
            <span className="w-1.5 h-1.5 rounded-full bg-[#790D16]" />
            Live Compliance Posture · {currentOrganization?.name || 'Workspace'}
          </div>
          <h1 className="text-2xl font-bold text-stone-900 font-['Outfit']">
            Operations & Regulatory Dashboard
          </h1>
          <p className="text-xs text-stone-600">
            Real-time data aggregated across statutory obligations, tasks, vendors, and audit findings.
          </p>
        </div>

        {/* Health Score Pill */}
        <div className="flex items-center gap-4 bg-[#FAF7F0] border border-[#E5D3AF] rounded-2xl p-4 flex-shrink-0">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-stone-200"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-[#790D16]"
                strokeDasharray={`${metrics.healthScore}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-base font-black text-[#790D16]">
              {metrics.healthScore}%
            </span>
          </div>
          <div>
            <div className="text-xs font-bold text-stone-900">Compliance Health</div>
            <div className="text-[11px] text-stone-500 mt-0.5">
              {metrics.healthScore >= 80 ? 'Optimal Status' : metrics.healthScore >= 50 ? 'Attention Needed' : 'Critical Action Req.'}
            </div>
            <div className="text-[10px] text-emerald-700 flex items-center gap-1 font-semibold mt-1">
              <TrendingUp className="w-3 h-3" /> Aggregated Live
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Obligations */}
        <Card className="hover:border-[#790D16]/30 transition-all">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500">Total Obligations</span>
              <div className="w-8 h-8 rounded-lg bg-[#FDF2F3] text-[#790D16] flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-stone-900 mt-2 font-mono">
              {metrics.obligations.total}
            </div>
            <div className="flex items-center gap-3 mt-2 text-[11px]">
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> {metrics.obligations.compliant} Compliant
              </span>
              <span className="text-rose-700 font-semibold flex items-center gap-1">
                <XCircle className="w-3 h-3" /> {metrics.obligations.non_compliant} Non-compliant
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Tasks (Overdue & Upcoming) */}
        <Card className="hover:border-[#790D16]/30 transition-all">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500">Overdue Tasks</span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-rose-700 mt-2 font-mono">
              {metrics.tasks.overdue}
            </div>
            <div className="text-[11px] text-stone-500 mt-2 flex items-center justify-between">
              <span>{metrics.tasks.upcoming} upcoming next 30d</span>
              <Link to="/app/tasks" className="text-[#790D16] hover:underline font-semibold flex items-center gap-0.5">
                View <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Evidence & Documents */}
        <Card className="hover:border-[#790D16]/30 transition-all">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500">Expiring Evidence</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-amber-700 mt-2 font-mono">
              {metrics.evidence.expiring}
            </div>
            <div className="text-[11px] text-stone-500 mt-2 flex items-center justify-between">
              <span>{metrics.evidence.missing} obligations missing docs</span>
              <Link to="/app/evidence" className="text-[#790D16] hover:underline font-semibold flex items-center gap-0.5">
                Locker <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Risks & CAPA */}
        <Card className="hover:border-[#790D16]/30 transition-all">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500">Critical Risks & CAPA</span>
              <div className="w-8 h-8 rounded-lg bg-[#FAF7F0] text-stone-800 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-[#790D16]" />
              </div>
            </div>
            <div className="text-2xl font-black text-[#790D16] mt-2 font-mono">
              {metrics.risks.critical} <span className="text-sm font-normal text-stone-500">crit. risks</span>
            </div>
            <div className="text-[11px] text-stone-500 mt-2 flex items-center justify-between">
              <span>{metrics.capa.openFindings} findings in remediation</span>
              <Link to="/app/risks" className="text-[#790D16] hover:underline font-semibold flex items-center gap-0.5">
                Matrix <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Obligations by Category Chart */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Obligations by Category"
            description="Operational distribution across statutory frameworks"
            action={
              <Link to="/app/compliance">
                <Button variant="outline" size="sm" className="text-xs">
                  View Full Register
                </Button>
              </Link>
            }
          />
          <CardContent className="p-6">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" margin={{ left: 40, right: 20 }}>
                  <XAxis type="number" stroke="#A98E60" fontSize={11} />
                  <YAxis type="category" dataKey="category" stroke="#5A4C34" fontSize={11} width={130} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FAF7F0', borderColor: '#E5D3AF', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Bar dataKey="count" fill="#790D16" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status Breakdown Donut Chart */}
        <Card>
          <CardHeader title="Lifecycle Status Breakdown" description="Proportion of compliant records" />
          <CardContent className="p-6">
            <div className="h-48 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#FAF7F0', borderColor: '#E5D3AF', borderRadius: '8px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4 text-[11px]">
              {statusPieData.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-stone-700 truncate">{item.name}:</span>
                  <strong className="text-stone-900">{item.value}</strong>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics: Vendors, HR & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Module Overviews (TPRM & HR) */}
        <Card className="space-y-4">
          <CardHeader title="Operations & Governance Summaries" description="Third-party vendors and staff compliance" />
          <CardContent className="p-6 pt-0 space-y-4">
            <div className="p-4 rounded-xl bg-[#FAF7F0] border border-[#E5D3AF] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Store className="w-5 h-5 text-[#790D16]" />
                <div>
                  <div className="text-xs font-bold text-stone-900">Vendors & Third-Party Risk</div>
                  <div className="text-[11px] text-stone-500">
                    {metrics.vendors.total} registered · {metrics.vendors.critical} critical tier
                  </div>
                </div>
              </div>
              <Link to="/app/vendors">
                <Button variant="ghost" size="sm" className="text-xs text-[#790D16]">Manage</Button>
              </Link>
            </div>

            <div className="p-4 rounded-xl bg-[#FAF7F0] border border-[#E5D3AF] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-[#790D16]" />
                <div>
                  <div className="text-xs font-bold text-stone-900">HR Statutory Compliance</div>
                  <div className="text-[11px] text-stone-500">
                    {metrics.hr.active} active staff profiles (BD Labour Act Sec 5/6)
                  </div>
                </div>
              </div>
              <Link to="/app/hr">
                <Button variant="ghost" size="sm" className="text-xs text-[#790D16]">Review</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Live Audit Log Stream */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Recent Audit & Accountability Trail"
            description="Immutable record of user actions and record mutations"
          />
          <CardContent className="p-6 pt-0">
            <div className="divide-y divide-stone-100 max-h-72 overflow-y-auto">
              {metrics.recentActivity && metrics.recentActivity.length > 0 ? (
                metrics.recentActivity.map((log: any) => (
                  <div key={log._id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#790D16]" />
                      <span className="font-semibold text-stone-900">{log.action}</span>
                      <span className="text-stone-500 font-mono text-[11px]">[{log.resourceType}]</span>
                    </div>
                    <div className="text-right text-[11px] text-stone-400">
                      <span className="font-medium text-stone-700">{log.actorEmail}</span> ·{' '}
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-stone-400">No recent audit logs recorded.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
