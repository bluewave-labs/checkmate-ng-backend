import { Monitor, MonitorStats } from "@/db/models/index.js";

const SERVICE_NAME = "MonitorStatsServiceV2";
export interface IMonitorStatsService {
  cleanupOrphanedMonitorStats: () => Promise<boolean>;
}

class MonitorStatsService implements IMonitorStatsService {
  public SERVICE_NAME: string;
  constructor() {
    this.SERVICE_NAME = SERVICE_NAME;
  }

  async cleanupOrphanedMonitorStats() {
    try {
      const monitorIds = await Monitor.find().distinct("_id");
      const result = await MonitorStats.deleteMany({
        monitorId: { $nin: monitorIds },
      });
      console.log(`Deleted ${result.deletedCount} orphaned MonitorStats.`);
      return true;
    } catch (error) {
      console.error("Error cleaning up orphaned MonitorStats:", error);
      return false;
    }
  }
}

export default MonitorStatsService;
