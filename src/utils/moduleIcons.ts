import React from 'react';
import {
  BookOpen,
  Layers,
  Activity,
  Code2,
  Terminal,
  Cpu,
  Database,
  Network,
  Binary,
  Workflow,
  Sigma,
  Divide,
  Compass,
  Calculator,
  PieChart,
  TrendingUp,
  Zap,
  Flame,
  Waves,
  Atom,
  Orbit,
  FlaskConical,
  TestTube2,
  Microscope,
  Dna,
  HeartPulse,
  Leaf,
  Bug,
  Brain,
  BrainCircuit,
  FileText,
  Boxes,
  Sparkles,
  LayoutGrid,
  Lightbulb,
  BookMarked,
  LucideIcon
} from 'lucide-react';

// Deterministic rotation of icons for unmapped modules
const FALLBACK_ICON_POOL: LucideIcon[] = [
  BookOpen,
  Layers,
  Brain,
  Activity,
  Zap,
  Compass,
  Boxes,
  Sparkles,
  Lightbulb,
  FileText,
  BookMarked,
  LayoutGrid
];

/**
 * Resolves a contextually appropriate Lucide icon for any academic module
 * based on its ID, Title, or Course domain.
 */
export function getModuleIcon(moduleId?: string, moduleTitle?: string, index: number = 0): LucideIcon {
  const combined = `${moduleId || ''} ${moduleTitle || ''}`.toLowerCase();

  // Computer Science & Programming
  if (/(python|java|c\+\+|javascript|typescript|code|programming|syntax|compiler|software|oop|function|script)/.test(combined)) {
    return Code2;
  }
  if (/(terminal|cli|shell|bash|command|unix|linux)/.test(combined)) {
    return Terminal;
  }
  if (/(database|sql|dbms|nosql|query|relational|mongodb|table|rdbms|storage)/.test(combined)) {
    return Database;
  }
  if (/(network|packet|protocol|tcp|ip|osi|routing|socket|server|cloud|distributed|api|rest)/.test(combined)) {
    return Network;
  }
  if (/(algorithm|tree|graph|hash|stack|queue|array|sorting|searching|linked.*list|binary.*tree|data.*structure)/.test(combined)) {
    return Workflow;
  }
  if (/(cpu|microprocessor|architecture|logic.*gate|memory|cache|register|hardware|instruction|boolean)/.test(combined)) {
    return Cpu;
  }
  if (/(ai|artificial.*intelligence|machine.*learning|neural|deep.*learning|nlp|vision|model|intelligent)/.test(combined)) {
    return BrainCircuit;
  }

  // Mathematics & Statistics
  if (/(calculus|integral|derivative|differentiation|limit|differential.*equation|series|taylor)/.test(combined)) {
    return Sigma;
  }
  if (/(matrix|matrices|vector|linear.*algebra|determinant|transformation|eigen)/.test(combined)) {
    return Layers;
  }
  if (/(geometry|trigonometry|triangle|angle|coordinate|analytic|circle|plane)/.test(combined)) {
    return Compass;
  }
  if (/(statistic|probability|distribution|variance|deviation|bayes|regression|hypothesis|sampling)/.test(combined)) {
    return PieChart;
  }
  if (/(arithmetic|algebra|polynomial|equation|quadrat|inequal|fraction)/.test(combined)) {
    return Calculator;
  }
  if (/(discrete|combinatorics|permutation|proof|set.*theory|logic)/.test(combined)) {
    return Binary;
  }

  // Physics & Engineering
  if (/(motion|kinematics|dynamics|velocity|acceleration|projectile|force|newton|momentum|collision|friction)/.test(combined)) {
    return Activity;
  }
  if (/(energy|work|power|thermodynamics|heat|temperature|entropy|calorimetry|conduction)/.test(combined)) {
    return Flame;
  }
  if (/(electricity|circuit|current|voltage|resistor|capacit|ohm|magnet|induction|maxwell|electromagnet)/.test(combined)) {
    return Zap;
  }
  if (/(wave|sound|optics|light|reflection|refraction|interference|diffraction|lens|laser|frequency)/.test(combined)) {
    return Waves;
  }
  if (/(quantum|atom|nuclear|radioactiv|particle|photon|relativity|bohr|orbital)/.test(combined)) {
    return Atom;
  }
  if (/(gravit|orbit|planetary|satellite|astronomy|celestial)/.test(combined)) {
    return Orbit;
  }

  // Chemistry & Materials
  if (/(chemical|organic|inorganic|stoichiometry|reaction|catalyst|equilibrium|mole|bonding|kinetics)/.test(combined)) {
    return FlaskConical;
  }
  if (/(acid|base|ph|titration|buffer|electrochemistry|redox|solution|solubility)/.test(combined)) {
    return TestTube2;
  }

  // Biology & Life Sciences
  if (/(dna|rna|gene|genetics|heredity|chromosome|mutation|genomics|transcription|translation)/.test(combined)) {
    return Dna;
  }
  if (/(cell|cellular|mitosis|meiosis|membrane|organelle|cytology|respiration|photosynthesis)/.test(combined)) {
    return Microscope;
  }
  if (/(anatomy|physiology|heart|blood|circulation|nervous|brain|cardio|organ|muscle|system)/.test(combined)) {
    return HeartPulse;
  }
  if (/(plant|botany|ecology|ecosystem|biodiversity|photosynthesis|environment|evolution)/.test(combined)) {
    return Leaf;
  }
  if (/(microbe|bacteria|virus|pathogen|parasite|insect|microbiology)/.test(combined)) {
    return Bug;
  }

  // Business, Economics & Finance
  if (/(economic|finance|macro|micro|market|inflation|gdp|monetary|trade|cost|revenue|profit)/.test(combined)) {
    return TrendingUp;
  }

  // Deterministic fallback by hashing ID/title or using index
  if (moduleId || moduleTitle) {
    let hash = 0;
    const str = `${moduleId || ''}-${moduleTitle || ''}`;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    const idx = Math.abs(hash) % FALLBACK_ICON_POOL.length;
    return FALLBACK_ICON_POOL[idx];
  }

  return FALLBACK_ICON_POOL[index % FALLBACK_ICON_POOL.length];
}

/**
 * Strips numbering prefixes such as '1. ', 'Module 1: ', 'Chapter 1 - ' from module titles
 * and ensures a clean, readable display string.
 */
export function getCleanModuleTitle(title: string): string {
  if (!title) return '';

  // Remove patterns like '1. ', '01. ', 'Module 1: ', 'Module 1. ', 'Chapter 1 - ', 'Unit 1: '
  const cleaned = title
    .replace(/^(module|chapter|unit)\s*\d+[\s.:\-–—]+/i, '')
    .replace(/^\d+[\s.:\-–—]+/, '')
    .trim();

  return cleaned || title;
}
