import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BookOpen, Plus, Trash2, Edit3, Save, CheckCircle, AlertCircle, RefreshCw, Copy, Check } from 'lucide-react';
import { Formula, CourseId } from '../../types';
import { CourseService } from '../../services/courseService';
import { MAT103_FORMULAS, CHM101_FORMULAS, PHY101_FORMULAS } from '../../constants';
import MarkdownRenderer from '../MarkdownRenderer';

export default function FormulasManagerTab() {
  const [selectedCourse, setSelectedCourse] = useState<CourseId>('MAT103');
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [editingFormula, setEditingFormula] = useState<Formula | null>(null);

  const loadFormulas = async (courseId: CourseId) => {
    setLoading(true);
    try {
      const live = await CourseService.getFormulas(courseId);
      if (live && live.length > 0) {
        setFormulas(live);
      } else {
        // Fallback to initial seeds
        if (courseId === 'MAT103') setFormulas(MAT103_FORMULAS);
        else if (courseId === 'CHM101') setFormulas(CHM101_FORMULAS);
        else if (courseId === 'PHY101') setFormulas(PHY101_FORMULAS);
        else setFormulas([]);
      }
    } catch (e) {
      console.warn('Error loading formulas from Firestore:', e);
      if (courseId === 'MAT103') setFormulas(MAT103_FORMULAS);
      else if (courseId === 'CHM101') setFormulas(CHM101_FORMULAS);
      else if (courseId === 'PHY101') setFormulas(PHY101_FORMULAS);
      else setFormulas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFormulas(selectedCourse);
  }, [selectedCourse]);

  const handleSaveToFirestore = async () => {
    setSaving(true);
    setSaveStatus('idle');
    try {
      await CourseService.saveFormulas(selectedCourse, formulas);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (e) {
      console.error('Failed to save formulas:', e);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddNewFormula = () => {
    const newFormula: Formula = {
      id: `f_${Date.now()}`,
      title: 'New Equation',
      latex: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}',
      description: 'Standard formula definition for reference.',
      category: 'Algebra'
    };
    setEditingFormula(newFormula);
  };

  const handleSaveFormulaModal = () => {
    if (!editingFormula) return;
    const existingIdx = formulas.findIndex(f => f.id === editingFormula.id);
    let updated = [...formulas];
    if (existingIdx >= 0) {
      updated[existingIdx] = editingFormula;
    } else {
      updated.push(editingFormula);
    }
    setFormulas(updated);
    setEditingFormula(null);
  };

  const handleDeleteFormula = (id: string) => {
    if (!confirm('Are you sure you want to delete this formula?')) return;
    setFormulas(formulas.filter(f => f.id !== id));
  };

  return (
    <div className="space-y-6" id="formulas-manager-tab">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-800 p-6 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="text-indigo-600 dark:text-indigo-400" size={24} />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Formula Reference Repository</h2>
          </div>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Manage course-specific LaTeX mathematical equations, explanations, and categories.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleAddNewFormula}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm"
          >
            <Plus size={16} /> Add Formula
          </button>
          <button
            onClick={handleSaveToFirestore}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-zinc-100 rounded-xl font-semibold text-sm transition-colors shadow-sm disabled:opacity-50"
          >
            {saving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
            {saving ? 'Saving...' : 'Publish Course Formulas'}
          </button>
        </div>
      </div>

      {/* Course selector */}
      <div className="flex items-center gap-2">
        {(['MAT103', 'CHM101', 'PHY101', 'GST111', 'COS101'] as CourseId[]).map((cId) => (
          <button
            key={cId}
            onClick={() => setSelectedCourse(cId)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedCourse === cId
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-700'
            }`}
          >
            {cId}
          </button>
        ))}
      </div>

      {saveStatus === 'success' && (
        <div className="flex items-center gap-2 p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-xl text-sm font-medium">
          <CheckCircle size={18} />
          {formulas.length} formulas for {selectedCourse} saved to cloud database!
        </div>
      )}

      {saveStatus === 'error' && (
        <div className="flex items-center gap-2 p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-sm font-medium">
          <AlertCircle size={18} />
          Failed to publish formulas. Please verify Firestore rules.
        </div>
      )}

      {/* Formulas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {formulas.map((f) => (
          <div
            key={f.id}
            className="bg-white dark:bg-zinc-800 rounded-2xl border border-slate-200 dark:border-zinc-700 p-6 flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 rounded">
                    {f.category || 'General'}
                  </span>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white mt-1.5">{f.title}</h3>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditingFormula(f)}
                    className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteFormula(f.id)}
                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Formula LaTeX Preview */}
              <div className="my-3 p-3 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-100 dark:border-zinc-700 overflow-x-auto text-center">
                <MarkdownRenderer content={`$$${f.latex}$$`} />
              </div>

              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-2">{f.description}</p>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-zinc-700/60 flex items-center justify-between text-[11px] text-slate-400 dark:text-zinc-500 mt-4">
              <span>ID: {f.id}</span>
              <span className="font-mono text-[10px] truncate max-w-[120px]">{f.latex}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Formula Modal */}
      {editingFormula && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-zinc-800 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-zinc-700 shadow-2xl"
          >
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Edit Formula</h3>

            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Title</label>
                  <input
                    type="text"
                    value={editingFormula.title}
                    onChange={(e) => setEditingFormula({ ...editingFormula, title: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-600 rounded-lg bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Category</label>
                  <input
                    type="text"
                    value={editingFormula.category || ''}
                    onChange={(e) => setEditingFormula({ ...editingFormula, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-600 rounded-lg bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">LaTeX Code</label>
                <textarea
                  rows={3}
                  value={editingFormula.latex}
                  onChange={(e) => setEditingFormula({ ...editingFormula, latex: e.target.value })}
                  className="w-full px-3 py-2 font-mono text-xs border border-slate-300 dark:border-zinc-600 rounded-lg bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white"
                />
              </div>

              {/* Preview */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Render Preview</label>
                <div className="p-3 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-700 text-center">
                  <MarkdownRenderer content={`$$${editingFormula.latex}$$`} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  value={editingFormula.description || ''}
                  onChange={(e) => setEditingFormula({ ...editingFormula, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-600 rounded-lg bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-zinc-700">
              <button
                onClick={() => setEditingFormula(null)}
                className="px-4 py-2 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-700 rounded-xl text-sm font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveFormulaModal}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
              >
                Apply Changes
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
