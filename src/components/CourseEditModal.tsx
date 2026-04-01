import React, { useState } from 'react';
import { X, Save, Trash2, Edit2 } from 'lucide-react';
import { Course, Module, Department, Level, Semester, CourseScope } from '../types';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { DEPARTMENTS, LEVELS, SEMESTERS } from '../constants';

interface CourseEditModalProps {
  course: Course;
  onClose: () => void;
  onSave: () => void;
}

export default function CourseEditModal({ course, onClose, onSave }: CourseEditModalProps) {
  const [title, setTitle] = useState(course.title);
  const [description, setDescription] = useState(course.description);
  const [department, setDepartment] = useState<Department>(course.department || DEPARTMENTS[0]);
  const [level, setLevel] = useState<Level | undefined>(course.level);
  const [semester, setSemester] = useState<Semester | undefined>(course.semester);
  const [creditUnits, setCreditUnits] = useState<number>(course.creditUnits || 3);
  const [prerequisites, setPrerequisites] = useState<string>(course.prerequisites?.join(', ') || '');
  const [scope, setScope] = useState<CourseScope | undefined>(course.scope || 'GLOBAL');
  const [modules, setModules] = useState<Module[]>(course.syllabus);
  const [isSaving, setIsSaving] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const courseRef = doc(db, 'courses', course.id);
      await updateDoc(courseRef, {
        title,
        description,
        department: department || DEPARTMENTS[0],
        level,
        semester,
        creditUnits,
        prerequisites: prerequisites.split(',').map(p => p.trim()).filter(p => p),
        scope,
        syllabus: modules
      });
      onSave();
      onClose();
    } catch (error) {
      console.error("Error updating course:", error);
      alert("Failed to update course.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteModule = (moduleId: string) => {
    if (window.confirm('Are you sure you want to delete this module?')) {
      setModules(modules.filter(m => m.id !== moduleId));
    }
  };

  const handleAddModule = () => {
    const newModule: Module = {
      id: `module-${Date.now()}`,
      title: 'New Module',
      subTopics: []
    };
    setModules([...modules, newModule]);
    setEditingModuleId(newModule.id);
  };

  const handleUpdateModuleTitle = (moduleId: string, newTitle: string) => {
    setModules(modules.map(m => m.id === moduleId ? { ...m, title: newTitle } : m));
  };

  const handleAddSubTopic = (moduleId: string) => {
    setModules(modules.map(m => {
      if (m.id === moduleId) {
        return {
          ...m,
          subTopics: [
            ...m.subTopics,
            { id: `st-${Date.now()}`, title: 'New Subtopic', content: '' }
          ]
        };
      }
      return m;
    }));
  };

  const handleUpdateSubTopic = (moduleId: string, subTopicId: string, updates: Partial<{ title: string; content: string }>) => {
    setModules(modules.map(m => {
      if (m.id === moduleId) {
        return {
          ...m,
          subTopics: m.subTopics.map(st => st.id === subTopicId ? { ...st, ...updates } : st)
        };
      }
      return m;
    }));
  };

  const handleDeleteSubTopic = (moduleId: string, subTopicId: string) => {
    setModules(modules.map(m => {
      if (m.id === moduleId) {
        return {
          ...m,
          subTopics: m.subTopics.filter(st => st.id !== subTopicId)
        };
      }
      return m;
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-800 z-10">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Edit Course: {course.id}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Title</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Description</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full h-11 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value as Department)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-slate-900 dark:text-white"
              >
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Level</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as Level)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-slate-900 dark:text-white"
              >
                <option value="">Select Level</option>
                {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Semester</label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value as Semester)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-slate-900 dark:text-white"
              >
                <option value="">Select Semester</option>
                {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Scope</label>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value as CourseScope)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-slate-900 dark:text-white"
              >
                <option value="GLOBAL">Global</option>
                <option value="FACULTY">Faculty</option>
                <option value="DEPARTMENT">Department</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Credit Units</label>
              <input
                type="number"
                min="1"
                max="10"
                value={creditUnits}
                onChange={(e) => setCreditUnits(parseInt(e.target.value) || 3)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Prerequisites (Comma separated)</label>
              <input
                type="text"
                value={prerequisites}
                onChange={(e) => setPrerequisites(e.target.value)}
                placeholder="e.g. MTH101, PHY101"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-slate-900 dark:text-white"
              />
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Modules & Syllabus</h3>
              <button 
                onClick={handleAddModule}
                className="px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl text-sm font-bold hover:bg-emerald-200"
              >
                + Add Module
              </button>
            </div>

            <div className="space-y-4">
              {modules.map((module) => (
                <div key={module.id} className="bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="p-4 flex items-center gap-4 bg-slate-100 dark:bg-slate-800/50">
                    <input 
                      type="text"
                      value={module.title}
                      onChange={(e) => handleUpdateModuleTitle(module.id, e.target.value)}
                      className="flex-1 bg-transparent border-none focus:ring-0 font-bold text-slate-900 dark:text-white"
                    />
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setEditingModuleId(editingModuleId === module.id ? null : module.id)}
                        className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteModule(module.id)}
                        className="p-2 text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {editingModuleId === module.id && (
                    <div className="p-4 space-y-4 border-t border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Subtopics</h4>
                        <button 
                          onClick={() => handleAddSubTopic(module.id)}
                          className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                        >
                          + Add Subtopic
                        </button>
                      </div>
                      
                      <div className="space-y-4">
                        {module.subTopics.map((st) => (
                          <div key={st.id} className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                            <div className="flex items-center gap-3">
                              <input 
                                type="text"
                                value={st.title}
                                onChange={(e) => handleUpdateSubTopic(module.id, st.id, { title: e.target.value })}
                                className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1 text-sm font-medium"
                                placeholder="Subtopic Title"
                              />
                              <button 
                                onClick={() => handleDeleteSubTopic(module.id, st.id)}
                                className="text-red-400 hover:text-red-600"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                            <textarea 
                              value={st.content}
                              onChange={(e) => handleUpdateSubTopic(module.id, st.id, { content: e.target.value })}
                              className="w-full h-32 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm"
                              placeholder="Subtopic Content (Markdown supported)..."
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-slate-800 z-10">
          <button onClick={onClose} className="px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700">
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2"
          >
            {isSaving ? 'Saving...' : <><Save size={18} /> Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  );
}
