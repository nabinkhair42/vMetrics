import { Activity } from '../models/Activity';
import { User } from '../models/User';
import { ActivityEvent, UserStats } from '../types';
import mongoose from 'mongoose';

export class ActivityService {
  async saveActivity(userId: string, event: ActivityEvent): Promise<void> {
    try {
      const activity = new Activity({
        userId: new mongoose.Types.ObjectId(userId),
        sessionId: event.sessionId,
        type: event.type,
        timestamp: new Date(event.timestamp),
        
        // File information
        file: event.file,
        fileName: event.fileName,
        fileExtension: event.fileExtension,
        language: event.language,
        relativePath: event.relativePath,
        
        // Project/Workspace information
        project: event.project,
        workspaceName: event.workspaceName,
        workspacePath: event.workspacePath,
        rootFolder: event.rootFolder,
        
        // Activity details
        duration: event.duration,
        linesChanged: event.linesChanged,
        charactersTyped: event.charactersTyped,
        isActive: event.isActive,
        
        // System information
        machineId: event.machineId,
        
        // Additional metadata
        metadata: event.metadata
      });

      await activity.save();
    } catch (error) {
      console.error('Error saving activity:', error);
      throw error;
    }
  }

  async getUserStats(userId: string): Promise<UserStats> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get today's activities
      const todayActivities = await Activity.find({
        userId: new mongoose.Types.ObjectId(userId),
        timestamp: { $gte: today, $lt: tomorrow }
      }).sort({ timestamp: 1 });

      // Get all activities for comprehensive stats
      const allActivities = await Activity.find({
        userId: new mongoose.Types.ObjectId(userId)
      }).sort({ timestamp: 1 });

      // Calculate today's stats
      let todayMinutes = 0;
      let currentFile: string | undefined;
      let currentProject: string | undefined;
      const activeProjects = new Set<string>();
      let totalSessions = 0;
      let totalCodingTime = 0;

      // Process today's activities
      for (const activity of todayActivities) {
        if (activity.project) {
          activeProjects.add(activity.project);
          currentProject = activity.project;
        }

        if (activity.type === 'file_open' && activity.file) {
          currentFile = activity.file;
        }

        if (activity.type === 'file_close' && activity.duration) {
          todayMinutes += Math.round(activity.duration / (1000 * 60));
        }

        if (activity.type === 'session_start') {
          totalSessions++;
        }
      }

      // Calculate total coding time from all activities
      for (const activity of allActivities) {
        if (activity.type === 'file_close' && activity.duration) {
          totalCodingTime += Math.round(activity.duration / (1000 * 60));
        }
      }

      // Get language stats
      const languageStats = await this.getLanguageStats(userId, 30);
      
      // Get daily stats for the past week
      const dailyStats = await this.getDailyStats(userId, 7);

      // Calculate weekly stats
      const weeklyTotalTime = dailyStats.reduce((sum, day) => sum + (day.totalMinutes || 0), 0);
      const weeklyAverage = dailyStats.length > 0 ? weeklyTotalTime / dailyStats.length : 0;
      
      // Find most productive day
      const mostProductiveDay = dailyStats.reduce((max, day) => 
        (day.totalMinutes || 0) > (max.totalMinutes || 0) ? day : max, 
        dailyStats[0] || { _id: new Date().toISOString().split('T')[0], totalMinutes: 0 }
      );

      // Calculate average session time
      const averageSessionTime = totalSessions > 0 ? totalCodingTime / totalSessions : 0;

      // Get most used language and project
      const mostUsedLanguage = languageStats.length > 0 ? languageStats[0].name : undefined;
      const mostActiveProject = activeProjects.size > 0 ? Array.from(activeProjects)[0] : undefined;

      // Check if currently active (last activity within 5 minutes)
      const lastActivity = allActivities[allActivities.length - 1];
      const lastActivityTime = lastActivity?.timestamp.getTime();
      const isCurrentlyActive = lastActivityTime ? (Date.now() - lastActivityTime) < 5 * 60 * 1000 : false;

