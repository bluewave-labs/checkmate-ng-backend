import crypto from "crypto";
import bcrypt from "bcryptjs";
import { User, RecoveryToken, ITokenizedUser, IUserReturnable } from "@/db/models/index.js";
import ApiError from "@/utils/ApiError.js";
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { config } from "@/config/index.js";
import { hashPassword } from "@/utils/JWTUtils.js";
import { getChildLogger } from "@/logger/Logger.js";

const SERVICE_NAME = "RecoveryService";
const logger = getChildLogger(SERVICE_NAME);

export interface IRecoveryService {
  requestRecovery(email: string, ipAddress?: string, userAgent?: string): Promise<void>;
  validateRecovery(token: string): Promise<boolean>;
  resetPassword(token: string, newPassword: string): Promise<{
    tokenizedUser: ITokenizedUser;
    returnableUser: IUserReturnable;
  }>;
}

class RecoveryService implements IRecoveryService {
  public SERVICE_NAME: string;
  private transporter: Transporter;

  constructor() {
    this.SERVICE_NAME = SERVICE_NAME;
    this.transporter = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_PORT === 465,
      auth: {
        user: config.SMTP_USER,
        pass: config.SMTP_PASS,
      },
    });
  }

  async requestRecovery(email: string, ipAddress?: string, userAgent?: string): Promise<void> {
    // Check if user exists
    const user = await User.findOne({ email }).lean();
    if (!user) {
      // Don't reveal that the user doesn't exist
      logger.info(`Password recovery requested for non-existent email: ${email}`);
      return;
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString("hex");

    // Delete any existing recovery tokens for this email
    await RecoveryToken.deleteMany({ email });

    // Create new recovery token
    await RecoveryToken.create({
      email,
      token,
      ipAddress,
      userAgent,
    });

    // Send recovery email
    const clientHost = config.ORIGIN || "http://localhost:5173";
    const resetUrl = `${clientHost}/set-new-password/${token}`;

    try {
      await this.transporter.sendMail({
        from: `"Checkmate" <${config.SMTP_USER}>`,
        to: email,
        subject: "Password Recovery",
        html: this.buildRecoveryEmailHtml(resetUrl),
        text: this.buildRecoveryEmailText(resetUrl),
      });

      logger.info(`Password recovery email sent to: ${email}`);
    } catch (error) {
      logger.error(`Failed to send recovery email to ${email}:`, error);
      throw new ApiError("Failed to send recovery email", 500);
    }
  }

  async validateRecovery(token: string): Promise<boolean> {
    const recoveryToken = await RecoveryToken.findOne({ token }).lean();
    return !!recoveryToken;
  }

  async resetPassword(token: string, newPassword: string): Promise<{
    tokenizedUser: ITokenizedUser;
    returnableUser: IUserReturnable;
  }> {
    // Find and validate token
    const recoveryToken = await RecoveryToken.findOne({ token });
    if (!recoveryToken) {
      throw new ApiError("Invalid or expired recovery token", 400);
    }

    // Find user
    const user = await User.findOne({ email: recoveryToken.email });
    if (!user) {
      throw new ApiError("User not found", 404);
    }

    // Update password
    const passwordHash = await hashPassword(newPassword);
    user.passwordHash = passwordHash;
    await user.save();

    // Delete the recovery token
    await RecoveryToken.deleteOne({ _id: recoveryToken._id });

    logger.info(`Password reset successful for user: ${user.email}`);

    // Import AuthService dynamically to avoid circular dependency
    const AuthService = (await import("./AuthService.js")).default;
    const authServiceInstance = new AuthService(null as any); // We don't need jobQueue for me() method

    // Get user context and return tokenized user
    const returnableUser = await authServiceInstance.me(user._id.toString());

    const tokenizedUser: ITokenizedUser = {
      sub: user._id.toString(),
      email: user.email,
      orgId: returnableUser.org.name, // This will be overwritten by proper orgId in the actual token
    };

    // Get the actual orgId from OrgMembership
    const { OrgMembership } = await import("@/db/models/index.js");
    const orgMembership = await OrgMembership.findOne({ userId: user._id }).lean();
    if (orgMembership) {
      tokenizedUser.orgId = orgMembership.orgId.toString();
    }

    return {
      tokenizedUser,
      returnableUser,
    };
  }

  private buildRecoveryEmailHtml(resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #4CAF50;
            color: white;
            padding: 20px;
            text-align: center;
          }
          .content {
            background-color: #f9f9f9;
            padding: 20px;
            border: 1px solid #ddd;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            margin: 20px 0;
            background-color: #4CAF50;
            color: white;
            text-decoration: none;
            border-radius: 4px;
          }
          .footer {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Recovery</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <p style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all;">${resetUrl}</p>
            <p>This link will expire in 10 minutes.</p>
            <p>If you didn't request a password reset, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>This is an automated message from Checkmate. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private buildRecoveryEmailText(resetUrl: string): string {
    return `
Password Recovery

Hello,

We received a request to reset your password. Click the link below to create a new password:

${resetUrl}

This link will expire in 10 minutes.

If you didn't request a password reset, you can safely ignore this email.

---
This is an automated message from Checkmate. Please do not reply to this email.
    `.trim();
  }
}

export default RecoveryService;
