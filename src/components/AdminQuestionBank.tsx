import React, { useState } from 'react';
import { Upload, FileText, Plus, CheckCircle, Loader2, AlertCircle, Save, Trash2, Edit2 } from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { jsonrepair } from 'jsonrepair';

export default function AdminQuestionBank() {
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedQuestions, setExtractedQuestions] = useState<any[]>([]);
  const [courseCode, setCourseCode] = useState('');
  const [year, setYear] = useState('');
  const [semester, setSemester] = useState('');
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!courseCode || !year || !semester || !title) {
      setError('Please fill in Course Code, Year, Semester, and Title before uploading.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB.');
      return;
    }

    setIsExtracting(true);
    setError(null);
    setSuccess(null);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64Data = (reader.result as string).split(',')[1];
          const mimeType = file.type;

          const token = await auth.currentUser?.getIdToken();
          const response = await fetch('/api/admin/extract-questions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              pdfData: base64Data,
              mimeType,
              courseCode,
              year,
              semester
            })
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to extract questions');
          }

          const data = await response.json();
          const repairedJson = jsonrepair(data.text);
          const parsed = JSON.parse(repairedJson);
          
          if (parsed.questions && Array.isArray(parsed.questions)) {
            setExtractedQuestions(parsed.questions);
            setSuccess(`Successfully extracted ${parsed.questions.length} questions! Review them below.`);
          } else {
            throw new Error('Invalid format returned from AI');
          }
        } catch (err: any) {
          console.error(err);
          setError(err.message || 'An error occurred during extraction.');
        } finally {
          setIsExtracting(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during file reading.');
      setIsExtracting(false);
    }
  };

  const handleSaveToDatabase = async () => {
    if (extractedQuestions.length === 0) return;
    
    setIsExtracting(true);
    setError(null);
    
    try {
      // Create the Past Paper document
      const pastPaperData = {
        title,
        year,
        semester,
        courseCode,
        questions: extractedQuestions.map((q, idx) => ({
          ...q,
          id: `q${Date.now()}_${idx}`,
          type: 'multiple-choice'
        })),
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser?.uid
      };

      await addDoc(collection(db, 'past_papers'), pastPaperData);
      
      setSuccess('Past paper saved successfully to the database!');
      setExtractedQuestions([]);
      setTitle('');
      setCourseCode('');
      setYear('');
      setSemester('');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to save to database.');
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Magic PDF Importer</h2>
          <p className="text-slate-500 dark:text-slate-400">Upload a past exam PDF and let AI extract the questions.</p>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 p-4 rounded-2xl flex items-center gap-3">
          <AlertCircle size={20} />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 p-4 rounded-2xl flex items-center gap-3">
          <CheckCircle size={20} />
          <p>{success}</p>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Course Code</label>
            <input 
              type="text" 
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
              placeholder="e.g. MAT 103"
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Paper Title</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Summer Semester Examinations"
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Academic Year</label>
            <input 
              type="text" 
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="e.g. 2023/2024"
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Semester</label>
            <select 
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select Semester</option>
              <option value="First">First Semester</option>
              <option value="Second">Second Semester</option>
              <option value="Summer">Summer Semester</option>
            </select>
          </div>
        </div>

        <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-3xl p-12 text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors relative">
          <input 
            type="file" 
            accept="application/pdf,image/*" 
            onChange={handleFileUpload}
            disabled={isExtracting}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />
          <div className="flex flex-col items-center justify-center pointer-events-none">
            {isExtracting ? (
              <>
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Analyzing Document...</h3>
                <p className="text-slate-500 dark:text-slate-400 mt-2">The AI is reading the exam and extracting questions.</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mb-4">
                  <Upload size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Upload Past Paper PDF</h3>
                <p className="text-slate-500 dark:text-slate-400 mt-2">Drag and drop or click to browse (Max 10MB)</p>
              </>
            )}
          </div>
        </div>
      </div>

      {extractedQuestions.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="text-indigo-500" />
              Extracted Questions ({extractedQuestions.length})
            </h3>
            <button 
              onClick={handleSaveToDatabase}
              disabled={isExtracting}
              className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {isExtracting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Save to Database
            </button>
          </div>
          
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {extractedQuestions.map((q, idx) => (
              <div key={idx} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-bold text-slate-900 dark:text-white text-lg">
                    <span className="text-indigo-500 mr-2">Q{idx + 1}.</span>
                    {q.question}
                  </h4>
                  <button 
                    onClick={() => setExtractedQuestions(prev => prev.filter((_, i) => i !== idx))}
                    className="text-slate-400 hover:text-rose-500 transition-colors p-2"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 pl-8">
                  {q.options.map((opt: string, oIdx: number) => (
                    <div 
                      key={oIdx} 
                      className={`p-3 rounded-xl border ${opt === q.correctAnswer ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-medium' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}
                    >
                      <span className="font-bold mr-2">{String.fromCharCode(65 + oIdx)}.</span> {opt}
                    </div>
                  ))}
                </div>
                
                <div className="pl-8 space-y-2">
                  <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 p-3 rounded-xl text-sm">
                    <strong>Explanation:</strong> {q.explanation}
                  </div>
                  {q.hint && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 p-3 rounded-xl text-sm">
                      <strong>Hint:</strong> {q.hint}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
