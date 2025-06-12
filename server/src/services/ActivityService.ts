import mongoose from 'mongoose';
import { Activity, ActivitySession, DailySummary } from '../models/Activity';
import { ActivityEvent, UserStats } from '../types';

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

  // Session-based methods for new architecture
  async updateDailySummary(userId: string, sessionData: any): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      console.log('📈 Updating daily summary for user:', userId, 'session:', sessionData.sessionId);
      
      // Simply update the session count and total minutes without problematic MongoDB operators
      await DailySummary.findOneAndUpdate(
        { userId: new mongoose.Types.ObjectId(userId), date: today },
        {
          $inc: {
            totalMinutes: sessionData.summary?.totalMinutes || 0,
            sessionsCount: 1
          }
        },
        { upsert: true, new: true }
      );

      // Recalculate top languages and projects with proper aggregation
      await this.recalculateDailySummary(userId, today);
      
      console.log('✅ Daily summary updated successfully');
    } catch (error) {
      console.error('❌ Error updating daily summary:', error);
      throw error;
    }
  }

  private async recalculateDailySummary(userId: string, date: string): Promise<void> {
    try {
      const sessions = await ActivitySession.find({
        userId: new mongoose.Types.ObjectId(userId),
        startTime: {
          $gte: new Date(date + 'T00:00:00.000Z'),
          $lt: new Date(date + 'T23:59:59.999Z')
        }
      });

      const languageMap = new Map<string, number>();
      const projectMap = new Map<string, number>();
      let totalMinutes = 0;

      sessions.forEach(session => {
        totalMinutes += session.summary.totalMinutes;
        
        // Aggregate languages
        if (session.summary.languages) {
          session.summary.languages.forEach((minutes, language) => {
            languageMap.set(language, (languageMap.get(language) || 0) + minutes);
          });
        }
        
        // Aggregate projects
        if (session.summary.projects) {
          session.summary.projects.forEach((minutes, project) => {
            projectMap.set(project, (projectMap.get(project) || 0) + minutes);
          });
        }
      });

      // Convert to sorted arrays with percentages
      const topLanguages = Array.from(languageMap.entries())
        .map(([name, minutes]) => ({
          name,
          minutes,
          percentage: totalMinutes > 0 ? (minutes / totalMinutes) * 100 : 0
        }))
        .sort((a, b) => b.minutes - a.minutes)
        .slice(0, 5);

      const topProjects = Array.from(projectMap.entries())
        .map(([name, minutes]) => ({
          name,
          minutes,
          percentage: totalMinutes > 0 ? (minutes / totalMinutes) * 100 : 0
        }))
        .sort((a, b) => b.minutes - a.minutes)
        .slice(0, 5);

      await DailySummary.findOneAndUpdate(
        { userId: new mongoose.Types.ObjectId(userId), date },
        {
          totalMinutes,
          topLanguages,
          topProjects,
          sessionsCount: sessions.length,
          productivityScore: Math.min(100, Math.round(totalMinutes / 2.4)) // 240 minutes = 100%
        }
      );
    } catch (error) {
      console.error('Error recalculating daily summary:', error);
      throw error;
    }
  }

  aggregateActivities(activities: ActivityEvent[]): any {
    const summary = {
      totalMinutes: 0,
      filesWorked: new Set<string>(),
      languages: new Map<string, number>(),
      projects: new Map<string, number>(),
      saveCount: 0,
      editCount: 0,
      linesChanged: 0,
      charactersTyped: 0
    };

    let sessionStart = Date.now();
    let sessionEnd = Date.now();
    const sessionId = activities[0]?.sessionId || `batch_${Date.now()}`;

    activities.forEach(activity => {
      sessionStart = Math.min(sessionStart, activity.timestamp);
      sessionEnd = Math.max(sessionEnd, activity.timestamp);

      if (activity.file) {
        summary.filesWorked.add(activity.file);
      }

      if (activity.language) {
        const current = summary.languages.get(activity.language) || 0;
        const duration = activity.duration || 0;
        summary.languages.set(activity.language, current + duration / 60000);
      }

      if (activity.project) {
        const current = summary.projects.get(activity.project) || 0;
        const duration = activity.duration || 0;
        summary.projects.set(activity.project, current + duration / 60000);
      }

      if (activity.type === 'file_save') summary.saveCount++;
      if (activity.type === 'file_edit') summary.editCount++;
      if (activity.linesChanged) summary.linesChanged += activity.linesChanged;
      if (activity.charactersTyped) summary.charactersTyped += activity.charactersTyped;
      if (activity.duration) summary.totalMinutes += activity.duration / 60000;
    });

    return {
      sessionId,
      startTime: new Date(sessionStart),
      endTime: new Date(sessionEnd),
      duration: sessionEnd - sessionStart,
      summary: {
        totalMinutes: Math.round(summary.totalMinutes),
        filesWorked: Array.from(summary.filesWorked),
        languages: summary.languages,
        projects: summary.projects,
        saveCount: summary.saveCount,
        editCount: summary.editCount,
        linesChanged: summary.linesChanged,
        charactersTyped: summary.charactersTyped
      }
    };
  }

  async getDashboardData(userId: string, timeRange: string = 'today'): Promise<any> {
    try {
      const now = new Date();
      let startDate: Date;
      let endDate = new Date(now);

      switch (timeRange) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'today':
        default:
          startDate = new Date(now);
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
      }

      // Get sessions for the time range
      const sessions = await ActivitySession.find({
        userId: new mongoose.Types.ObjectId(userId),
        startTime: { $gte: startDate, $lte: endDate }
      }).sort({ startTime: -1 });

      // Get daily summaries
      const summaries = await DailySummary.find({
        userId: new mongoose.Types.ObjectId(userId),
        date: {
          $gte: startDate.toISOString().split('T')[0],
          $lte: endDate.toISOString().split('T')[0]
        }
      }).sort({ date: -1 });

      // Calculate aggregated stats
      const totalMinutes = sessions.reduce((sum, session) => sum + session.summary.totalMinutes, 0);
      const totalSessions = sessions.length;
      const filesWorked = new Set<string>();
      const languageMap = new Map<string, number>();
      const projectMap = new Map<string, number>();

      sessions.forEach(session => {
        session.summary.filesWorked.forEach(file => filesWorked.add(file));
        
        if (session.summary.languages) {
          session.summary.languages.forEach((minutes, language) => {
            languageMap.set(language, (languageMap.get(language) || 0) + minutes);
          });
        }
        
        if (session.summary.projects) {
          session.summary.projects.forEach((minutes, project) => {
            projectMap.set(project, (projectMap.get(project) || 0) + minutes);
          });
        }
      });

      // Get current activity status
      const activeSession = await ActivitySession.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        isActive: true,
        lastActivity: { $gte: new Date(Date.now() - 5 * 60 * 1000) }
      });

      return {
        // VSCode extension compatibility fields
        todayMinutes: Math.round(totalMinutes),
        currentFile: activeSession?.currentFile || null,
        activeProjects: Array.from(projectMap.keys()),
        
        // Dashboard fields
        summary: {
          totalMinutes: Math.round(totalMinutes),
          totalSessions,
          filesWorked: filesWorked.size,
          averageSessionTime: totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0,
          productivity: Math.min(100, Math.round(totalMinutes / 2.4)) // 240 minutes = 100%
        },
        languages: Array.from(languageMap.entries())
          .map(([name, minutes]) => ({
            name,
            minutes: Math.round(minutes),
            percentage: totalMinutes > 0 ? Math.round((minutes / totalMinutes) * 100) : 0
          }))
          .sort((a, b) => b.minutes - a.minutes)
          .slice(0, 10),
        projects: Array.from(projectMap.entries())
          .map(([name, minutes]) => ({
            name,
            minutes: Math.round(minutes),
            percentage: totalMinutes > 0 ? Math.round((minutes / totalMinutes) * 100) : 0
          }))
          .sort((a, b) => b.minutes - a.minutes)
          .slice(0, 10),
        recentSessions: sessions.slice(0, 10).map(session => ({
          sessionId: session.sessionId,
          startTime: session.startTime,
          endTime: session.endTime,
          duration: Math.round(session.summary.totalMinutes),
          currentFile: session.currentFile,
          currentProject: session.currentProject,
          filesWorked: session.summary.filesWorked.length
        })),
        dailyTrend: summaries.map(summary => ({
          date: summary.date,
          minutes: summary.totalMinutes,
          sessions: summary.sessionsCount,
          productivity: summary.productivityScore
        })),
        recentActivities: await this.getRecentActivity(userId, 20),
        currentActivity: activeSession ? {
          isActive: true,
          currentFile: activeSession.currentFile,
          currentProject: activeSession.currentProject,
          sessionStart: activeSession.startTime,
          lastActivity: activeSession.lastActivity
        } : {
          isActive: false
        }
      };
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      throw error;
    }
  }
}
