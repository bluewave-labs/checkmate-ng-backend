import type { Express } from "express";
import {
  AuthRoutes,
  InviteRoutes,
  MaintenanceRoutes,
  MonitorRoutes,
  NotificationChannelRoutes,
  QueueRoutes,
  TeamRoutes,
  RoleRoutes,
  TeamMemberRoutes,
  ChecksRoutes,
} from "@/routes/index.js";
export const initRoutes = (controllers: any, app: Express) => {
  const authRoutes = new AuthRoutes(controllers.authController);
  const inviteRoutes = new InviteRoutes(controllers.inviteController);
  const maintenanceRoutes = new MaintenanceRoutes(
    controllers.maintenanceController
  );
  const monitorRoutes = new MonitorRoutes(controllers.monitorController);
  const notificationChannelRoutes = new NotificationChannelRoutes(
    controllers.notificationChannelController
  );
  const queueRoutes = new QueueRoutes(controllers.queueController);
  const teamRoutes = new TeamRoutes(controllers.teamController);
  const roleRoutes = new RoleRoutes(controllers.roleController);
  const teamMemberRoutes = new TeamMemberRoutes(
    controllers.teamMemberController
  );
  const checksRoutes = new ChecksRoutes(controllers.checksController);

  app.use("/api/v1/auth", authRoutes.getRouter());
  app.use("/api/v1/invite", inviteRoutes.getRouter());
  app.use("/api/v1/maintenance", maintenanceRoutes.getRouter());
  app.use("/api/v1/monitors", monitorRoutes.getRouter());
  app.use(
    "/api/v1/notification-channels",
    notificationChannelRoutes.getRouter()
  );
  app.use("/api/v1/queue", queueRoutes.getRouter());
  app.use("/api/v1/teams", teamRoutes.getRouter());
  app.use("/api/v1/roles", roleRoutes.getRouter());
  app.use("/api/v1/team-members", teamMemberRoutes.getRouter());
  app.use("/api/v1/checks", checksRoutes.getRouter());
};
