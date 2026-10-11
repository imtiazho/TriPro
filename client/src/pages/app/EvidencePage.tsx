import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { EvidenceDocument } from '../../types';
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Calendar,
  Search,
  Tag,
  ShieldCheck,
  FileCheck,
} from 'lucide-react';
import { Card, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';

export const EvidencePage: React.FC = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Upload Form State
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [tags, setTags] = useState('Audit Proof, Statutory');

  // Query Documents
  const { data: responseData, isLoading } = useQuery({
    queryKey: ['evidence', search],
    queryFn: () => api.evidence.list({ search: search || undefined }),
  });

  const documents: EvidenceDocument[] = responseData?.data || [];

  // Upload Mutation
  const uploadMutation = useMutation({
    mutationFn: (formData: FormData) => api.evidence.upload(formData),
    onSuccess: () => {
      toast.success('Evidence Uploaded', 'Document safely archived with access controls.');
      setIsUploadModalOpen(false);
      setFile(null);
      setDescription('');
      queryClient.invalidateQueries({ queryKey: ['evidence'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
    onError: (err: any) => {
      toast.error('Upload Error', err.response?.data?.error?.message || 'Failed to upload document.');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.evidence.delete(id),
    onSuccess: () => {
      toast.success('Document Removed', 'Evidence file archived.');
      queryClient.invalidateQueries({ queryKey: ['evidence'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
  });

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error('File Required', 'Please select a document to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    if (description) formData.append('description', description);
    if (expiryDate) formData.append('expiryDate', expiryDate);
    if (tags) formData.append('tags', tags);

    uploadMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 font-['Outfit'] flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-[#790D16]" /> Evidence Locker & Documents
          </h1>
          <p className="text-xs text-stone-600 mt-1">
            Access-controlled evidence repository for licenses, audit reports, and statutory receipts.
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={() => setIsUploadModalOpen(true)}>
          <Upload className="w-4 h-4 mr-1" /> Upload Evidence
        </Button>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search evidence by file name, tags, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-[#790D16] bg-stone-50/50"
            />
          </div>
        </CardContent>
      </Card>

      {/* Documents Grid / Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <LoadingSkeleton rows={5} />
            </div>
          ) : documents.length === 0 ? (
            <EmptyState
              title="No evidence documents uploaded yet"
              description="Upload verified documentation to attach proof to obligations, TPRM vendors, or HR records."
              actionLabel="Upload Evidence"
              onAction={() => setIsUploadModalOpen(true)}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F0] border-b border-stone-200 text-stone-600 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-5">Document Name</th>
                    <th className="py-3 px-4">Size & Format</th>
                    <th className="py-3 px-4">Uploaded By</th>
                    <th className="py-3 px-4">Expiry Date</th>
                    <th className="py-3 px-4">Tags</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium">
                  {documents.map((doc) => {
                    const isExpiringSoon =
                      doc.expiryDate &&
                      new Date(doc.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                    return (
                      <tr key={doc._id} className="hover:bg-stone-50/80 transition-colors">
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-[#FDF2F3] text-[#790D16] flex items-center justify-center flex-shrink-0">
                              <FileCheck className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-semibold text-stone-900 leading-tight">
                                {doc.originalName || doc.fileName}
                              </div>
                              {doc.description && (
                                <div className="text-[11px] text-stone-500 truncate max-w-xs">
                                  {doc.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-stone-600 font-mono text-[11px]">
                          {(doc.fileSize / 1024).toFixed(1)} KB · {doc.mimeType?.split('/')[1]?.toUpperCase() || 'FILE'}
                        </td>
                        <td className="py-3.5 px-4 text-stone-700">
                          {doc.uploadedBy?.displayName || 'Authorized User'}
                        </td>
                        <td className="py-3.5 px-4">
                          {doc.expiryDate ? (
                            <span
                              className={`font-mono text-[11px] font-semibold ${
                                isExpiringSoon ? 'text-amber-700' : 'text-stone-700'
                              }`}
                            >
                              {new Date(doc.expiryDate).toLocaleDateString()}
                              {isExpiringSoon && ' (Expiring)'}
                            </span>
                          ) : (
                            <span className="text-stone-400">None</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1">
                            {doc.tags?.slice(0, 2).map((t, i) => (
                              <Badge key={i} variant="sand" size="sm">
                                {t}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <a
                              href={api.evidence.download(doc._id)}
                              className="p-1.5 rounded-lg text-[#790D16] hover:bg-[#FDF2F3] transition-colors"
                              title="Download Securely"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                            <button
                              onClick={() => {
                                if (confirm(`Archive document ${doc.originalName}?`)) {
                                  deleteMutation.mutate(doc._id);
                                }
                              }}
                              className="p-1.5 rounded-lg text-stone-400 hover:text-red-700 hover:bg-red-50 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
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

      {/* Modal: Upload Evidence */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Verification Evidence"
        description="Attach supporting compliance documentation (PDF, images, Word, Excel, CSV)."
      >
        <form onSubmit={handleUpload} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-stone-700 mb-1">Select File</label>
            <input
              type="file"
              required
              onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
              className="w-full text-xs text-stone-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#790D16] file:text-white hover:file:bg-[#640E15] file:cursor-pointer"
            />
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Document Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Bangladesh Bank License Renewal or SOC 2 Attestation"
              className="w-full px-3 py-2 border border-stone-300 rounded-lg outline-none focus:ring-2 focus:ring-[#790D16]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Document Expiry Date</label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Category Tags (comma-separated)</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Audit, Security, NBR"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-stone-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsUploadModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={uploadMutation.isPending}>
              Upload & Encrypt
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
