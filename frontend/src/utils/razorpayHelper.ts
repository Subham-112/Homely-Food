import { verifyPayment } from "@/services/paymentService";

export interface CheckoutSession {
  requiresPayment: boolean;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  key: string;
  configId?: string;
  paymentId: string;
}

export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const openRazorpaySDK = async (
  checkoutSession: CheckoutSession,
  onSuccess: (order: any) => void,
  onFailure?: (error: any) => void,
  onDismiss?: () => void
) => {
  const scriptLoaded = await loadRazorpayScript();
  if (!scriptLoaded) {
    alert("Razorpay SDK failed to load. Please check your internet connection.");
    if (onFailure) onFailure(new Error("Razorpay SDK failed to load"));
    return;
  }

  const options: any = {
    key: checkoutSession.key || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    amount: Math.round(checkoutSession.amount * 100),
    currency: checkoutSession.currency || "INR",
    name: "Homely Food",
    description: "Food Order Payment",
    order_id: checkoutSession.razorpayOrderId,
    config_id: checkoutSession.configId || "config_TQVwBmNR7Fdusv",
    checkout_config_id: checkoutSession.configId || "config_TQVwBmNR7Fdusv",
    method: {
      netbanking: true,
      card: true,
      upi: true,
      wallet: false,
      emi: false,
      paylater: false,
    },
    display: {
      hide: [
        { method: "wallet" },
        { method: "emi" },
        { method: "paylater" },
      ],
    },
    handler: async (response: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    }) => {
      try {
        const result = await verifyPayment({
          paymentId: checkoutSession.paymentId,
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        });
        onSuccess(result.order);
      } catch (err: any) {
        console.error("Payment verification failed:", err);
        alert(err?.message || "Payment verification failed. Please contact support.");
        if (onFailure) onFailure(err);
      }
    },
    modal: {
      ondismiss: () => {
        console.log("Razorpay checkout modal dismissed by user");
        if (onDismiss) onDismiss();
      },
    },
    theme: {
      color: "#ea580c",
    },
  };

  const razorpayWindow = new (window as any).Razorpay(options);
  razorpayWindow.open();
};
