import React, { useState } from 'react';
import { useAuth, DEMO_USERS } from '../../context/AuthContext';
import { Bell, ChevronDown, Shield, LogOut, Check, Building2, UserCircle2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Link, useNavigate } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { user, currentOrganization, role, switchDemoRole, logout } = useAuth();
  const navigate = useNavigate();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Unread notifications query
  const { data: notificationsData } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => api.notifications.list({ unreadOnly: true, limit: 5 }),
    refetchInterval: 30000,
  });

  const unreadCount = notificationsData?.unreadCount || 0;

  return (
    <header className="h-16 bg-white/90 backdrop-blur-md border-b border-stone-200/80 sticky top-0 z-30 px-6 flex items-center justify-between shadow-subtle">
      {/* Left: Organization Context */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#FAF7F0] border border-[#E5D3AF] text-xs font-medium text-stone-800">
          <Building2 className="w-4 h-4 text-[#790D16]" />
          <span className="font-semibold">{currentOrganization?.name || 'TriPro Enterprise Workspace'}</span>
          <span className="text-[10px] uppercase tracking-wider text-stone-600 bg-stone-200/70 px-1.5 py-0.5 rounded">
            {currentOrganization?.country || 'Bangladesh'}
          </span>
        </div>
      </div>

      {/* Right: Quick Role Switcher, Notifications, User Profile */}
      <div className="flex items-center gap-3">
        {/* Instant Demo Role Switcher */}
        <div className="relative">
          <button
            onClick={() => {
              setRoleMenuOpen(!roleMenuOpen);
              setUserMenuOpen(false);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#FDF2F3] text-[#790D16] border border-[#F7C6C9] hover:bg-[#FCE7E8] transition-colors"
            title="Instant Demo Role Switcher"
          >
            <Shield className="w-3.5 h-3.5 text-[#790D16]" />
            <span>Role: <strong className="capitalize">{role?.replace('-', ' ')}</strong></span>
            <ChevronDown className="w-3.5 h-3.5 opacity-70" />
          </button>

          {roleMenuOpen && (
            <div
              className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-stone-200 py-2 z-50 text-xs"
              onClick={() => setRoleMenuOpen(false)}
            >
              <div className="px-3 py-1.5 text-[10px] font-bold text-stone-400 uppercase tracking-wider border-b border-stone-100">
                Switch Demo Persona
              </div>
              {DEMO_USERS.map((demo) => {
                const isSelected = user?.email === demo.email;
                return (
                  <button
                    key={demo.email}
                    onClick={() => switchDemoRole(demo.role, demo.email)}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-stone-50 transition-colors ${
                      isSelected ? 'bg-[#FDF2F3] text-[#790D16] font-semibold' : 'text-stone-700'
                    }`}
                  >
                    <div>
                      <div className="font-medium capitalize">{demo.role.replace('-', ' ')}</div>
                      <div className="text-[11px] text-stone-500">{demo.name} · {demo.title}</div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#790D16]" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Notifications Icon with Unread Badge */}
        <Link
          to="/app/notifications"
          className="relative p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#790D16] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        {/* User Profile Pill */}
        <div className="relative">
          <button
            onClick={() => {
              setUserMenuOpen(!userMenuOpen);
              setRoleMenuOpen(false);
            }}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-stone-100 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-[#790D16] text-white flex items-center justify-center text-xs font-bold uppercase shadow-sm">
              {user?.displayName ? user.displayName.charAt(0) : 'U'}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-semibold text-stone-800 leading-tight">
                {user?.displayName || 'TriPro User'}
              </div>
              <div className="text-[10px] text-stone-500 truncate max-w-[120px]">{user?.email}</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
          </button>

          {userMenuOpen && (
            <div
              className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-stone-200 py-1.5 z-50 text-xs"
              onClick={() => setUserMenuOpen(false)}
            >
              <Link
                to="/app/profile"
                className="flex items-center gap-2 px-3 py-2 text-stone-700 hover:bg-stone-50 transition-colors"
              >
                <UserCircle2 className="w-4 h-4 text-stone-400" />
                <span>My Profile</span>
              </Link>
              <button
                onClick={async () => {
                  await logout();
                  navigate('/login');
                }}
                className="w-full text-left flex items-center gap-2 px-3 py-2 text-red-700 hover:bg-red-50 transition-colors border-t border-stone-100 mt-1"
              >
                <LogOut className="w-4 h-4 text-red-600" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
