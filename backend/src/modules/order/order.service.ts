import Order, { IOrder } from "../../models/order.model";
import User from "../../models/user.model";
import MenuItem from "../../models/menuItem.model";
import { Customer } from "../../models/customer.model";
import ShopDetails from "../../models/shopDetails.model";
import ApiError from "../../utils/ApiError";
import { OrderFor, OrderStatus, OrderType, PaymentMethod, PaymentStatus } from "../../common/enum";
import { emitNewOrder, emitOrderStatusUpdate } from "../../socket/socketService";
import { CoinService } from "../coin/coin.service";
import { calculateItemPricing } from "../../utils/pricing";
import mongoose, { Types } from "mongoose";

export interface ICreateOrderItemInput {
  menuItem: string;
  name?: string;
  price?: number;
  quantity: number;
  variant?: {
    variantId?: string;
    label?: string;
    price?: number;
  };
}

export interface ICreateOrderPayload {
  userId?: string;
  guest?: {
    name: string;
    phone: string;
    email?: string;
  };
  items: ICreateOrderItemInput[];
  payment?: {
    method?: PaymentMethod;
    status?: PaymentStatus;
    transactionId?: string;
    deliveryCharge?: number;
  };
  paymentPreference?: "CASH" | "ONLINE";
  notes?: string;
  discount?: number;
  discountType?: "offer" | "coins";
  coinsUsed?: number;
  offerCode?: string;
  offer?: string;
  orderType?: OrderType;
  deliveryAddress?: string;
  deliveryCharge?: number;
  pickupTiming?: string;
  createdBy?: string;
}

function formatOrderResponse(orderDoc: any, shopDetails: any) {
  if (!orderDoc) return orderDoc;
  const orderObj = typeof orderDoc.toObject === "function" ? orderDoc.toObject() : { ...orderDoc };

  if (Array.isArray(orderObj.items)) {
    orderObj.items = orderObj.items.map((item: any) => {
      const itemObj = { ...item };
      if (itemObj.menuItem) {
        const mDoc = typeof itemObj.menuItem.toObject === "function" ? itemObj.menuItem.toObject() : { ...itemObj.menuItem };
        const basePrice = itemObj.variant?.price || mDoc.price;
        const pricing = calculateItemPricing(basePrice, mDoc.discountPercent, shopDetails);

        itemObj.menuItem = {
          ...mDoc,
          price: pricing.discountedPrice,
          originalPrice: pricing.price,
          discountPercent: pricing.discountPercent,
          discountedPrice: pricing.discountedPrice,
        };

        if (itemObj.price === undefined || itemObj.price === null || itemObj.price === pricing.price) {
          itemObj.price = pricing.discountedPrice;
        }
      }
      return itemObj;
    });
  }

  return orderObj;
}