      return {
        todayMinutes,
        totalCodingTime,
        currentFile,
        currentProject,
        activeProjects: Array.from(activeProjects),
        languageStats: languageStats.map(lang => ({
          language: lang.name,
          timeSpent: lang.minutes,
          filesWorked: 0, // TODO: Calculate from activities
          percentage: lang.percentage,
          linesChanged: 0 // TODO: Calculate from activities
        })),
        totalSessions,
        averageSessionTime,
        mostUsedLanguage,
        mostActiveProject,
        dailyStats: dailyStats.map(day => ({
          date: day._id,
          codingTime: Math.round(day.totalMinutes || 0),
          filesWorked: [], // TODO: Extract from aggregation
          languages: day.languages || [],
          projects: day.projects || [],
          sessions: day.sessionCount || 0
        })),
        weeklyStats: {
          totalTime: weeklyTotalTime,
          averageDaily: weeklyAverage,
          mostProductiveDay: mostProductiveDay._id,
          languageBreakdown: languageStats.map(lang => ({
            language: lang.name,
            timeSpent: lang.minutes,
            filesWorked: 0,
            percentage: lang.percentage
          })),
          projectBreakdown: [] // TODO: Get from project stats
        },
        isCurrentlyActive,
        lastActivityTime
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  }

  async getDailyStats(userId: string, days: number = 7): Promise<any[]> {
    try {
      const endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0);

      const pipeline = [
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            timestamp: { $gte: startDate, $lte: endDate },
            type: 'file_close',
            duration: { $exists: true }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$timestamp'
              }
            },
            totalMinutes: {
              $sum: { $divide: ['$duration', 60000] }
            },
            sessionCount: { $sum: 1 },
            projects: { $addToSet: '$project' },
            languages: { $addToSet: '$language' }
          }
        },
        {
          $sort: { _id: 1 as any }
        }
      ] as any[];

      return await Activity.aggregate(pipeline);
    } catch (error) {
      console.error('Error getting daily stats:', error);
      throw error;
    }
  }

  async getProjectStats(userId: string, days: number = 30): Promise<any[]> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const pipeline = [
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            timestamp: { $gte: startDate, $lte: endDate },
            type: 'file_close',
            duration: { $exists: true },
            project: { $exists: true, $ne: null }
          }
        },
        {
          $group: {
            _id: '$project',
            totalMinutes: {
              $sum: { $divide: ['$duration', 60000] }
            },
            sessionCount: { $sum: 1 },
            languages: { $addToSet: '$language' }
          }
        },
        {
          $sort: { totalMinutes: -1 as any }
        },
        {
          $limit: 10
        }
      ] as any[];

      return await Activity.aggregate(pipeline);
    } catch (error) {
      console.error('Error getting project stats:', error);
      throw error;
    }
  }

  async getLanguageStats(userId: string, days: number = 30): Promise<any[]> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const pipeline = [
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            timestamp: { $gte: startDate, $lte: endDate },
            type: 'file_close',
            duration: { $exists: true },
            language: { $exists: true, $ne: null }
          }
        },
        {
          $group: {
            _id: '$language',
            totalMinutes: {
              $sum: { $divide: ['$duration', 60000] }
            }
          }
        },
        {
          $sort: { totalMinutes: -1 as any }
        }
      ] as any[];

      const results = await Activity.aggregate(pipeline);
      const totalTime = results.reduce((sum, lang) => sum + lang.totalMinutes, 0);
      
      // Color palette for languages
      const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0'];
      
      return results.map((lang, index) => ({
        name: lang._id,
        minutes: Math.round(lang.totalMinutes),
        percentage: totalTime > 0 ? (lang.totalMinutes / totalTime) * 100 : 0,
        color: colors[index % colors.length]
      }));
    } catch (error) {
      console.error('Error getting language stats:', error);
      throw error;
    }
  }

  async getRecentActivity(userId: string, limit: number = 10): Promise<any[]> {
    try {
      const activities = await Activity.find({
        userId: new mongoose.Types.ObjectId(userId)
      })
      .sort({ timestamp: -1 })
      .limit(limit)
      .select('type timestamp file fileName project duration language');

      return activities.map(activity => ({
        timestamp: activity.timestamp.toISOString(),
        type: activity.type,
        file: activity.fileName || activity.file,
        project: activity.project,
        duration: activity.duration,
        language: activity.language
      }));
    } catch (error) {
      console.error('Error getting recent activity:', error);
      throw error;
    }
  }
}
