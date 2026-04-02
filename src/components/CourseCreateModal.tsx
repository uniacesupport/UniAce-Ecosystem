import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { Course, Module, Department, Level, Semester, CourseScope } from '../types';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { DEPARTMENTS, LEVELS, SEMESTERS, FACULTIES } from '../constants';

interface CourseCreateModalProps {
  onClose: () => void;
  onSave: () => void;
}

export default function CourseCreateModal({ onClose, onSave }: CourseCreateModalProps) {
  const [id, setId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState<Department>(DEPARTMENTS[0]);
  const [level, setLevel] = useState<Level>('100');
  const [semester, setSemester] = useState<Semester>('1st Semester');
  const [creditUnits, setCreditUnits] = useState<number>(3);
  const [prerequisites, setPrerequisites] = useState<string>('');
  const [scope, setScope] = useState<CourseScope>('GLOBAL');
  const [selectedFaculties, setSelectedFaculties] = useState<string[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<Department[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!id || !title) {
      alert("Please provide at least a Course ID and Title.");
      return;
    }
    setIsSaving(true);
    try {
      const courseRef = doc(db, 'courses', id);
      await setDoc(courseRef, {
        id,
        title,
        description,
        department,
        level,
        semester,
        creditUnits,
        prerequisites: prerequisites.split(',').map(p => p.trim()).filter(p => p),
        scope,
        faculties: scope === 'FACULTY' ? selectedFaculties : [],
        departments: scope === 'DEPARTMENT' ? selectedDepartments : [],
        syllabus: modules,
        createdAt: new Date().toISOString()
      });
      onSave();
      onClose();
    } catch (error) {
      console.error("Error creating course:", error);
      alert("Failed to create course.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-800 z-10">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Create New Course</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Course ID (e.g., MTH101)</label>
              <input 
                type="text" 
                value={id}
                onChange={(e) => setId(e.target.value.toUpperCase())}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Title</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-slate-900 dark:text-white"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Description</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full h-24 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-slate-900 dark:text-white"
            />
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

          {scope === 'FACULTY' && (
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Select Faculties</label>
              <div className="grid grid-cols-2 gap-2">
                {FACULTIES.map(f => (
                  <label key={f} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors">
                    <input 
                      type="checkbox" 
                      checked={selectedFaculties.includes(f)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedFaculties([...selectedFaculties, f]);
                        else setSelectedFaculties(selectedFaculties.filter(sf => sf !== f));
                      }}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    {f}
                  </label>
                ))}
              </div>
            </div>
          )}

          {scope === 'DEPARTMENT' && (
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Select Departments</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
                {DEPARTMENTS.map(d => (
                  <label key={d} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors">
                    <input 
                      type="checkbox" 
                      checked={selectedDepartments.includes(d)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedDepartments([...selectedDepartments, d]);
                        else setSelectedDepartments(selectedDepartments.filter(sd => sd !== d));
                      }}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    {d}
                  </label>
                ))}
              </div>
            </div>
          )}
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
            {isSaving ? 'Creating...' : <><Save size={18} /> Create Course</>}
          </button>
        </div>
      </div>
    </div>
  );
}
