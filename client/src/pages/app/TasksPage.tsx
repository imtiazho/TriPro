import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { ComplianceTask } from '../../types';
import {
  CheckSquare,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Calendar,
  User as UserIcon,
} from 'lucide-react';
import { Card, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';

export const TasksPage: React.FC = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [filterOverdue, setFilterOverdue] = useState<boolean>(false);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<ComplianceTask | null>(null);
  const [commentText, setCommentText] = useState('');

  // Add Task Form State
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  // Query Tasks
  const { data: responseData, isLoading } = useQuery({
    queryKey: ['tasks', { filterStatus, filterPriority, filterOverdue }],
    queryFn: () =>
      api.tasks.list({
        status: filterStatus || undefined,
        priority: filterPriority || undefined,
        isOverdue: filterOverdue ? 'true' : undefined,
      }),
  });

  const tasks: ComplianceTask[] = responseData?.data || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => api.tasks.create(data),
    onSuccess: () => {
      toast.success('Task Assigned', 'Compliance task created successfully.');
      setIsAddModalOpen(false);
      setNewTask({
        title: '',
        description: '',
        priority: 'medium',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.tasks.update(id, data),
    onSuccess: () => {
      toast.success('Task Updated', 'Task status / comment updated.');
      setSelectedTask(null);
      setCommentText('');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 font-['Outfit'] flex items-center gap-2.5">
            <CheckSquare className="w-6 h-6 text-[#790D16]" /> Tasks & Deadlines
          </h1>
          <p className="text-xs text-stone-600 mt-1">
            Operational action items linked to compliance obligations and recurring statutory schedules.
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> Create Task
        </Button>
      </div>

      {/* Filter Tabs */}
      <Card>
        <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setFilterStatus('');
                setFilterOverdue(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                !filterStatus && !filterOverdue
                  ? 'bg-[#790D16] text-white'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              All Tasks
            </button>
            <button
              onClick={() => {
                setFilterOverdue(true);
                setFilterStatus('');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterOverdue
                  ? 'bg-rose-700 text-white'
                  : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
              }`}
            >
              ⚠️ Overdue Only
            </button>
            <button
              onClick={() => {
                setFilterStatus('in_progress');
                setFilterOverdue(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterStatus === 'in_progress'
                  ? 'bg-sky-700 text-white'
                  : 'bg-sky-50 text-sky-800 border border-sky-200 hover:bg-sky-100'
              }`}
            >
              In Progress
            </button>
            <button
              onClick={() => {
                setFilterStatus('completed');
                setFilterOverdue(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterStatus === 'completed'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              Completed
            </button>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="text-xs border border-stone-200 rounded-lg px-2.5 py-1.5 bg-white text-stone-700 outline-none"
            >
              <option value="">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Task List */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <LoadingSkeleton rows={5} />
            </div>
          ) : tasks.length === 0 ? (
            <EmptyState
              title="No compliance tasks found"
              description="Create a new task to assign compliance operational responsibilities."
              actionLabel="Create Task"
              onAction={() => setIsAddModalOpen(true)}
            />
          ) : (
            <div className="divide-y divide-stone-100">
              {tasks.map((task) => {
                const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'completed';
                return (
                  <div
                    key={task._id}
                    onClick={() => setSelectedTask(task)}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-stone-50/80 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start gap-3.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateTaskMutation.mutate({
                            id: task._id,
                            data: { status: task.status === 'completed' ? 'in_progress' : 'completed' },
                          });
                        }}
                        className={`w-5 h-5 rounded border mt-0.5 flex items-center justify-center transition-colors ${
                          task.status === 'completed'
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-stone-300 hover:border-[#790D16]'
                        }`}
                      >
                        {task.status === 'completed' && <CheckCircle2 className="w-4 h-4" />}
                      </button>

                      <div>
                        <div
                          className={`text-sm font-semibold text-stone-900 ${
                            task.status === 'completed' ? 'line-through text-stone-400' : ''
                          }`}
                        >
                          {task.title}
                        </div>
                        {task.obligationId && (
                          <div className="text-[11px] text-stone-500 mt-0.5">
                            Linked: {task.obligationId.title}
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-1.5 text-[11px] text-stone-500">
                          <span className="flex items-center gap-1 font-mono">
                            <Calendar className="w-3 h-3" /> Due {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                          {isOverdue && (
                            <span className="font-bold text-rose-700 flex items-center gap-0.5">
                              ⚠️ Overdue
                            </span>
                          )}
                          {task.assignedTo && (
                            <span className="flex items-center gap-1 text-stone-700">
                              <UserIcon className="w-3 h-3" /> {task.assignedTo.displayName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge
                        variant={
                          task.priority === 'critical'
                            ? 'rose'
                            : task.priority === 'high'
                            ? 'amber'
                            : 'slate'
                        }
                        size="sm"
                      >
                        {task.priority}
                      </Badge>
                      <span className="text-[11px] px-2.5 py-1 rounded-full font-semibold capitalize bg-stone-100 text-stone-700">
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal: Task Detail & Comment Log */}
      <Modal
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        title={selectedTask?.title || 'Task Details'}
        description={`Due: ${selectedTask ? new Date(selectedTask.dueDate).toLocaleDateString() : ''}`}
      >
        {selectedTask && (
          <div className="space-y-4 text-xs">
            <div>
              <div className="font-semibold text-stone-700">Description</div>
              <p className="mt-1 p-3 bg-stone-50 rounded-lg border border-stone-200 text-stone-700">
                {selectedTask.description || 'No additional description provided.'}
              </p>
            </div>

            <div>
              <div className="font-semibold text-stone-700 mb-1.5">Update Status</div>
              <div className="flex gap-2">
                {['todo', 'in_progress', 'under_review', 'completed'].map((st) => (
                  <button
                    key={st}
                    onClick={() =>
                      updateTaskMutation.mutate({
                        id: selectedTask._id,
                        data: { status: st },
                      })
                    }
                    className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize border ${
                      selectedTask.status === st
                        ? 'bg-[#790D16] text-white border-[#790D16]'
                        : 'bg-white border-stone-200 text-stone-700'
                    }`}
                  >
                    {st.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="font-semibold text-stone-700 mb-1 flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5" /> Add Activity Log Comment
              </div>
              <textarea
                rows={2}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Log activity, upload note, or blockers..."
                className="w-full p-2.5 border border-stone-300 rounded-lg outline-none focus:ring-2 focus:ring-[#790D16]"
              />
              <div className="flex justify-end mt-2">
                <Button
                  size="sm"
                  variant="primary"
                  disabled={!commentText.trim()}
                  onClick={() =>
                    updateTaskMutation.mutate({
                      id: selectedTask._id,
                      data: { comment: commentText },
                    })
                  }
                >
                  Save Comment
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Create Task */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create Compliance Task"
        description="Assign a specific action item to ensure regulatory deadline fulfillment."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate(newTask);
          }}
          className="space-y-4 text-xs"
        >
          <div>
            <label className="block font-semibold text-stone-700 mb-1">Task Title</label>
            <input
              type="text"
              required
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              placeholder="e.g. Conduct Q3 Bangladesh Cyber Security Audit Review"
              className="w-full px-3 py-2 border border-stone-300 rounded-lg outline-none focus:ring-2 focus:ring-[#790D16]"
            />
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              placeholder="Instructions and requirements..."
              className="w-full px-3 py-2 border border-stone-300 rounded-lg outline-none focus:ring-2 focus:ring-[#790D16]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Priority</label>
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Deadline Date</label>
              <input
                type="date"
                required
                value={newTask.dueDate}
                onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg outline-none bg-white font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-stone-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={createMutation.isPending}>
              Create Task
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
