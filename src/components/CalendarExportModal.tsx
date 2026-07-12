import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Download, AlertCircle, CheckCircle2, ChevronRight, Info, HelpCircle } from 'lucide-react';
import { Assignment } from '../types';
import { 
  generateICalString, 
  downloadCalendarFile, 
  convertStudyPlanToEvents, 
  convertAssignmentsToEvents 
} from '../utils/ical';

interface CalendarExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'study-plan' | 'assignments';
  studyPlanData?: {
    title: string;
    dailySchedule: {
      day: string;
      focus: string;
      tasks: string[];
    }[];
  } | null;
  assignments?: Assignment[];
}

type Platform = 'google' | 'outlook' | 'apple';

export default function CalendarExportModal({ 
  isOpen, 
  onClose, 
  type, 
  studyPlanData, 
  assignments 
}: CalendarExportModalProps) {
  const [activePlatform, setActivePlatform] = useState<Platform>('google');
  const [hasExported, setHasExported] = useState(false);

  if (!isOpen) return null;

  const handleExport = () => {
    try {
      let icsContent = '';
      let filename = '';

      if (type === 'study-plan' && studyPlanData) {
        const events = convertStudyPlanToEvents(studyPlanData.dailySchedule);
        icsContent = generateICalString(events);
        filename = `${studyPlanData.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_schedule.ics`;
      } else if (type === 'assignments' && assignments) {
        const events = convertAssignmentsToEvents(assignments);
        icsContent = generateICalString(events);
        filename = 'uniace_assessment_deadlines.ics';
      }

      if (icsContent) {
        downloadCalendarFile(filename, icsContent);
        setHasExported(true);
        setTimeout(() => setHasExported(false), 3000);
      }
    } catch (err) {
      console.error('Error exporting calendar:', err);
    }
  };

  const getPlatformInstructions = () => {
    switch (activePlatform) {
      case 'google':
        return [
          'Download the universal .ics calendar file below.',
          'Open Google Calendar (calendar.google.com) in your web browser.',
          'Click the gear icon (⚙️) in the top right and select "Settings".',
          'In the left sidebar, click "Import & export".',
          'Select the downloaded file, choose your target calendar, and click "Import".'
        ];
      case 'outlook':
        return [
          'Download the universal .ics calendar file below.',
          'Open Outlook Calendar in your web browser or desktop app.',
          'Go to "Add Calendar" or "File" > "Open & Export" > "Import/Export".',
          'Choose "Upload from file" or "Import an iCalendar (.ics) file".',
          'Browse to select the downloaded .ics file and complete the wizard.'
        ];
      case 'apple':
        return [
          'Download the universal .ics calendar file below.',
          'On your Mac, double-click the downloaded .ics file.',
          'Your native Calendar app will launch automatically.',
          'Select the target calendar (e.g., Work or Personal) and click "OK" to import.',
          'On iPhone, open the downloaded file and tap "Add All" to sync instantly.'
        ];
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 pointer-events-none">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm pointer-events-auto"
          onClick={onClose}
        />

        {/* Modal panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] pointer-events-auto border border-zinc-200 dark:border-zinc-800"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-6 border-b border-zinc-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center text-amber-500">
                <Calendar size={24} />
              </div>
              <div>
                <h3 className="font-black text-zinc-900 dark:text-white text-lg tracking-tight">
                  {type === 'study-plan' ? 'Export Study Schedule' : 'Export Deadlines'}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                  {type === 'study-plan' ? 'Sync your AI Study Planner' : 'Sync upcoming assessment deadlines'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content Body */}
          <div className="p-8 overflow-y-auto space-y-6">
            {/* Why iCal is recommended box */}
            <div className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs uppercase tracking-wider">
                <Info size={16} />
                <span>Why iCal Integration?</span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
                We utilize the <strong>iCal (.ics) standard</strong> because it integrates natively and securely with all major digital calendars (Google, Outlook, Apple) without requesting access or permissions to your entire calendar account. It keeps your personal details fully private and offline-compatible.
              </p>
            </div>

            {/* Quick Summary of items being exported */}
            <div className="bg-zinc-50 dark:bg-zinc-800/40 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800">
              <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Items to export:</div>
              {type === 'study-plan' && studyPlanData ? (
                <div className="space-y-1">
                  <div className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{studyPlanData.title}</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    7 individual study events will be created dynamically with targeted daily goals.
                  </div>
                </div>
              ) : type === 'assignments' && assignments ? (
                <div className="space-y-1">
                  <div className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                    {assignments.length} Upcoming Deadlines
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    All-day reminders mapping out academic milestones and assessments.
                  </div>
                </div>
              ) : (
                <div className="text-sm text-red-500">No events found to export.</div>
              )}
            </div>

            {/* Platform instructions selector */}
            <div className="space-y-4">
              <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-xl">
                {(['google', 'outlook', 'apple'] as Platform[]).map((platform) => (
                  <button
                    key={platform}
                    onClick={() => setActivePlatform(platform)}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg capitalize transition-all ${
                      activePlatform === platform
                        ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                    }`}
                  >
                    {platform}
                  </button>
                ))}
              </div>

              {/* Instructions steps list */}
              <div className="bg-zinc-50/50 dark:bg-zinc-800/20 rounded-2xl p-6 border border-zinc-100 dark:border-zinc-800">
                <ol className="space-y-3">
                  {getPlatformInstructions().map((step, idx) => (
                    <li key={idx} className="flex gap-3 text-xs text-zinc-600 dark:text-zinc-400 font-medium leading-normal">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-[10px] text-zinc-700 dark:text-zinc-300 font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <span className="pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>

          {/* Footer controls */}
          <div className="px-8 py-6 bg-slate-50/50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-5 py-3 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold text-sm rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={hasExported}
              className={`px-6 py-3 rounded-xl font-bold text-sm shadow-lg transition-all flex items-center gap-2 ${
                hasExported 
                  ? 'bg-emerald-500 text-white shadow-emerald-500/20 scale-100'
                  : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:scale-105 shadow-zinc-900/10'
              }`}
            >
              {hasExported ? (
                <>
                  <CheckCircle2 size={18} />
                  Downloaded!
                </>
              ) : (
                <>
                  <Download size={18} />
                  Download .ics File
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
