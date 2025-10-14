import { Router } from "express";
import { MaintenanceController } from "@/controllers/index.js";
import { verifyToken } from "@/middleware/VerifyToken.js";
import { verifyPermission } from "@/middleware/VerifyPermissions.js";
import { addUserContext } from "@/middleware/AddUserContext.js";
import { PERMISSIONS } from "@/services/business/AuthService.js";

class MaintenanceRoutes {
  private router;
  private controller;
  constructor(maintenanceController: MaintenanceController) {
    this.router = Router();
    this.controller = maintenanceController;
    this.initRoutes();
  }

  initRoutes = () => {
    this.router.post(
      "/",
      verifyToken,
      addUserContext,
      verifyPermission([PERMISSIONS.maintenance.write]),
      this.controller.create
    );

    this.router.get(
      "/",
      verifyToken,
      addUserContext,
      verifyPermission([PERMISSIONS.maintenance.read]),
      this.controller.getAll
    );

    this.router.patch(
      "/:id/active",
      verifyToken,
      addUserContext,
      verifyPermission([PERMISSIONS.maintenance.update]),
      this.controller.toggleActive
    );

    this.router.patch(
      "/:id",
      verifyToken,
      addUserContext,
      verifyPermission([PERMISSIONS.maintenance.update]),
      this.controller.update
    );

    this.router.get(
      "/:id",
      verifyToken,
      addUserContext,
      verifyPermission([PERMISSIONS.maintenance.read]),
      this.controller.get
    );

    this.router.delete(
      "/:id",
      verifyToken,
      addUserContext,
      verifyPermission([PERMISSIONS.maintenance.delete]),
      this.controller.delete
    );
  };

  getRouter() {
    return this.router;
  }
}

export default MaintenanceRoutes;
