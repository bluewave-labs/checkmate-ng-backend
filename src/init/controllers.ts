import {
  AuthController,
  InviteController,
  MaintenanceController,
  MonitorController,
  NotificationChannelController,
  QueueController,
  TeamController,
  RoleController,
  TeamMemberController,
  ChecksController,
} from "@/controllers/index.js";

export const initControllers = (services: any) => {
  const controllers: Record<string, any> = {};

  controllers.authController = new AuthController(
    services.authService,
    services.inviteService
  );
  controllers.inviteController = new InviteController(services.inviteService);
  controllers.maintenanceController = new MaintenanceController(
    services.maintenanceService
  );
  controllers.monitorController = new MonitorController(
    services.monitorService,
    services.checkService,
    services.notificationService
  );
  controllers.notificationChannelController = new NotificationChannelController(
    services.notificationChannelService
  );
  controllers.queueController = new QueueController(services.jobQueue);

  controllers.teamController = new TeamController(services.teamService);

  controllers.roleController = new RoleController(services.roleService);

  controllers.teamMemberController = new TeamMemberController(
    services.teamMemberService
  );

  controllers.checksController = new ChecksController(services.checkService);
  return controllers;
};
