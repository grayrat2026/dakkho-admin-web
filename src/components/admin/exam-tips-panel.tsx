'use client';

import { useState, useEffect } from 'react';
import { apiGet, apiPut } from '@/lib/api-client';
import { Sparkles, Plus, Trash2, Save, Loader2, Brain, Clock, AlertTriangle, Coffee, ChevronDown, ChevronUp, Copy, ArrowUp, ArrowDown, RotateCcw, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Types ───

interface Strategy {
  title: string;
  description: string;
  tip: string;
}

interface TimeManagementTip {
  title: string;
  desc: string;
  priority: string;
}

interface CommonMistake {
  mistake: string;
  consequence: string;
  fix: string;
}

interface WellnessTip {
  title: string;
  desc: string;
  time: string;
}

interface TipsData {
  strategies: Strategy[];
  timeManagement: TimeManagementTip[];
  commonMistakes: CommonMistake[];
  wellness: WellnessTip[];
}

const EMPTY_TIPS: TipsData = {
  strategies: [],
  timeManagement: [],
  commonMistakes: [],
  wellness: [],
};

// ─── Component ───

export default function ExamTipsPanel() {
  const [tips, setTips] = useState<TipsData>(EMPTY_TIPS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isDefault, setIsDefault] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    strategies: true,
    timeManagement: false,
    commonMistakes: false,
    wellness: false,
  });

  // Fetch existing tips
  useEffect(() => {
    async function fetchTips() {
      try {
        const res = await apiGet<{ tips: TipsData; isDefault?: boolean }>('/exam-tips');
        setTips(res.tips || EMPTY_TIPS);
        setIsDefault(res.isDefault || false);
      } catch (err) {
        console.error('Failed to fetch exam tips:', err);
        setTips(EMPTY_TIPS);
      } finally {
        setLoading(false);
      }
    }
    fetchTips();
  }, []);

  // Save tips
  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await apiPut('/exam-tips', tips);
      setIsDefault(false);
      setMessage({ type: 'success', text: 'Exam tips saved successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Failed to save exam tips' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // ─── Strategy helpers ───
  const addStrategy = () => {
    setTips((prev) => ({
      ...prev,
      strategies: [...prev.strategies, { title: '', description: '', tip: '' }],
    }));
  };
  const updateStrategy = (index: number, field: keyof Strategy, value: string) => {
    setTips((prev) => {
      const updated = [...prev.strategies];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, strategies: updated };
    });
  };
  const removeStrategy = (index: number) => {
    setTips((prev) => ({
      ...prev,
      strategies: prev.strategies.filter((_, i) => i !== index),
    }));
  };
  const duplicateStrategy = (index: number) => {
    setTips((prev) => {
      const item = prev.strategies[index];
      const updated = [...prev.strategies];
      updated.splice(index + 1, 0, { ...item, title: item.title + ' (Copy)' });
      return { ...prev, strategies: updated };
    });
  };
  const moveStrategy = (index: number, direction: 'up' | 'down') => {
    setTips((prev) => {
      const arr = [...prev.strategies];
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= arr.length) return prev;
      [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
      return { ...prev, strategies: arr };
    });
  };

  // ─── Time Management helpers ───
  const addTimeManagement = () => {
    setTips((prev) => ({
      ...prev,
      timeManagement: [...prev.timeManagement, { title: '', desc: '', priority: 'Medium' }],
    }));
  };
  const updateTimeManagement = (index: number, field: keyof TimeManagementTip, value: string) => {
    setTips((prev) => {
      const updated = [...prev.timeManagement];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, timeManagement: updated };
    });
  };
  const removeTimeManagement = (index: number) => {
    setTips((prev) => ({
      ...prev,
      timeManagement: prev.timeManagement.filter((_, i) => i !== index),
    }));
  };
  const duplicateTimeManagement = (index: number) => {
    setTips((prev) => {
      const item = prev.timeManagement[index];
      const arr = [...prev.timeManagement];
      arr.splice(index + 1, 0, { ...item, title: item.title + ' (Copy)' });
      return { ...prev, timeManagement: arr };
    });
  };
  const moveTimeManagement = (index: number, direction: 'up' | 'down') => {
    setTips((prev) => {
      const arr = [...prev.timeManagement];
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= arr.length) return prev;
      [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
      return { ...prev, timeManagement: arr };
    });
  };

  // ─── Common Mistakes helpers ───
  const addCommonMistake = () => {
    setTips((prev) => ({
      ...prev,
      commonMistakes: [...prev.commonMistakes, { mistake: '', consequence: '', fix: '' }],
    }));
  };
  const updateCommonMistake = (index: number, field: keyof CommonMistake, value: string) => {
    setTips((prev) => {
      const updated = [...prev.commonMistakes];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, commonMistakes: updated };
    });
  };
  const removeCommonMistake = (index: number) => {
    setTips((prev) => ({
      ...prev,
      commonMistakes: prev.commonMistakes.filter((_, i) => i !== index),
    }));
  };
  const duplicateCommonMistake = (index: number) => {
    setTips((prev) => {
      const item = prev.commonMistakes[index];
      const arr = [...prev.commonMistakes];
      arr.splice(index + 1, 0, { ...item, mistake: item.mistake + ' (Copy)' });
      return { ...prev, commonMistakes: arr };
    });
  };
  const moveCommonMistake = (index: number, direction: 'up' | 'down') => {
    setTips((prev) => {
      const arr = [...prev.commonMistakes];
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= arr.length) return prev;
      [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
      return { ...prev, commonMistakes: arr };
    });
  };

  // ─── Wellness helpers ───
  const addWellness = () => {
    setTips((prev) => ({
      ...prev,
      wellness: [...prev.wellness, { title: '', desc: '', time: '' }],
    }));
  };
  const updateWellness = (index: number, field: keyof WellnessTip, value: string) => {
    setTips((prev) => {
      const updated = [...prev.wellness];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, wellness: updated };
    });
  };
  const removeWellness = (index: number) => {
    setTips((prev) => ({
      ...prev,
      wellness: prev.wellness.filter((_, i) => i !== index),
    }));
  };
  const duplicateWellness = (index: number) => {
    setTips((prev) => {
      const item = prev.wellness[index];
      const arr = [...prev.wellness];
      arr.splice(index + 1, 0, { ...item, title: item.title + ' (Copy)' });
      return { ...prev, wellness: arr };
    });
  };
  const moveWellness = (index: number, direction: 'up' | 'down') => {
    setTips((prev) => {
      const arr = [...prev.wellness];
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= arr.length) return prev;
      [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
      return { ...prev, wellness: arr };
    });
  };

  // Count total items
  const totalItems = tips.strategies.length + tips.timeManagement.length + tips.commonMistakes.length + tips.wellness.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
      </div>
    );
  }

  // Action buttons for each item
  const ItemActions = ({ index, total, onRemove, onDuplicate, onMoveUp, onMoveDown }: {
    index: number; total: number;
    onRemove: () => void; onDuplicate: () => void;
    onMoveUp: () => void; onMoveDown: () => void;
  }) => (
    <div className="flex items-center gap-1 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <button
        onClick={onMoveUp}
        disabled={index === 0}
        className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
        title="Move up"
      >
        <ArrowUp className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={onMoveDown}
        disabled={index === total - 1}
        className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
        title="Move down"
      >
        <ArrowDown className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={onDuplicate}
        className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-900/20 text-sky-500 flex items-center justify-center hover:bg-sky-100 dark:hover:bg-sky-900/30"
        title="Duplicate"
      >
        <Copy className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={onRemove}
        className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/30"
        title="Delete"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Exam Tips</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manage exam tips shown to students
              {isDefault && (
                <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-medium">
                  Default data — save to customize
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            {previewMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {previewMode ? 'Edit' : 'Preview'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold text-sm shadow-lg shadow-sky-500/20 hover:shadow-sky-500/40 transition-shadow disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Strategies', count: tips.strategies.length, icon: Brain, color: 'text-violet-500 bg-violet-50 dark:bg-violet-900/20' },
          { label: 'Time Mgmt', count: tips.timeManagement.length, icon: Clock, color: 'text-sky-500 bg-sky-50 dark:bg-sky-900/20' },
          { label: 'Mistakes', count: tips.commonMistakes.length, icon: AlertTriangle, color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' },
          { label: 'Wellness', count: tips.wellness.length, icon: Coffee, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' },
        ].map((stat) => (
          <div key={stat.label} className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div className={`w-9 h-9 rounded-lg ${stat.color} flex items-center justify-center`}>
              <stat.icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{stat.count}</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Message */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-3 rounded-xl text-sm font-medium ${
              message.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
            }`}
          >
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      {previewMode ? (
        /* Preview Mode — shows how it looks on student app */
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-violet-500" /> Study Strategies
            </h2>
            <div className="space-y-3">
              {tips.strategies.map((s, i) => (
                <div key={i} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                  <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{s.title || 'Untitled'}</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{s.description}</p>
                  {s.tip && <p className="text-xs text-sky-600 dark:text-sky-400 mt-1 italic">💡 {s.tip}</p>}
                </div>
              ))}
              {tips.strategies.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No strategies added</p>}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-sky-500" /> Time Management
            </h2>
            <div className="space-y-3">
              {tips.timeManagement.map((t, i) => (
                <div key={i} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-600 text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{t.title || 'Untitled'}</h4>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                        t.priority === 'High' ? 'bg-red-100 dark:bg-red-900/30 text-red-500' :
                        t.priority === 'Medium' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-500' :
                        'bg-sky-100 dark:bg-sky-900/30 text-sky-500'
                      }`}>{t.priority}</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{t.desc}</p>
                  </div>
                </div>
              ))}
              {tips.timeManagement.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No time management tips added</p>}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" /> Common Mistakes
            </h2>
            <div className="space-y-3">
              {tips.commonMistakes.map((m, i) => (
                <div key={i} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                  <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{m.mistake || 'Untitled'}</h4>
                  <p className="text-xs text-red-500 mt-1">Impact: {m.consequence}</p>
                  <p className="text-xs text-emerald-500 mt-1">Fix: {m.fix}</p>
                </div>
              ))}
              {tips.commonMistakes.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No common mistakes added</p>}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Coffee className="w-5 h-5 text-emerald-500" /> Wellness
            </h2>
            <div className="space-y-3">
              {tips.wellness.map((w, i) => (
                <div key={i} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{w.title || 'Untitled'}</h4>
                    {w.time && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-500 font-bold">{w.time}</span>}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{w.desc}</p>
                </div>
              ))}
              {tips.wellness.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No wellness tips added</p>}
            </div>
          </div>
        </div>
      ) : (
        /* Edit Mode */
        <>
          {/* Strategies Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button
              onClick={() => toggleSection('strategies')}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Brain className="w-5 h-5 text-violet-500" />
                <span className="font-semibold text-gray-900 dark:text-white">Study Strategies</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">{tips.strategies.length}</span>
              </div>
              {expandedSections.strategies ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            <AnimatePresence>
              {expandedSections.strategies && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 pt-0 space-y-4">
                    {tips.strategies.map((strategy, i) => (
                      <div key={i} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 space-y-3 relative group">
                        <ItemActions
                          index={i}
                          total={tips.strategies.length}
                          onRemove={() => removeStrategy(i)}
                          onDuplicate={() => duplicateStrategy(i)}
                          onMoveUp={() => moveStrategy(i, 'up')}
                          onMoveDown={() => moveStrategy(i, 'down')}
                        />
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-gray-400">#{i + 1}</span>
                        </div>
                        <input
                          value={strategy.title}
                          onChange={(e) => updateStrategy(i, 'title', e.target.value)}
                          placeholder="Strategy Title"
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-violet-400"
                        />
                        <textarea
                          value={strategy.description}
                          onChange={(e) => updateStrategy(i, 'description', e.target.value)}
                          placeholder="Description"
                          rows={2}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 outline-none focus:border-violet-400 resize-none"
                        />
                        <input
                          value={strategy.tip}
                          onChange={(e) => updateStrategy(i, 'tip', e.target.value)}
                          placeholder="Pro Tip (optional)"
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 outline-none focus:border-violet-400"
                        />
                      </div>
                    ))}
                    <button
                      onClick={addStrategy}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 text-sm font-medium hover:border-violet-400 hover:text-violet-500 transition-colors w-full justify-center"
                    >
                      <Plus className="w-4 h-4" /> Add Strategy
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Time Management Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button
              onClick={() => toggleSection('timeManagement')}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-sky-500" />
                <span className="font-semibold text-gray-900 dark:text-white">Time Management</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">{tips.timeManagement.length}</span>
              </div>
              {expandedSections.timeManagement ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            <AnimatePresence>
              {expandedSections.timeManagement && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 pt-0 space-y-4">
                    {tips.timeManagement.map((tip, i) => (
                      <div key={i} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 space-y-3 relative group">
                        <ItemActions
                          index={i}
                          total={tips.timeManagement.length}
                          onRemove={() => removeTimeManagement(i)}
                          onDuplicate={() => duplicateTimeManagement(i)}
                          onMoveUp={() => moveTimeManagement(i, 'up')}
                          onMoveDown={() => moveTimeManagement(i, 'down')}
                        />
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-gray-400">#{i + 1}</span>
                        </div>
                        <input
                          value={tip.title}
                          onChange={(e) => updateTimeManagement(i, 'title', e.target.value)}
                          placeholder="Tip Title"
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-sky-400"
                        />
                        <textarea
                          value={tip.desc}
                          onChange={(e) => updateTimeManagement(i, 'desc', e.target.value)}
                          placeholder="Description"
                          rows={2}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 outline-none focus:border-sky-400 resize-none"
                        />
                        <select
                          value={tip.priority}
                          onChange={(e) => updateTimeManagement(i, 'priority', e.target.value)}
                          className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 outline-none focus:border-sky-400"
                        >
                          <option value="High">High Priority</option>
                          <option value="Medium">Medium Priority</option>
                          <option value="Low">Low Priority</option>
                        </select>
                      </div>
                    ))}
                    <button
                      onClick={addTimeManagement}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 text-sm font-medium hover:border-sky-400 hover:text-sky-500 transition-colors w-full justify-center"
                    >
                      <Plus className="w-4 h-4" /> Add Time Management Tip
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Common Mistakes Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button
              onClick={() => toggleSection('commonMistakes')}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <span className="font-semibold text-gray-900 dark:text-white">Common Mistakes</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">{tips.commonMistakes.length}</span>
              </div>
              {expandedSections.commonMistakes ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            <AnimatePresence>
              {expandedSections.commonMistakes && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 pt-0 space-y-4">
                    {tips.commonMistakes.map((item, i) => (
                      <div key={i} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 space-y-3 relative group">
                        <ItemActions
                          index={i}
                          total={tips.commonMistakes.length}
                          onRemove={() => removeCommonMistake(i)}
                          onDuplicate={() => duplicateCommonMistake(i)}
                          onMoveUp={() => moveCommonMistake(i, 'up')}
                          onMoveDown={() => moveCommonMistake(i, 'down')}
                        />
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-gray-400">#{i + 1}</span>
                        </div>
                        <input
                          value={item.mistake}
                          onChange={(e) => updateCommonMistake(i, 'mistake', e.target.value)}
                          placeholder="Mistake"
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-amber-400"
                        />
                        <input
                          value={item.consequence}
                          onChange={(e) => updateCommonMistake(i, 'consequence', e.target.value)}
                          placeholder="Consequence / Impact"
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 outline-none focus:border-amber-400"
                        />
                        <input
                          value={item.fix}
                          onChange={(e) => updateCommonMistake(i, 'fix', e.target.value)}
                          placeholder="How to Fix"
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 outline-none focus:border-amber-400"
                        />
                      </div>
                    ))}
                    <button
                      onClick={addCommonMistake}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 text-sm font-medium hover:border-amber-400 hover:text-amber-500 transition-colors w-full justify-center"
                    >
                      <Plus className="w-4 h-4" /> Add Common Mistake
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Wellness Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button
              onClick={() => toggleSection('wellness')}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Coffee className="w-5 h-5 text-emerald-500" />
                <span className="font-semibold text-gray-900 dark:text-white">Wellness Tips</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">{tips.wellness.length}</span>
              </div>
              {expandedSections.wellness ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            <AnimatePresence>
              {expandedSections.wellness && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 pt-0 space-y-4">
                    {tips.wellness.map((tip, i) => (
                      <div key={i} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 space-y-3 relative group">
                        <ItemActions
                          index={i}
                          total={tips.wellness.length}
                          onRemove={() => removeWellness(i)}
                          onDuplicate={() => duplicateWellness(i)}
                          onMoveUp={() => moveWellness(i, 'up')}
                          onMoveDown={() => moveWellness(i, 'down')}
                        />
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-gray-400">#{i + 1}</span>
                        </div>
                        <input
                          value={tip.title}
                          onChange={(e) => updateWellness(i, 'title', e.target.value)}
                          placeholder="Tip Title"
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-emerald-400"
                        />
                        <textarea
                          value={tip.desc}
                          onChange={(e) => updateWellness(i, 'desc', e.target.value)}
                          placeholder="Description"
                          rows={2}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 outline-none focus:border-emerald-400 resize-none"
                        />
                        <input
                          value={tip.time}
                          onChange={(e) => updateWellness(i, 'time', e.target.value)}
                          placeholder="When (e.g. Night, All Day, Before Study)"
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 outline-none focus:border-emerald-400"
                        />
                      </div>
                    ))}
                    <button
                      onClick={addWellness}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 text-sm font-medium hover:border-emerald-400 hover:text-emerald-500 transition-colors w-full justify-center"
                    >
                      <Plus className="w-4 h-4" /> Add Wellness Tip
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  );
}
