import Order, { IOrder } from "../../models/order.model";
import User from "../../models/user.model";
import MenuItem from "../../models/menuItem.model";
import { Customer } from "../../models/customer.model";
import ApiError from "../../utils/ApiError";
import { OrderFor, OrderStatus, OrderType, PaymentMethod, PaymentStatus } from "../../common/enum";
import { emitNewOrder, emitOrderStatusUpdate } from "../../socket/socketService";
import { Types } from "mongoose";

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
  };
  notes?: string;
  discount?: number;
  orderType?: OrderType;
  deliveryAddress?: string;
  pickupTiming?: string;
}

export class OrderService {
  static async create(payload: ICreateOrderPayload) {
    if (!payload.items || !Array.isArray(payload.items) || payload.items.length === 0) {
      throw new ApiError(400, "Order must contain at least one item.");
    }

    // Process and validate items
    let subTotal = 0;
    const processedItems = await Promise.all(
      payload.items.map(async (itemInput) => {
        const menuItemDoc = await MenuItem.findById(itemInput.menuItem);
        if (!menuItemDoc) {
          throw new ApiError(404, `Menu item with ID "${itemInput.menuItem}" not found.`);
        }

        const itemName = itemInput.name || menuItemDoc.name;
        const itemPrice = itemInput.price !== undefined ? itemInput.price : (itemInput.variant?.price || menuItemDoc.price);
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
    const totalAmount = Math.max(0, subTotal - discount);

    // Auto-generate order number (e.g. ORD-849201)
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}${Math.floor(100 + Math.random() * 900)}`;

    // Extract guest input
    const enteredPhone = (payload.guest?.phone || "").trim();
    const enteredName = (payload.guest?.name || "").trim();
    const enteredEmail = (payload.guest?.email || "").trim();

    // Resolve registered user: check payload.userId or look up by entered phone
    let userId: any = undefined;
    let guestData = { name: enteredName, phone: enteredPhone, email: enteredEmail };

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
        guestData.email = enteredEmail || existingUser.email || "";
      }
    }

    if (!userId && guestData.phone) {
      const existingUser = await User.findOne({ phone: guestData.phone });
      if (existingUser) {
        userId = existingUser._id;
      }
    }

    // Determine orderFor
    const orderFor = userId ? OrderFor.REGISTERED_USER : OrderFor.GUEST;

    // Customer Sync: Find or create Customer profile
    let customerDoc: any = undefined;
    const customerPhone = guestData.phone?.trim();
    const customerName = guestData.name?.trim();

    if (customerPhone && customerName) {
      try {
        let customer = await Customer.findOne({ phone: customerPhone });
        if (!customer) {
          customer = new Customer({
            phone: customerPhone,
            user: userId || undefined,
            primaryName: customerName,
            names: [{ name: customerName, addedAt: new Date() }],
            orderCount: 1,
            totalExpenses: totalAmount,
            customerType: userId ? "registered" : "guest",
          });
          await customer.save();
        } else {
          // Check if customerName exists in history (case-insensitive)
          const nameExists = customer.names.some(
            (n) => n.name.toLowerCase() === customerName.toLowerCase()
          );
          if (!nameExists) {
            customer.names.push({ name: customerName, addedAt: new Date() });
          }
          // Update primaryName to latest entered name
          customer.primaryName = customerName;
          customer.orderCount += 1;
          customer.totalExpenses += totalAmount;
          if (userId) {
            customer.user = userId;
            customer.customerType = "registered";
          }
          await customer.save();
        }
        customerDoc = customer;
      } catch (custError) {
        console.error("Failed to sync customer profile during order creation:", custError);
      }
    }

    const order = await Order.create({
      orderNumber,
      user: userId,
      customer: customerDoc ? customerDoc._id : undefined,
      orderFor,
      guest: guestData,
      items: processedItems,
      payment: {
        method: payload.payment?.method || "",
        status: payload.payment?.status || PaymentStatus.UNPAID,
        transactionId: payload.payment?.transactionId || "",
        amount: totalAmount,
      },
      status: OrderStatus.ACCEPTED,
      orderType: payload.orderType || OrderType.DINE_IN,
      deliveryAddress: payload.deliveryAddress,
      pickupTiming: payload.pickupTiming,
      subTotal,
      discount,
      totalAmount,
      notes: payload.notes?.trim() || "",
      createdBy: "admin",
    });

    // Real-Time Socket.io Event Emission
    try {
      emitNewOrder(order);
    } catch (socketErr) {
      console.error("Failed to emit socket event for new order:", socketErr);
    }

    return order;
  }

  static async getAll(query: {
    status?: OrderStatus;
    orderType?: string;
    search?: string;
    page?: number;
    limit?: number;
    userId?: string;
    dateRange?: { startDate: Date; endDate: Date };
  }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 10));
    const skip = (page - 1) * limit;

    const filter: any = { deleted: { $ne: true } };

    if (query.status) {
      filter.status = query.status;
    }

    if (query.orderType) {
      filter.orderType = query.orderType;
    }

    if (query.userId) {
      filter.user = query.userId;
    }

    if (query.dateRange) {
      filter.createdAt = {
        $gte: query.dateRange.startDate,
        $lte: query.dateRange.endDate,
      };
    }

    if (query.search && query.search.trim()) {
      const searchRegex = new RegExp(query.search.trim(), "i");
      filter.$or = [
        { orderNumber: searchRegex },
        { "guest.name": searchRegex },
        { "guest.phone": searchRegex },
      ];
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: "items.menuItem",
          select: "_id name price image",
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
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      orders,
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

  static async getMyOrders(userId: string, status?: string) {
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

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .populate({
        path: "items.menuItem",
        select: "_id name price image",
      })
      .populate({
        path: "items.variant.variantId",
        select: "_id label price",
      })
      .populate({
        path: "offer",
        select: "_id title code offerType discountPercentage flatDiscountAmount",
      });
    return orders;
  }

  static async getById(id: string) {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    const filter = isObjectId ? { $or: [{ _id: id }, { orderNumber: id }] } : { orderNumber: id };
    const order = await Order.findOne(filter)
      .populate("user", "name phone email")
      .populate({
        path: "items.menuItem",
        select: "_id name price image",
      })
      .populate({
        path: "items.variant.variantId",
        select: "_id label price",
      })
      .populate({
        path: "offer",
        select: "_id title code offerType discountPercentage flatDiscountAmount",
      });

    if (!order) {
      throw new ApiError(404, "Order not found");
    }
    return order;
  }

  static async updateStatus(
    id: string,
    status: OrderStatus,
    paymentMethod?: PaymentMethod,
    isPaid?: boolean
  ) {
    const order = await Order.findById(id)
      .populate("user", "name phone email")
      .populate({
        path: "items.menuItem",
        select: "_id name price image",
      })
      .populate({
        path: "items.variant.variantId",
        select: "_id label price",
      })
      .populate({
        path: "offer",
        select: "_id title code offerType discountPercentage flatDiscountAmount",
      });
      
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

    // Real-Time Socket.io Event Emission for Order Status Changes
    try {
      emitOrderStatusUpdate(order);
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
