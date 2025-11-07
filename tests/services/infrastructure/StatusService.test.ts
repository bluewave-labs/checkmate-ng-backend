import mongoose from "mongoose";
import type { IMonitor, IMonitorStats } from "@/db/models/index";
import { Monitor, MonitorStats } from "@/db/models/index.js";

import type { StatusChangeResult } from "@/services/infrastructure/StatusService";
import { StatusResponse } from "@/services/infrastructure/NetworkService";
// @ts-ignore
import StatusService from "@/services/infrastructure/StatusService";
import ApiError from "@/utils/ApiError";

describe("StatusService", () => {
  let statusService: StatusService;
  let mockMonitor: IMonitor;
  let mockMonitorStats: IMonitorStats;
  beforeEach(() => {
    statusService = new StatusService();
    mockMonitor = new Monitor({
      teamId: new mongoose.Types.ObjectId(),
      orgId: new mongoose.Types.ObjectId(),
      name: "Test Monitor",
      url: "https://example.com",
      type: "http",
      interval: 60000,
      isActive: true,
      n: 3,
      updatedBy: new mongoose.Types.ObjectId(),
      createdBy: new mongoose.Types.ObjectId(),
    }) as IMonitor;
    mockMonitor.save = jest.fn().mockResolvedValue(mockMonitor);

    statusService = new StatusService();

    mockMonitorStats = new MonitorStats({
      monitorId: mockMonitor._id,
      totalChecks: 0,
      totalUpChecks: 0,
      totalDownChecks: 0,
      avgResponseTime: 0,
      currentStreak: 0,
      currentStreakStatus: "up",
      currentStreakStartedAt: Date.now(),
      lastCheckTimestamp: Date.now(),
      timeOfLastFailure: Date.now(),
    });
  });

  describe("updateMonitorStatus", () => {
    it("should initialize status if monitor is initializing (up)", async () => {
      const monitor = mockMonitor;
      monitor.status = "initializing";
      monitor.type = "http";
      const statusResponse: StatusResponse = {
        monitorId: monitor._id.toString(),
        teamId: monitor.teamId.toString(),
        type: monitor.type,
        status: "up",
        responseTime: 120,
        message: "OK",
      };

      const [updated, changed]: StatusChangeResult =
        await statusService.updateMonitorStatus(monitor, statusResponse);

      expect(changed).toBe(true);
      expect(updated.status).toBe("up");
      expect(updated.latestChecks).toHaveLength(1);
      expect(monitor.save).toHaveBeenCalled();
    });
    it("should initialize status if monitor is initializing (down)", async () => {
      const monitor = mockMonitor;
      monitor.status = "initializing";
      monitor.type = "http";
      const statusResponse: StatusResponse = {
        monitorId: monitor._id.toString(),
        teamId: monitor.teamId.toString(),
        type: monitor.type,
        status: "down",
        responseTime: 120,
        message: "OK",
      };

      const [updated, changed]: StatusChangeResult =
        await statusService.updateMonitorStatus(monitor, statusResponse);

      expect(changed).toBe(true);
      expect(updated.status).toBe("down");
      expect(updated.latestChecks).toHaveLength(1);
      expect(monitor.save).toHaveBeenCalled();
    });

    it("should initialize shift checks", async () => {
      const monitor = mockMonitor;
      monitor.latestChecks = Array.from({ length: 25 }, () => ({
        status: "down",
        responseTime: 200,
        checkedAt: new Date(),
      }));
      monitor.status = "initializing";
      monitor.type = "http";
      const statusResponse: StatusResponse = {
        monitorId: monitor._id.toString(),
        teamId: monitor.teamId.toString(),
        type: monitor.type,
        status: "up",
        responseTime: 120,
        message: "OK",
      };

      const [updated, changed]: StatusChangeResult =
        await statusService.updateMonitorStatus(monitor, statusResponse);

      expect(changed).toBe(true);
      expect(updated.status).toBe("up");
      expect(updated.latestChecks).toHaveLength(25);
      expect(monitor.save).toHaveBeenCalled();
    });

    it("should return early in UP state if not enough checks", async () => {
      const monitor = mockMonitor;
      monitor.latestChecks = [];
      monitor.status = "up";
      monitor.type = "http";
      const statusResponse: StatusResponse = {
        monitorId: monitor._id.toString(),
        teamId: monitor.teamId.toString(),
        type: monitor.type,
        status: "up",
        responseTime: 120,
        message: "OK",
      };

      const [updated, changed]: StatusChangeResult =
        await statusService.updateMonitorStatus(monitor, statusResponse);

      expect(updated.status).toBe("up");
      expect(updated.latestChecks).toHaveLength(1);
      expect(changed).toBe(false);
    });

    it("initializes monitor.latestChecks when undefined and pushes the new check", async () => {
      const service = new StatusService();

      const statusResponse: StatusResponse = {
        monitorId: mockMonitor._id.toString(),
        teamId: mockMonitor.teamId.toString(),
        type: mockMonitor.type,
        status: "up",
        responseTime: 120,
        message: "OK",
      };

      // @ts-ignore
      mockMonitor.latestChecks = undefined;

      const [updatedMonitor, changed] = await service.updateMonitorStatus(
        mockMonitor,
        statusResponse
      );

      expect(Array.isArray(updatedMonitor.latestChecks)).toBe(true);
      expect(updatedMonitor.latestChecks.length).toBe(1);
      expect(updatedMonitor.latestChecks[0]).toMatchObject({
        status: "up",
        responseTime: 120,
        checkedAt: expect.any(Date),
      });
      expect(updatedMonitor.status).toBe("up");
      expect(changed).toBe(true);
      expect(mockMonitor.save).toHaveBeenCalled();
    });
  });

  it("should change status if all latest checks are different", async () => {
    const monitor = mockMonitor;
    monitor.status = "up";
    monitor.latestChecks = Array.from({ length: 25 }, () => ({
      status: "down",
      responseTime: 200,
      checkedAt: new Date(),
    }));
    monitor.type = "http";
    const statusResponse: StatusResponse = {
      monitorId: monitor._id.toString(),
      teamId: monitor.teamId.toString(),
      type: monitor.type,
      status: "down",
      responseTime: 120,
      message: "OK",
    };

    const [updated, changed]: StatusChangeResult =
      await statusService.updateMonitorStatus(monitor, statusResponse);

    expect(changed).toBe(true);
    expect(updated.status).toBe("down");
    expect(monitor.save).toHaveBeenCalled();
  });

  describe("calculateAvgResponseTime", () => {
    it("should calculate average response time correctly", () => {
      const stats = {
        totalChecks: 5,
        avgResponseTime: 200,
      } as any;
      const statusResponse: StatusResponse = {
        monitorId: new mongoose.Types.ObjectId().toString(),
        teamId: new mongoose.Types.ObjectId().toString(),
        type: "http",
        status: "up",
        responseTime: 100,
        message: "OK",
      };

      const newAvg = statusService.calculateAvgResponseTime(
        stats,
        statusResponse
      );

      expect(newAvg).toBe(180);
    });

    it("should return current response time if response time if avg response time is 0", () => {
      const stats = {
        totalChecks: 5,
        avgResponseTime: 0,
      } as any;
      const statusResponse: StatusResponse = {
        monitorId: new mongoose.Types.ObjectId().toString(),
        teamId: new mongoose.Types.ObjectId().toString(),
        type: "http",
        status: "up",
        responseTime: 100,
        message: "OK",
      };

      const newAvg = statusService.calculateAvgResponseTime(
        stats,
        statusResponse
      );

      expect(newAvg).toBe(100);
    });
  });
  describe("StatusService.updateMonitorStats", () => {
    beforeEach(() => {});

    afterEach(() => {
      jest.clearAllMocks();
    });

    it("throws if MonitorStats not found", async () => {
      const statusResponse: StatusResponse = {
        monitorId: mockMonitor._id.toString(),
        teamId: mockMonitor.teamId.toString(),
        type: mockMonitor.type,
        status: "down",
        responseTime: 120,
        message: "OK",
      };

      MonitorStats.findOne = jest.fn().mockResolvedValue(null);
      try {
        await statusService.updateMonitorStats(
          mockMonitor,
          statusResponse,
          false
        );
      } catch (e: any) {
        expect(e).toBeInstanceOf(ApiError);
        expect(e.message).toBe("MonitorStats not found");
        expect(e.status).toBe(500);
      }
    });
    it("Should increment up count on up response", async () => {
      const statusResponse: StatusResponse = {
        monitorId: mockMonitor._id.toString(),
        teamId: mockMonitor.teamId.toString(),
        type: mockMonitor.type,
        status: "up",
        responseTime: 120,
        message: "OK",
      };

      mockMonitorStats.save = jest.fn().mockResolvedValue(mockMonitorStats);
      MonitorStats.findOne = jest.fn().mockResolvedValue(mockMonitorStats);
      const result = await statusService.updateMonitorStats(
        mockMonitor,
        statusResponse,
        false
      );

      expect(result.totalChecks).toBe(1);
      expect(result.totalUpChecks).toBe(1);
      expect(mockMonitorStats.save).toHaveBeenCalled();
    });
  });
  it("Should increment down count on down response", async () => {
    const statusResponse: StatusResponse = {
      monitorId: mockMonitor._id.toString(),
      teamId: mockMonitor.teamId.toString(),
      type: mockMonitor.type,
      status: "down",
      responseTime: 120,
      message: "OK",
    };

    mockMonitorStats.save = jest.fn().mockResolvedValue(mockMonitorStats);
    MonitorStats.findOne = jest.fn().mockResolvedValue(mockMonitorStats);
    const result = await statusService.updateMonitorStats(
      mockMonitor,
      statusResponse,
      false
    );

    expect(result.totalChecks).toBe(1);
    expect(result.totalDownChecks).toBe(1);
    expect(mockMonitorStats.save).toHaveBeenCalled();
  });
  it("Should increment down count on down response", async () => {
    const statusResponse: StatusResponse = {
      monitorId: mockMonitor._id.toString(),
      teamId: mockMonitor.teamId.toString(),
      type: mockMonitor.type,
      status: "down",
      responseTime: 120,
      message: "OK",
    };

    mockMonitorStats.save = jest.fn().mockResolvedValue(mockMonitorStats);
    MonitorStats.findOne = jest.fn().mockResolvedValue(mockMonitorStats);
    const result = await statusService.updateMonitorStats(
      mockMonitor,
      statusResponse,
      false
    );

    expect(result.totalChecks).toBe(1);
    expect(result.totalDownChecks).toBe(1);
    expect(mockMonitorStats.save).toHaveBeenCalled();
  });
  it("Should reset streak on status change", async () => {
    const statusResponse: StatusResponse = {
      monitorId: mockMonitor._id.toString(),
      teamId: mockMonitor.teamId.toString(),
      type: mockMonitor.type,
      status: "down",
      responseTime: 120,
      message: "OK",
    };

    mockMonitorStats.save = jest.fn().mockResolvedValue(mockMonitorStats);
    mockMonitorStats.currentStreak = 5;
    MonitorStats.findOne = jest.fn().mockResolvedValue(mockMonitorStats);
    const result = await statusService.updateMonitorStats(
      mockMonitor,
      statusResponse,
      true
    );

    expect(result.currentStreak).toBe(1);
    expect(mockMonitorStats.save).toHaveBeenCalled();
  });
});
