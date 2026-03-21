import { UserProgress, Module } from '../types';

export interface Recommendation {
  type: 'new' | 'review' | 'mastery';
  moduleId: string;
  subTopicId: string;
  title: string;
  reason: string;
  priority: number;
}

export function getRecommendations(progress: UserProgress, syllabus: Module[]): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const now = new Date();
  let foundNextNew = false;

  syllabus.forEach(module => {
    module.subTopics.forEach(topic => {
      const mastery = progress.mastery?.[topic.id] || 0;
      const lastStudied = progress.topicLastStudied?.[topic.id];
      
      if (lastStudied) {
        const daysSince = (now.getTime() - new Date(lastStudied).getTime()) / (1000 * 60 * 60 * 24);
        
        // Spaced Repetition Logic
        if (mastery < 50 && daysSince > 1) {
          recommendations.push({
            type: 'review',
            moduleId: module.id,
            subTopicId: topic.id,
            title: topic.title,
            reason: `Struggling with this topic. It's been ${Math.floor(daysSince)} days.`,
            priority: 10
          });
        } else if (mastery >= 50 && mastery < 80 && daysSince > 3) {
          recommendations.push({
            type: 'review',
            moduleId: module.id,
            subTopicId: topic.id,
            title: topic.title,
            reason: `Refresh your memory. It's been ${Math.floor(daysSince)} days.`,
            priority: 8
          });
        } else if (mastery >= 80 && daysSince > 7) {
          recommendations.push({
            type: 'mastery',
            moduleId: module.id,
            subTopicId: topic.id,
            title: topic.title,
            reason: `Keep it fresh! It's been ${Math.floor(daysSince)} days.`,
            priority: 5
          });
        }
      } else if (!foundNextNew) {
        // This is the first unstudied topic
        recommendations.push({
          type: 'new',
          moduleId: module.id,
          subTopicId: topic.id,
          title: topic.title,
          reason: "Ready to learn something new?",
          priority: 9
        });
        foundNextNew = true;
      }
    });
  });

  // Sort by priority (descending) and take top 3
  return recommendations.sort((a, b) => b.priority - a.priority).slice(0, 3);
}
