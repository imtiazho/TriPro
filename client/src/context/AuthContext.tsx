import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Organization, UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  currentOrganization: Organization | null;
  role: UserRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  loginWithEmail: (email: string, password?: string) => Promise<void>;
  signupWithEmail: (email: string, displayName: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  switchDemoRole: (role: UserRole, email: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  switchOrganization: (orgId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Preset demo users matching seed database
export const DEMO_USERS: Array<{ role: UserRole; email: string; name: string; title: string }> = [
  { role: 'organization-admin', email: 'orgadmin@apexdigital.com.bd', name: 'Tanvir Hossain', title: 'Founder & CEO' },
  { role: 'compliance-manager', email: 'compliance@apexdigital.com.bd', name: 'Farhana Ahmed', title: 'Compliance Officer' },
  { role: 'hr-manager', email: 'hr@apexdigital.com.bd', name: 'Nusrat Jahan', title: 'HR Coordinator' },
  { role: 'vendor-manager', email: 'vendor@apexdigital.com.bd', name: 'Kazi Mofizul', title: 'Procurement Lead' },
  { role: 'auditor', email: 'auditor@globalcompliance.io', name: 'Michael Chang', title: 'External Auditor' },
  { role: 'employee', email: 'rahim.chowdhury@apexdigital.com.bd', name: 'Rahim Chowdhury', title: 'Senior Developer' },
  { role: 'super-admin', email: 'superadmin@tripro.local', name: 'System Admin', title: 'Platform Super-Admin' },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = useCallback(async () => {
    const token = localStorage.getItem('tripro_token');
    if (!token) {
      setUser(null);
      setCurrentOrganization(null);
      setIsLoading(false);
      return;
    }

    try {
      const data = await api.auth.getMe();
      setUser(data.user);
      setCurrentOrganization(data.currentOrganization);
      if (data.currentOrganization?._id) {
        localStorage.setItem('tripro_active_org_id', data.currentOrganization._id);
      }
    } catch (err) {
      console.warn('Failed to restore user session:', err);
      // If error occurs, keep cached user if available
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Check if token exists, or auto-initialize with default demo user for seamless preview
    const token = localStorage.getItem('tripro_token');
    if (!token) {
      // Default to demo orgadmin for immediate evaluation
      const defaultDemo = DEMO_USERS[0];
      const demoToken = `dev-token-${defaultDemo.email.replace(/[@.]/g, '-')}:${defaultDemo.email}`;
      localStorage.setItem('tripro_token', demoToken);
    }
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const loginWithEmail = async (email: string, _password?: string) => {
    setIsLoading(true);
    try {
      // Set token for dev mode or Firebase token
      const token = `dev-token-${email.replace(/[@.]/g, '-')}:${email}`;
      localStorage.setItem('tripro_token', token);
      await fetchCurrentUser();
    } finally {
      setIsLoading(false);
    }
  };

  const signupWithEmail = async (email: string, displayName: string, _password?: string) => {
    setIsLoading(true);
    try {
      const token = `dev-token-${email.replace(/[@.]/g, '-')}:${email}`;
      localStorage.setItem('tripro_token', token);
      // Wait a moment for server auto-provisioning
      await fetchCurrentUser();
      if (displayName) {
        await api.auth.updateProfile({ displayName });
        await fetchCurrentUser();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    localStorage.removeItem('tripro_token');
    localStorage.removeItem('tripro_active_org_id');
    setUser(null);
    setCurrentOrganization(null);
  };

  const switchDemoRole = async (role: UserRole, email: string) => {
    setIsLoading(true);
    try {
      const token = `dev-token-${email.replace(/[@.]/g, '-')}:${email}`;
      localStorage.setItem('tripro_token', token);
      await fetchCurrentUser();
    } finally {
      setIsLoading(false);
    }
  };

  const switchOrganization = async (orgId: string) => {
    setIsLoading(true);
    try {
      await api.auth.switchOrg(orgId);
      localStorage.setItem('tripro_active_org_id', orgId);
      await fetchCurrentUser();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        currentOrganization,
        role: user?.role || null,
        isLoading,
        isAuthenticated: !!user,
        loginWithEmail,
        signupWithEmail,
        logout,
        switchDemoRole,
        refreshUser: fetchCurrentUser,
        switchOrganization,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
