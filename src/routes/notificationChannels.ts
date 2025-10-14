import { Router } from "express";
import { NotificationChannelController } from "@/controllers/index.js";
import { verifyToken } from "@/middleware/VerifyToken.js";
import { verifyPermission } from "@/middleware/VerifyPermissions.js";
import { addUserContext } from "@/middleware/AddUserContext.js";
import { PERMISSIONS } from "@/services/business/AuthService.js";
class NotificationChannelRoutes {
  private router;
  private controller;
  constructor(notificationChannelController: NotificationChannelController) {
    this.router = Router();
    this.controller = notificationChannelController;
    this.initRoutes();
  }

  initRoutes = () => {
    this.router.post(
      "/",
      verifyToken,
      addUserContext,
      verifyPermission([PERMISSIONS.notifications.write]),
      this.controller.create
    );

    this.router.get(
      "/",
      verifyToken,
      addUserContext,
      verifyPermission([PERMISSIONS.notifications.read]),
      this.controller.getAll
    );

    this.router.patch(
      "/:id/active",
      verifyToken,
      addUserContext,
      verifyPermission([PERMISSIONS.notifications.write]),
      this.controller.toggleActive
    );

    this.router.patch(
      "/:id",
      verifyToken,
      addUserContext,
      verifyPermission([PERMISSIONS.notifications.update]),
      this.controller.update
    );

    this.router.get(
      "/:id",
      verifyToken,
      addUserContext,
      verifyPermission([PERMISSIONS.notifications.read]),
      this.controller.get
    );

    this.router.delete(
      "/:id",
      verifyToken,
      addUserContext,
      verifyPermission([PERMISSIONS.notifications.delete]),
      this.controller.delete
    );
  };

  getRouter() {
    return this.router;
  }
}

export default NotificationChannelRoutes;
