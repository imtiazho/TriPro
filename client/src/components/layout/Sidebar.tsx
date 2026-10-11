import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  ShieldCheck,
  CheckSquare,
  FileText,
  Users,
  Store,
  AlertTriangle,
  AlertOctagon,
  BookOpen,
  BarChart3,
  UserPlus,
  Settings,
  ShieldAlert,
  Shield,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { role } = useAuth();

  const navItems = [
    { label: 'Overview', to: '/app/dashboard', icon: LayoutDashboard },
    { label: 'Compliance Register', to: '/app/compliance', icon: ShieldCheck },
    { label: 'Tasks & Deadlines', to: '/app/tasks', icon: CheckSquare },
    { label: 'Evidence & Documents', to: '/app/evidence', icon: FileText },
    { label: 'HR Compliance', to: '/app/hr', icon: Users },
    { label: 'Vendor Registry & TPRM', to: '/app/vendors', icon: Store },
    { label: 'Risk Register', to: '/app/risks', icon: AlertTriangle },
    { label: 'Findings & CAPA', to: '/app/findings', icon: AlertOctagon },
    { label: 'Policies', to: '/app/policies', icon: BookOpen },
    { label: 'Reports & Analytics', to: '/app/reports', icon: BarChart3 },
  ];

  const adminItems = [
    { label: 'Team & Members', to: '/app/team', icon: UserPlus },
    { label: 'Organization Settings', to: '/app/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-stone-200/80 flex flex-col h-screen flex-shrink-0 select-none shadow-[1px_0_4px_rgba(0,0,0,0.02)]">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center gap-3 border-b border-stone-100">
        <div className="w-9 h-9 rounded-xl bg-[#790D16] flex items-center justify-center text-white shadow-sm shadow-[#790D16]/20">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <div className="font-extrabold text-base tracking-tight text-[#790D16] font-['Outfit']">
            TRIPRO <span className="text-stone-700 font-semibold text-xs tracking-normal">ECM</span>
          </div>
          <div className="text-[10px] text-stone-600 uppercase tracking-wider font-semibold">
            Compliance SaaS
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div>
          <div className="px-3 mb-2 text-[10px] font-bold text-stone-600 uppercase tracking-wider">
            Compliance Operations
          </div>
          <nav className="space-y-0.5">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#790D16] text-white shadow-sm shadow-[#790D16]/20 font-semibold'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-[#FAF7F0]'
                  }`
                }
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div>
          <div className="px-3 mb-2 text-[10px] font-bold text-stone-600 uppercase tracking-wider">
            Workspace Governance
          </div>
          <nav className="space-y-0.5">
            {adminItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#790D16] text-white shadow-sm font-semibold'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-[#FAF7F0]'
                  }`
                }
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            ))}

            {/* Super-Admin Platform Portal (only for super-admin role) */}
            {role === 'super-admin' && (
              <NavLink
                to="/app/admin"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all border border-[#F7C6C9] ${
                    isActive
                      ? 'bg-[#790D16] text-white shadow-sm font-semibold'
                      : 'bg-[#FDF2F3] text-[#790D16] hover:bg-[#FCE7E8]'
                  }`
                }
              >
                <ShieldAlert className="w-4 h-4 flex-shrink-0 text-current" />
                <span className="truncate">Super-Admin Portal</span>
              </NavLink>
            )}
          </nav>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-stone-100 bg-[#FAF7F0]/60">
        <div className="text-[11px] text-stone-600 leading-tight">
          <strong className="text-stone-800 font-semibold">Workflow:</strong> Know → Assign → Monitor → Verify → Improve
        </div>
      </div>
    </aside>
  );
};
