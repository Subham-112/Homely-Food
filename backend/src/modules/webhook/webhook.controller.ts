import { Request, Response, NextFunction } from "express";
import { WebhookService } from "./webhook.service";

export class WebhookController {
  public static async handleRazorpayWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const signature = (req.headers["x-razorpay-signature"] as string) || "";
      const rawBody = (req as any).rawBody || req.body;
      const result = await WebhookService.handleRazorpayWebhook(rawBody, signature);
      return res.status(200).json(result);
    } catch (error) {
      console.error("Webhook processing error:", error);
      // Return 200 to prevent gateway retries for bad data, or pass to error handler
      return res.status(200).json({ success: false, message: "Handled with error" });
    }
  }
}
