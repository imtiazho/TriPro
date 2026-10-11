import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { EmployeeComplianceRecord } from '../../types';
import {
  Users,
  Plus,
  CheckCircle2,
  XCircle,
  Award,
  Calendar,
  Briefcase,
  Search,
  BookOpen,
} from 'lucide-react';
import { Card, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';

export const HRCompliancePage: React.FC = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeComplianceRecord | null>(null);

  // Add Employee Form State
  const [newEmployee, setNewEmployee] = useState({
    employeeCode: `EMP-00${Math.floor(Math.random() * 90) + 10}`,
    fullName: '',
    email: '',
    department: 'Engineering',
    designation: 'Software Engineer',
    joiningDate: new Date().toISOString().split('T')[0],
  });

  // Query HR records
  const { data: responseData, isLoading } = useQuery({
    queryKey: ['hr-employees', { search, selectedDept }],
    queryFn: () =>
      api.hr.list({
        search: search || undefined,
        department: selectedDept || undefined,
      }),
  });

  const employees: EmployeeComplianceRecord[] = responseData?.data || [];

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => api.hr.create(data),
    onSuccess: () => {
      toast.success('Employee Profile Created', 'Preloaded with Bangladesh Labour Act 2006 statutory requirements.');
      setIsAddModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['hr-employees'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
  });

  // Toggle Statutory Checklist Mutation
  const toggleStatutoryMutation = useMutation({
    mutationFn: ({ empId, reqs }: { empId: string; reqs: any[] }) =>
      api.hr.update(empId, { statutoryRequirements: reqs }),
    onSuccess: (updated) => {
      toast.success('Statutory Verification Updated', 'Checklist status persisted to database.');
      setSelectedEmployee(updated);
      queryClient.invalidateQueries({ queryKey: ['hr-employees'] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 font-['Outfit'] flex items-center gap-2.5">
            <Users className="w-6 h-6 text-[#790D16]" /> HR Statutory Compliance
          </h1>
          <p className="text-xs text-stone-600 mt-1">
            Tracking employee statutory mandates, appointment records (BD Labour Act Sec 5/6), and mandatory training.
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> Add Employee Profile
        </Button>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by employee name, code, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-[#790D16] bg-stone-50/50"
            />
          </div>

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="text-xs border border-stone-200 rounded-lg px-3 py-2 bg-white text-stone-700 outline-none"
          >
            <option value="">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="People & Culture">People & Culture</option>
            <option value="Legal & Compliance">Legal & Compliance</option>
            <option value="Executive">Executive</option>
            <option value="Operations">Operations</option>
          </select>
        </CardContent>
      </Card>

      {/* Employees Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <LoadingSkeleton rows={5} />
            </div>
          ) : employees.length === 0 ? (
            <EmptyState
              title="No employee compliance profiles registered"
              description="Add your workforce to track statutory appointment letters, service books, and safety training."
              actionLabel="Add Employee Profile"
              onAction={() => setIsAddModalOpen(true)}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F0] border-b border-stone-200 text-stone-600 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-5">Employee Info</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Joining Date</th>
                    <th className="py-3 px-4">Statutory Adherence</th>
                    <th className="py-3 px-4">Trainings</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium">
                  {employees.map((emp) => {
                    const metCount = emp.statutoryRequirements?.filter((r) => r.isMet).length || 0;
                    const totalCount = emp.statutoryRequirements?.length || 5;
                    const isFullyCompliant = metCount === totalCount;

                    return (
                      <tr
                        key={emp._id}
                        onClick={() => setSelectedEmployee(emp)}
                        className="hover:bg-stone-50/80 transition-colors cursor-pointer group"
                      >
                        <td className="py-3.5 px-5">
                          <div className="font-semibold text-stone-900 group-hover:text-[#790D16] transition-colors leading-tight">
                            {emp.fullName}
                          </div>
                          <div className="text-[11px] text-stone-500 font-mono mt-0.5">
                            {emp.employeeCode} · {emp.email}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-stone-700">
                          {emp.department} · <span className="text-stone-500">{emp.designation}</span>
                        </td>
                        <td className="py-3.5 px-4 text-stone-600 font-mono text-[11px]">
                          {new Date(emp.joiningDate).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-stone-200 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  isFullyCompliant ? 'bg-emerald-600' : 'bg-amber-500'
                                }`}
                                style={{ width: `${(metCount / totalCount) * 100}%` }}
                              />
                            </div>
                            <span className="text-[11px] font-semibold text-stone-700">
                              {metCount}/{totalCount} Met
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 text-[11px] text-stone-700">
                            <Award className="w-3.5 h-3.5 text-[#790D16]" /> {emp.trainings?.length || 0} completed
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEmployee(emp);
                            }}
                            className="text-[#790D16] hover:underline font-semibold text-[11px]"
                          >
                            Checklist →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal: Employee Statutory Checklist Review */}
      <Modal
        isOpen={!!selectedEmployee}
        onClose={() => setSelectedEmployee(null)}
        title={selectedEmployee ? `${selectedEmployee.fullName} (${selectedEmployee.employeeCode})` : 'Checklist'}
        description="Verify and update statutory compliance items aligned with the Bangladesh Labour Act 2006."
      >
        {selectedEmployee && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-[#FAF7F0] rounded-xl border border-[#E5D3AF]">
              <div className="font-bold text-stone-900 text-sm">Labour Act 2006 Compliance Verification</div>
              <p className="text-[11px] text-stone-600 mt-0.5">
                Click any statutory item below to toggle verified status and update the audit log.
              </p>
            </div>

            <div className="space-y-2">
              {selectedEmployee.statutoryRequirements?.map((req, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    const updatedReqs = [...selectedEmployee.statutoryRequirements];
                    updatedReqs[idx] = {
                      ...updatedReqs[idx],
                      isMet: !updatedReqs[idx].isMet,
                      verifiedAt: !updatedReqs[idx].isMet ? new Date().toISOString() : undefined,
                    };
                    toggleStatutoryMutation.mutate({
                      empId: selectedEmployee._id,
                      reqs: updatedReqs,
                    });
                  }}
                  className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${
                    req.isMet
                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                      : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {req.isMet ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-stone-400 flex-shrink-0" />
                    )}
                    <span className="font-semibold">{req.name}</span>
                  </div>
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                      req.isMet ? 'bg-emerald-200/60 text-emerald-800' : 'bg-stone-200 text-stone-600'
                    }`}
                  >
                    {req.isMet ? 'Satisfied' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-3 border-t border-stone-100">
              <Button size="sm" variant="secondary" onClick={() => setSelectedEmployee(null)}>
                Done
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Add Employee Profile */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Employee Compliance Profile"
        description="Creates an employee compliance record preloaded with mandatory Labour Act statutory checklists."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate(newEmployee);
          }}
          className="space-y-4 text-xs"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Employee Code</label>
              <input
                type="text"
                required
                value={newEmployee.employeeCode}
                onChange={(e) => setNewEmployee({ ...newEmployee, employeeCode: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg outline-none font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Full Legal Name</label>
              <input
                type="text"
                required
                value={newEmployee.fullName}
                onChange={(e) => setNewEmployee({ ...newEmployee, fullName: e.target.value })}
                placeholder="e.g. Nusrat Jahan"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Work Email</label>
            <input
              type="email"
              required
              value={newEmployee.email}
              onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
              placeholder="nusrat@company.com"
              className="w-full px-3 py-2 border border-stone-300 rounded-lg outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Department</label>
              <input
                type="text"
                required
                value={newEmployee.department}
                onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Designation</label>
              <input
                type="text"
                required
                value={newEmployee.designation}
                onChange={(e) => setNewEmployee({ ...newEmployee, designation: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Joining Date</label>
            <input
              type="date"
              required
              value={newEmployee.joiningDate}
              onChange={(e) => setNewEmployee({ ...newEmployee, joiningDate: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg outline-none font-mono"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-stone-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={createMutation.isPending}>
              Create Profile
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
