'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, ArrowLeft, Send, Paperclip, Clock, AlertTriangle,
  CheckCircle2, XCircle, MessageSquare, FileUp, ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { GlassCard } from '@/components/shared/GlassCard';
import { GradientButton } from '@/components/shared/GradientButton';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { useSupportTickets, useCreateSupportTicket, useSendSupportMessage } from '@/lib/api-hooks';
import { cn, relativeTime } from '@/lib/utils';
import { springEntrance } from '@/lib/animations';
import type { SupportTicket, SupportMessage } from '@/lib/types';

const statusBadge: Record<SupportTicket['status'], { label: string; color: string; icon: typeof Clock }> = {
  open: { label: 'Open', color: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800/30 dark:text-neutral-300', icon: Clock },
  'in-progress': { label: 'In Progress', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: AlertTriangle },
  resolved: { label: 'Resolved', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle2 },
  closed: { label: 'Closed', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400', icon: XCircle },
};

const priorityBadge: Record<SupportTicket['priority'], { label: string; color: string }> = {
  low: { label: 'Low', color: 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400' },
  medium: { label: 'Medium', color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
  high: { label: 'High', color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
  urgent: { label: 'Urgent', color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
};

type FilterStatus = 'all' | SupportTicket['status'];

export function Support() {
  const { data: ticketsData, loading, refetch } = useSupportTickets();
  const { mutate: createTicket, loading: submittingTicket } = useCreateSupportTicket();
  const { mutate: sendMessage, loading: sendingMessage } = useSendSupportMessage();

  const [view, setView] = useState<'list' | 'detail' | 'create'>('list');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [newMessage, setNewMessage] = useState('');

  // Create ticket form
  const [createForm, setCreateForm] = useState({
    category: '',
    subject: '',
    description: '',
    priority: 'medium' as SupportTicket['priority'],
  });

  const ticketsList = useMemo(() => ticketsData?.tickets || [], [ticketsData]);

  const filteredTickets = useMemo(() => {
    if (filterStatus === 'all') return ticketsList;
    return ticketsList.filter((t: any) => t.status === filterStatus);
  }, [filterStatus, ticketsList]);

  const handleTicketClick = (ticket: any) => {
    setSelectedTicket(ticket);
    setView('detail');
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;

    const result = await sendMessage({
      ticketId: selectedTicket.id,
      message: newMessage.trim(),
    });

    if (result) {
      toast.success('Message sent');
      setNewMessage('');
      // Update the local ticket messages
      const newMsg: any = {
        id: Date.now(),
        senderType: 'instructor',
        senderName: 'You',
        message: newMessage.trim(),
        attachments: [],
        createdAt: new Date().toISOString(),
      };
      if (selectedTicket.messages) {
        setSelectedTicket({
          ...selectedTicket,
          messages: [...selectedTicket.messages, newMsg],
        });
      }
      refetch();
    } else {
      toast.error('Failed to send message');
    }
  };

  const handleSubmitTicket = async () => {
    if (!createForm.subject || !createForm.description) return;

    const result = await createTicket({
      category: createForm.category,
      subject: createForm.subject,
      description: createForm.description,
      priority: createForm.priority,
    });

    if (result) {
      toast.success('Ticket created successfully');
      setView('list');
      setCreateForm({ category: '', subject: '', description: '', priority: 'medium' });
      refetch();
    } else {
      toast.error('Failed to create ticket');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton type="card" count={3} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-start justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground">
            Support <span className="gradient-text">Center</span>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Get help or report an issue</p>
        </div>
        {view === 'list' && (
          <GradientButton
            size="sm"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setView('create')}
          >
            New Ticket
          </GradientButton>
        )}
        {(view === 'detail' || view === 'create') && (
          <GradientButton
            size="sm"
            variant="ghost"
            icon={<ArrowLeft className="w-3.5 h-3.5" />}
            onClick={() => {
              setView('list');
              setSelectedTicket(null);
            }}
          >
            Back
          </GradientButton>
        )}
      </motion.div>

      <AnimatePresence mode="wait">
        {/* ============ TICKET LIST ============ */}
        {view === 'list' && (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            {/* Filter tabs */}
            <div className="flex items-center gap-1.5 premium-input p-1 overflow-x-auto">
              {(['all', 'open', 'in-progress', 'resolved', 'closed'] as FilterStatus[]).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={cn(
                    'relative px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors',
                    filterStatus === status ? 'text-white dark:text-black' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {filterStatus === status && (
                    <motion.div
                      layoutId="support-filter-indicator"
                      className="absolute inset-0 bg-gradient-to-r from-neutral-900 via-neutral-800 to-black dark:from-white dark:via-neutral-200 dark:to-white rounded-lg shadow-[0_4px_15px_rgba(0,0,0,0.1)]"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">
                    {status === 'all' ? 'All' : statusBadge[status]?.label || status}
                  </span>
                </button>
              ))}
            </div>

            {/* Ticket cards */}
            <div className="space-y-3">
              {filteredTickets.length === 0 ? (
                <GlassCard className="p-12 text-center">
                  <p className="text-muted-foreground">No support tickets found</p>
                </GlassCard>
              ) : (
                filteredTickets.map((ticket: any, i: number) => {
                  const sBadge = statusBadge[ticket.status as SupportTicket['status']] || statusBadge.open;
                  const pBadge = priorityBadge[ticket.priority as SupportTicket['priority']] || priorityBadge.medium;
                  return (
                    <motion.div
                      key={ticket.id || i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => handleTicketClick(ticket)}
                    >
                      <GlassCard hover className="p-4 cursor-pointer">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-mono font-bold text-muted-foreground">
                                {ticket.ticketId || ticket.id}
                              </span>
                              <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', sBadge.color)}>
                                {sBadge.label}
                              </span>
                              <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', pBadge.color)}>
                                {pBadge.label}
                              </span>
                            </div>
                            <p className="text-sm font-semibold text-foreground">{ticket.subject}</p>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                              {ticket.messages?.[ticket.messages.length - 1]?.message || ticket.description || ''}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <span className="text-[11px] text-muted-foreground">{relativeTime(ticket.updatedAt || ticket.createdAt)}</span>
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </div>
                      </GlassCard>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}

        {/* ============ TICKET DETAIL ============ */}
        {view === 'detail' && selectedTicket && (
          <motion.div
            key="detail"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            {/* Ticket header */}
            <GlassCard className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono font-bold text-muted-foreground">{selectedTicket.ticketId || selectedTicket.id}</span>
                <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', (statusBadge[selectedTicket.status as SupportTicket['status']] || statusBadge.open).color)}>
                  {(statusBadge[selectedTicket.status as SupportTicket['status']] || statusBadge.open).label}
                </span>
                <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', (priorityBadge[selectedTicket.priority as SupportTicket['priority']] || priorityBadge.medium).color)}>
                  {(priorityBadge[selectedTicket.priority as SupportTicket['priority']] || priorityBadge.medium).label}
                </span>
              </div>
              <h2 className="text-lg font-bold text-foreground">{selectedTicket.subject}</h2>
              <p className="text-sm text-muted-foreground mt-1">{selectedTicket.category}</p>
            </GlassCard>

            {/* Message thread */}
            <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
              {(selectedTicket.messages || []).map((msg: any, i: number) => {
                const isInstructor = msg.senderType === 'instructor';
                return (
                  <motion.div
                    key={msg.id || i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={cn('flex', isInstructor ? 'justify-end' : 'justify-start')}
                  >
                    <div
                      className={cn(
                        'max-w-[85%] rounded-2xl px-4 py-3',
                        isInstructor
                          ? 'bg-gradient-to-r from-neutral-900 via-neutral-800 to-black dark:from-white dark:via-neutral-200 dark:to-white text-white dark:text-black rounded-br-sm shadow-[0_4px_15px_rgba(0,0,0,0.1)]'
                          : 'bg-white/30 dark:bg-white/[0.03] backdrop-blur-sm border border-white/30 dark:border-white/[0.04] text-foreground rounded-bl-sm'
                      )}
                    >
                      <p className={cn(
                        'text-xs font-semibold mb-1',
                        isInstructor ? 'text-white/80 dark:text-black/60' : 'text-muted-foreground'
                      )}>
                        {msg.senderName}
                      </p>
                      <p className={cn(
                        'text-sm leading-relaxed',
                        isInstructor ? 'text-white dark:text-black' : 'text-foreground'
                      )}>
                        {msg.message}
                      </p>
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {msg.attachments.map((att: string, idx: number) => (
                            <span
                              key={idx}
                              className={cn(
                                'text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1',
                                isInstructor
                                  ? 'bg-white/20 dark:bg-black/10 text-white dark:text-black'
                                  : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800/30 dark:text-neutral-300'
                              )}
                            >
                              <Paperclip className="w-3 h-3" />
                              {att}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className={cn(
                        'text-[10px] mt-1.5',
                        isInstructor ? 'text-white/60 dark:text-black/40' : 'text-muted-foreground'
                      )}>
                        {relativeTime(msg.createdAt)}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Send message */}
            <GlassCard className="p-4">
              <div className="flex items-start gap-2">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 min-h-[80px] text-sm premium-input rounded-xl px-3 py-2 resize-none placeholder:text-muted-foreground/50"
                />
                <div className="flex flex-col gap-2">
                  <GradientButton
                    size="sm"
                    icon={<Send className="w-3.5 h-3.5" />}
                    onClick={handleSendMessage}
                    loading={sendingMessage}
                    disabled={!newMessage.trim()}
                  >
                    Send
                  </GradientButton>
                  <button className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground hover:bg-black/[0.03] dark:hover:bg-white/[0.03] hover:text-foreground transition-colors mx-auto">
                    <Paperclip className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* ============ CREATE TICKET ============ */}
        {view === 'create' && (
          <motion.div
            key="create"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <GlassCard className="p-6">
              <h3 className="text-lg font-bold gradient-text mb-4">Create New Ticket</h3>
              <div className="space-y-4">
                {/* Category */}
                <div>
                  <label className="text-sm font-semibold text-foreground block mb-1.5">Category</label>
                  <select
                    value={createForm.category}
                    onChange={(e) => setCreateForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-full text-sm premium-input rounded-xl px-4 py-2.5"
                  >
                    <option value="">Select a category</option>
                    <option value="Video Upload">Video Upload</option>
                    <option value="Payment">Payment</option>
                    <option value="Course Management">Course Management</option>
                    <option value="Profile">Profile</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Subject */}
                <div>
                  <label className="text-sm font-semibold text-foreground block mb-1.5">Subject</label>
                  <input
                    value={createForm.subject}
                    onChange={(e) => setCreateForm((f) => ({ ...f, subject: e.target.value }))}
                    placeholder="Enter the subject of your issue"
                    className="w-full text-sm premium-input rounded-xl px-4 py-2.5 placeholder:text-muted-foreground/50"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-sm font-semibold text-foreground block mb-1.5">Description</label>
                  <textarea
                    value={createForm.description}
                    onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Describe your issue in detail"
                    rows={5}
                    className="w-full text-sm premium-input rounded-xl px-4 py-2.5 resize-none placeholder:text-muted-foreground/50"
                  />
                </div>

                {/* Priority */}
                <div>
                  <label className="text-sm font-semibold text-foreground block mb-1.5">Priority</label>
                  <select
                    value={createForm.priority}
                    onChange={(e) => setCreateForm((f) => ({ ...f, priority: e.target.value as SupportTicket['priority'] }))}
                    className="w-full text-sm premium-input rounded-xl px-4 py-2.5"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                {/* File upload */}
                <div>
                  <label className="text-sm font-semibold text-foreground block mb-1.5">Attachments</label>
                  <div className="border-2 border-dashed border-white/30 dark:border-white/[0.04] rounded-xl p-8 text-center hover:border-neutral-400 hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-colors cursor-pointer">
                    <FileUp className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Drag files here or click to upload</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">PNG, JPG, PDF (max 5MB)</p>
                  </div>
                </div>

                <GradientButton
                  size="md"
                  icon={<Send className="w-4 h-4" />}
                  onClick={handleSubmitTicket}
                  disabled={!createForm.subject || !createForm.description}
                  loading={submittingTicket}
                >
                  Submit Ticket
                </GradientButton>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