export class OrderService {
  static async validateOrderPayload(payload: ICreateOrderPayload) {
    if (!payload.items || !Array.isArray(payload.items) || payload.items.length === 0) {
      throw new ApiError(400, "Order must contain at least one item.");
    }

    let subTotal = 0;
    const shopDetails = await ShopDetails.findOne();

    const processedItems = await Promise.all(
      payload.items.map(async (itemInput) => {
        const menuItemDoc = await MenuItem.findById(itemInput.menuItem);
        if (!menuItemDoc) {
          throw new ApiError(404, `Menu item with ID "${itemInput.menuItem}" not found.`);
        }

        const itemName = itemInput.name || menuItemDoc.name;
        const basePrice = itemInput.variant?.price || menuItemDoc.price;
        const pricing = calculateItemPricing(basePrice, menuItemDoc.discountPercent, shopDetails);
        const itemPrice = pricing.discountedPrice;

        const itemTotal = itemPrice * itemInput.quantity;
        subTotal += itemTotal;

        return {
          menuItem: menuItemDoc._id,
          name: itemName,
          price: itemPrice,
          quantity: itemInput.quantity,
          variant: itemInput.variant
            ? {
                variantId: itemInput.variant.variantId as any,
                label: itemInput.variant.label || "",
                price: itemInput.variant.price || 0,
              }
            : undefined,
        };
      })
    );

    const discount = payload.discount || 0;
    const netItemAmount = Math.max(0, subTotal - discount);

    // Calculate delivery charge if orderType is delivery
    let deliveryCharge = 0;
    const isDelivery =
      payload.orderType === OrderType.DELIVERY ||
      String(payload.orderType).toLowerCase() === "delivery";

    if (isDelivery) {
      const shopDetails = await ShopDetails.findOne();
      const shopDeliveryCharge =
        typeof shopDetails?.deliveryCharge === "number" ? shopDetails.deliveryCharge : 30;
      const freeDeliveryThreshold =
        typeof shopDetails?.freeDeliveryThreshold === "number"
          ? shopDetails.freeDeliveryThreshold
          : 500;

      if (freeDeliveryThreshold > 0 && subTotal >= freeDeliveryThreshold) {
        deliveryCharge = 0; // Free delivery threshold met
      } else {
        deliveryCharge = shopDeliveryCharge;
      }
    }

    const totalAmount = netItemAmount + deliveryCharge;

    const enteredPhone = (payload.guest?.phone || "").trim();
    const enteredName = (payload.guest?.name || "").trim();
    const enteredEmail = (payload.guest?.email || "").trim();

    let userId: any = undefined;
    let guestData: { name: string; phone: string; email?: string } = {
      name: enteredName,
      phone: enteredPhone,
      ...(enteredEmail ? { email: enteredEmail } : {}),
    };

    if (payload.userId) {
      let existingUser = await User.findById(payload.userId);
      if (!existingUser) {
        const existingCustomer = await Customer.findById(payload.userId);
        if (existingCustomer) {
          if (existingCustomer.user) {
            existingUser = await User.findById(existingCustomer.user);
          }
          guestData.phone = enteredPhone || existingCustomer.phone || "";
          guestData.name = enteredName || existingCustomer.primaryName || "";
          if (existingUser) {
            userId = existingUser._id;
          }
        }
      } else {
        userId = existingUser._id;
        guestData.phone = enteredPhone || existingUser.phone || "";
        guestData.name = enteredName || existingUser.name || "";
        if (enteredEmail || existingUser.email) {
          guestData.email = enteredEmail || existingUser.email;
        }
      }
    }

    if (!userId && guestData.phone) {
      const existingUser = await User.findOne({ phone: guestData.phone });
      if (existingUser) {
        userId = existingUser._id;
      }
    }

    const orderFor = userId ? OrderFor.REGISTERED_USER : OrderFor.GUEST;

    return {
      subTotal,
      discount,
      deliveryCharge,
      totalAmount,
      processedItems,
      userId,
      guestData,
      orderFor,
    };
  }

