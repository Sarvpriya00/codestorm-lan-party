import { analyticsService } from './analyticsService';
import { leaderboardService } from './leaderboardService';

export class AnalyticsJobService {
  private intervalId: NodeJS.Timeout | null = null;
  private readonly UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes

  /**
   * Start the background analytics update job
   */
  start(): void {
    if (this.intervalId) {
      console.log('Analytics job is already running');
      return;
    }

    console.log('Starting analytics background job...');
    
    // Run immediately on start
    this.runAnalyticsUpdate();

    // Then run every UPDATE_INTERVAL
    this.intervalId = setInterval(() => {
      this.runAnalyticsUpdate();
    }, this.UPDATE_INTERVAL);

    console.log(`Analytics job started with ${this.UPDATE_INTERVAL / 1000}s interval`);
  }

  /**
   * Stop the background analytics update job
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Analytics background job stopped');
    }
  }

  /**
   * Run a single analytics update cycle
   */
  private async runAnalyticsUpdate(): Promise<void> {
    try {
      console.log('Running analytics and leaderboard update...');
      
      // Update analytics first
      const analyticsResults = await analyticsService.updateAllContestAnalytics();
      console.log(`Analytics updated for ${analyticsResults.length} contests`);
      
      // Update leaderboards
      const leaderboardResults = await leaderboardService.updateAllContestLeaderboards();
      console.log(`Leaderboards updated for ${leaderboardResults.length} contests`);
      
    } catch (error) {
      console.error('Error in analytics background job:', error);
    }
  }

  /**
   * Force run analytics update immediately
   */
  async forceUpdate(): Promise<void> {
    await this.runAnalyticsUpdate();
  }

  /**
   * Check if the job is currently running
   */
  isRunning(): boolean {
    return this.intervalId !== null;
  }
}

export const analyticsJobService = new AnalyticsJobService();