import { Request, Response, NextFunction } from "express";
import { encode } from "@/utils/JWTUtils.js";
import RecoveryService from "@/services/business/RecoveryService.js";
import ApiError from "@/utils/ApiError.js";

class RecoveryController {
  private recoveryService: RecoveryService;

  constructor(recoveryService: RecoveryService) {
    this.recoveryService = recoveryService;
  }

  requestRecovery = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;

      if (!email) {
        throw new ApiError("Email is required", 400);
      }

      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get("user-agent");

      await this.recoveryService.requestRecovery(email, ipAddress, userAgent);

      res.status(200).json({
        message: "If an account with that email exists, a recovery link has been sent",
      });
    } catch (error) {
      next(error);
    }
  };

  validateRecovery = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.body;

      if (!token) {
        throw new ApiError("Token is required", 400);
      }

      const isValid = await this.recoveryService.validateRecovery(token);

      res.status(200).json({
        message: isValid ? "Token is valid" : "Token is invalid or expired",
        data: { isValid },
      });
    } catch (error) {
      next(error);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        throw new ApiError("Token and password are required", 400);
      }

      if (password.length < 8) {
        throw new ApiError("Password must be at least 8 characters long", 400);
      }

      const { tokenizedUser, returnableUser } =
        await this.recoveryService.resetPassword(token, password);

      const jwt = encode(tokenizedUser);

      res.cookie("token", jwt, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
      });

      res.status(200).json({
        message: "Password reset successful",
        data: returnableUser,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default RecoveryController;
