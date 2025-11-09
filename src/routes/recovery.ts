import { Router } from "express";
import { RecoveryController } from "@/controllers/index.js";
import { validateBody } from "@/middleware/validation.js";

class RecoveryRoutes {
  private controller: RecoveryController;
  private router: Router;

  constructor(recoveryController: RecoveryController) {
    this.controller = recoveryController;
    this.router = Router();
    this.initRoutes();
  }

  initRoutes = () => {
    this.router.post("/request", this.controller.requestRecovery);
    this.router.post("/validate", this.controller.validateRecovery);
    this.router.post("/reset", this.controller.resetPassword);
  };

  getRouter() {
    return this.router;
  }
}

export default RecoveryRoutes;
