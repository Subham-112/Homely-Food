import express, { Router } from "express";
import { WebhookController } from "./webhook.controller";

const router = Router();

// Raw body parser specific to Razorpay webhook for HMAC signature verification
router.post(
  "/razorpay",
  express.raw({ type: "application/json" }),
  WebhookController.handleRazorpayWebhook
);

export default router;
