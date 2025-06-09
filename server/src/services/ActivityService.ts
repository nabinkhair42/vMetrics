import { Activity } from '../models/Activity';
import { User } from '../models/User';
import { ActivityEvent, UserStats } from '../types';
import mongoose from 'mongoose';

export class ActivityService {
  async saveActivity(userId: string, event: ActivityEvent): Promise<void> {
    try {
      const activity = new Activity({
        userId: new mongoose.Types.ObjectId(userId),
        type: event.type,
        timestamp: new Date(event.timestamp),
        file: event.file,
        language: event.language,
        project: event.project,
        machineId: event.machineId,
        duration: event.duration
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

      // Calculate total coding time for today
      let todayMinutes = 0;
      let currentFile: string | undefined;
      const activeProjects = new Set<string>();
      let totalSessions = 0;

      // Process activities to calculate time
      for (let i = 0; i < todayActivities.length; i++) {
        const activity = todayActivities[i];
        
        if (activity.project) {
          activeProjects.add(activity.project);
        }

        // Track current file from latest file_open event
        if (activity.type === 'file_open' && activity.file) {
          currentFile = activity.file;
        }

        // Calculate duration for file sessions
        if (activity.type === 'file_close' && activity.duration) {
          todayMinutes += Math.round(activity.duration / (1000 * 60));
        }

        // Count focus sessions
        if (activity.type === 'session_start') {
          totalSessions++;
        }
      }

      return {
        todayMinutes,
        currentFile,
        activeProjects: Array.from(activeProjects),
        totalSessions
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
}
