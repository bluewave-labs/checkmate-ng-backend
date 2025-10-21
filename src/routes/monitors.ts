import { Router } from "express";
import { MonitorController } from "@/controllers/index.js";
import { verifyToken } from "@/middleware/VerifyToken.js";
import { verifyTeamPermission } from "@/middleware/VerifyPermission.js";
import { addUserContext } from "@/middleware/AddUserContext.js";
import { PERMISSIONS } from "@/services/business/AuthService.js";

class MonitorRoutes {
  private router;
  private controller;
  constructor(monitorController: MonitorController) {
    this.router = Router();
    this.controller = monitorController;
    this.initRoutes();
  }

  initRoutes = () => {
    this.router.post(
      "/",
      verifyToken,
      addUserContext,
      verifyTeamPermission([PERMISSIONS.monitors.write]),
      this.controller.create
    );

    this.router.get(
      "/",
      verifyToken,
      addUserContext,
      verifyTeamPermission([PERMISSIONS.monitors.read]),
      this.controller.getAll
    );

    this.router.get(
      "/:id/checks",
      verifyToken,
      addUserContext,
      verifyTeamPermission([PERMISSIONS.monitors.read]),
      this.controller.getChecks
    );

    this.router.patch(
      "/:id/active",
      verifyToken,
      addUserContext,
      verifyTeamPermission([PERMISSIONS.monitors.write]),
      this.controller.toggleActive
    );

    this.router.get(
      "/:id",
      verifyToken,
      addUserContext,
      verifyTeamPermission([PERMISSIONS.monitors.read]),
      this.controller.get
    );

    this.router.patch(
      "/:id",
      verifyToken,
      addUserContext,
      verifyTeamPermission([PERMISSIONS.monitors.write]),
      this.controller.update
    );

    this.router.delete(
      "/:id",
      verifyToken,
      addUserContext,
      verifyTeamPermission([PERMISSIONS.monitors.delete]),
      this.controller.delete
    );
  };

  getRouter() {
    return this.router;
  }
}

export default MonitorRoutes;