  static async create(payload: ICreateOrderPayload, paymentRef?: Types.ObjectId) {
    const validated = await this.validateOrderPayload(payload);
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}${Math.floor(100 + Math.random() * 900)}`;

    let customerDoc: any = undefined;
    const customerPhone = validated.guestData.phone?.trim();
    const customerName = validated.guestData.name?.trim();

    if (customerPhone && customerName) {
      try {
        let customer = await Customer.findOne({ phone: customerPhone });
        if (!customer) {
          customer = new Customer({
            phone: customerPhone,
            user: validated.userId || undefined,
            primaryName: customerName,
            names: [{ name: customerName, addedAt: new Date() }],
            orderCount: 1,
            totalExpenses: validated.totalAmount,
            customerType: validated.userId ? "registered" : "guest",
          });
          await customer.save();
        } else {
          const nameExists = customer.names.some(
            (n) => n.name.toLowerCase() === customerName.toLowerCase()
          );
          if (!nameExists) {
            customer.names.push({ name: customerName, addedAt: new Date() });
          }
          customer.primaryName = customerName;
          customer.orderCount += 1;
          customer.totalExpenses += validated.totalAmount;
          if (validated.userId) {
            customer.user = validated.userId;
            customer.customerType = "registered";
          }
          await customer.save();
        }
        customerDoc = customer;
      } catch (custError) {
        console.error("Failed to sync customer profile during order creation:", custError);
      }
    }

    const paymentPref = payload.paymentPreference || "CASH";
    const defaultMethod = paymentPref === "ONLINE" ? PaymentMethod.RAZORPAY : (payload.payment?.method || PaymentMethod.CASH);
    const defaultStatus = paymentPref === "ONLINE" ? PaymentStatus.PAID : (payload.payment?.status || PaymentStatus.UNPAID);

    const order = await Order.create({
      orderNumber,
      user: validated.userId,
      customer: customerDoc ? customerDoc._id : undefined,
      orderFor: validated.orderFor,
      guest: validated.guestData,
      items: validated.processedItems,
      payment: {
        mode: paymentPref,
        method: defaultMethod,
        status: defaultStatus,
        transactionId: payload.payment?.transactionId || "",
        paymentRef: paymentRef || undefined,
        subTotal: validated.subTotal,
        discount: validated.discount,
        deliveryCharge: validated.deliveryCharge,
        totalAmount: validated.totalAmount,
        discountType: payload.discountType || (payload.payment as any)?.discountType,
        coinsUsed: payload.coinsUsed || (payload.payment as any)?.coinsUsed,
      },
      status: OrderStatus.ACCEPTED,
      orderType: payload.orderType || OrderType.DINE_IN,
      deliveryAddress: payload.deliveryAddress,
      deliveryCharge: validated.deliveryCharge,
      pickupTiming: payload.pickupTiming,
      subTotal: validated.subTotal,
      discount: validated.discount,
      totalAmount: validated.totalAmount,
      discountType: payload.discountType || (payload.payment as any)?.discountType,
      coinsUsed: payload.coinsUsed || (payload.payment as any)?.coinsUsed,
      offer: payload.offer as any,
      offerCode: payload.offerCode,
      notes: payload.notes?.trim() || "",
      createdBy: payload.createdBy || "admin",
    });

    try {
      emitNewOrder(order);
    } catch (socketErr) {
      console.error("Failed to emit socket event for new order:", socketErr);
    }

    return order;
  }

  static async getAll(query: {
    status?: OrderStatus | string;
    orderType?: string;
    search?: string;
    page?: number;
    limit?: number;
    userId?: string;
    userPhone?: string;
    dateRange?: { startDate: Date; endDate: Date };
  }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 10));
    const skip = (page - 1) * limit;

    const filter: any = { deleted: { $ne: true } };

    if (query.status) {
      const statusLower = String(query.status).toLowerCase();
      if (statusLower === "pending") {
        filter.status = { $in: [OrderStatus.PENDING, OrderStatus.ACCEPTED] };
      } else if (statusLower === "completed") {
        filter.status = { $in: [OrderStatus.COMPLETED, OrderStatus.DELIVERED] };
      } else {
        filter.status = query.status;
      }
    }

    if (query.orderType) {
      filter.orderType = query.orderType;
    }

    const andConditions: any[] = [];

    if (query.userId) {
      const val = query.userId.trim();
      const isObjectId = mongoose.Types.ObjectId.isValid(val);

      if (isObjectId) {
        andConditions.push({
          $or: [
            { user: new mongoose.Types.ObjectId(val) },
            { customer: new mongoose.Types.ObjectId(val) },
            { "guest.phone": val },
          ],
        });
      } else {
        // Fallback if phone was passed in userId key
        const { Customer } = await import("../../models/customer.model");
        const { User } = await import("../../models/user.model");

        const [matchingUsers, matchingCustomers] = await Promise.all([
          User.find({ phone: val }).select("_id"),
          Customer.find({ phone: val }).select("_id user"),
        ]);

        const matchedUserIds = matchingUsers.map((u) => u._id);
        const matchedCustomerIds = matchingCustomers.map((c) => c._id);
        
        matchingCustomers.forEach((c) => {
          if (c.user) matchedUserIds.push(c.user);
        });

        andConditions.push({
          $or: [
            { user: { $in: matchedUserIds } },
            { customer: { $in: matchedCustomerIds } },
            { "guest.phone": val },
          ],
        });
      }
    }

    if (query.userPhone) {
      const phoneVal = query.userPhone.trim();
      const { Customer } = await import("../../models/customer.model");
      const { User } = await import("../../models/user.model");

      const [matchingUsers, matchingCustomers] = await Promise.all([
        User.find({ phone: phoneVal }).select("_id"),
        Customer.find({ phone: phoneVal }).select("_id user"),
      ]);

      const matchedUserIds = matchingUsers.map((u) => u._id);
      const matchedCustomerIds = matchingCustomers.map((c) => c._id);

      matchingCustomers.forEach((c) => {
        if (c.user) matchedUserIds.push(c.user);
      });

      andConditions.push({
        $or: [
          { user: { $in: matchedUserIds } },
          { customer: { $in: matchedCustomerIds } },
          { "guest.phone": phoneVal },
        ],
      });
    }

    if (query.dateRange) {
      filter.createdAt = {
        $gte: query.dateRange.startDate,
        $lte: query.dateRange.endDate,
      };
    }

    if (query.search && query.search.trim()) {
      const searchRegex = new RegExp(query.search.trim(), "i");
      andConditions.push({
        $or: [
          { orderNumber: searchRegex },
          { "guest.name": searchRegex },
          { "guest.phone": searchRegex },
        ],
      });
    }

    if (andConditions.length > 0) {
      filter.$and = andConditions;
    }

    const [ordersDocs, total, shopDetails] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: "items.menuItem",
          select: "_id name price discountPercent image",
        })
        .populate({
          path: "items.variant.variantId",
          select: "_id label price",
        })
        .populate({
          path: "offer",
          select: "_id title code offerType discountPercentage flatDiscountAmount",
        }),
      Order.countDocuments(filter),
      ShopDetails.findOne(),
    ]);

    const formattedOrders = ordersDocs.map((o) => formatOrderResponse(o, shopDetails));
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      orders: formattedOrders,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  static async getMyOrders(
    userId: string,
    status?: string,
    paginationOptions?: { page?: number; limit?: number }
  ) {
    const user = await User.findById(userId);
    const filter: any = { deleted: { $ne: true } };

    if (user && user.phone) {
      filter.$or = [{ user: userId }, { "guest.phone": user.phone }];
    } else {
      filter.user = userId;
    }

    if (status && status.trim() !== "" && status.toLowerCase() !== "all") {
      const s = status.toLowerCase().trim();
      if (s === "active") {
        filter.status = { $in: ["pending", "accepted", "preparing"] };
      } else if (s === "ready") {
        filter.status = "ready";
      } else if (s === "completed") {
        filter.status = { $in: ["completed", "delivered", "cancelled"] };
      } else {
        filter.status = s;
      }
    }

    const page = Math.max(1, paginationOptions?.page || 1);
    const limit = Math.max(1, Math.min(100, paginationOptions?.limit || 20));
    const skip = (page - 1) * limit;

    const [ordersDocs, total, shopDetails] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: "items.menuItem",
          select: "_id name price discountPercent image",
        })
        .populate({
          path: "items.variant.variantId",
          select: "_id label price",
        })
        .populate({
          path: "offer",
          select: "_id title code offerType discountPercentage flatDiscountAmount",
        }),
      Order.countDocuments(filter),
      ShopDetails.findOne(),
    ]);

    const formattedOrders = ordersDocs.map((o) => formatOrderResponse(o, shopDetails));
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      orders: formattedOrders,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  static async getById(id: string) {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    const filter = isObjectId ? { $or: [{ _id: id }, { orderNumber: id }] } : { orderNumber: id };
    const [order, shopDetails] = await Promise.all([
      Order.findOne(filter)
        .populate("user", "name phone email")
        .populate({
          path: "items.menuItem",
          select: "_id name price discountPercent image",
        })
        .populate({
          path: "items.variant.variantId",
          select: "_id label price",
        })
        .populate({
          path: "offer",
          select: "_id title code offerType discountPercentage flatDiscountAmount",
        }),
      ShopDetails.findOne(),
    ]);

    if (!order) {
      throw new ApiError(404, "Order not found");
    }
    return formatOrderResponse(order, shopDetails);
  }

  static async updateStatus(
    id: string,
    status: OrderStatus,
    paymentMethod?: PaymentMethod,
    isPaid?: boolean
  ) {
    const [order, shopDetails] = await Promise.all([
      Order.findById(id)
        .populate("user", "name phone email")
        .populate({
          path: "items.menuItem",
          select: "_id name price discountPercent image",
        })
        .populate({
          path: "items.variant.variantId",
          select: "_id label price",
        })
        .populate({
          path: "offer",
          select: "_id title code offerType discountPercentage flatDiscountAmount",
        }),
      ShopDetails.findOne(),
    ]);
      
    if (!order) {
      throw new ApiError(404, "Order not found");
    }
    order.status = status;

    const now = new Date();
    if (status === OrderStatus.PREPARING) {
      order.preparingAt = now;
    } else if (status === OrderStatus.READY) {
      order.readyAt = now;
    } else if (status === OrderStatus.COMPLETED || status === OrderStatus.DELIVERED) {
      order.completedAt = now;
    }

    if (paymentMethod) {
      order.payment.method = paymentMethod;
    }
    if (isPaid !== undefined) {
      order.payment.status = isPaid ? PaymentStatus.PAID : PaymentStatus.UNPAID;
    }

    await order.save();

    let coinReward = null;
    // Trigger Coin awarding for Completed / Delivered Orders
    if ((status === OrderStatus.COMPLETED || status === OrderStatus.DELIVERED) && order.user) {
      try {
        const rewardResult = await CoinService.awardOrderCoins(String(order.user._id || order.user), String(order._id), order.payment?.totalAmount || 0);
        if (rewardResult) {
          coinReward = {
            amount: rewardResult.transaction.amount,
            newBalance: rewardResult.wallet.balance,
            reason: rewardResult.transaction.reason,
          };
        }
      } catch (coinErr) {
        console.error("Failed to award coins on order status update:", coinErr);
      }
    }

    // Real-Time Socket.io Event Emission for Order Status Changes (with coinReward data)
    try {
      const orderObj = order.toObject ? order.toObject() : order;
      if (coinReward) {
        (orderObj as any).coinReward = coinReward;
      }
      emitOrderStatusUpdate(orderObj);
    } catch (socketErr) {
      console.error("Failed to emit socket event for status update:", socketErr);
    }

    return order;
  }

  static async getStats(dateRange?: { startDate: Date; endDate: Date }) {
    const baseFilter: any = { deleted: { $ne: true } };

    if (dateRange) {
      baseFilter.createdAt = {
        $gte: dateRange.startDate,
        $lte: dateRange.endDate,
      };
    }

    const [totalOrders, pendingOrders, preparingOrders, completedOrders] = await Promise.all([
      Order.countDocuments(baseFilter),
      Order.countDocuments({ ...baseFilter, status: { $in: [OrderStatus.PENDING, OrderStatus.ACCEPTED] } }),
      Order.countDocuments({ ...baseFilter, status: OrderStatus.PREPARING }),
      Order.countDocuments({ ...baseFilter, status: { $in: [OrderStatus.COMPLETED, OrderStatus.DELIVERED] } }),
    ]);

    return {
      total: totalOrders,
      pending: pendingOrders,
      preparing: preparingOrders,
      completed: completedOrders,
    };
  }
}
