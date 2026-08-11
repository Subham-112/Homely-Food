import Order, { IOrder } from "../../models/order.model";
import User from "../../models/user.model";
import MenuItem from "../../models/menuItem.model";
import ApiError from "../../utils/ApiError";
import { OrderStatus, PaymentMethod, PaymentStatus } from "../../common/enum";

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

    // Resolve user: use provided userId directly, or look up by guest phone
    let userId: any = undefined;
    let guestData = { name: "", phone: "", email: "" };

    if (payload.userId) {
      const existingUser = await User.findById(payload.userId);
      if (!existingUser) {
        throw new ApiError(404, "User not found with the provided ID.");
      }
      userId = existingUser._id;
      guestData = {
        name: payload.guest?.name?.trim() || existingUser.name || "",
        phone: payload.guest?.phone?.trim() || existingUser.phone || "",
        email: payload.guest?.email?.trim() || existingUser.email || "",
      };
    } else if (payload.guest) {
      guestData = {
        name: payload.guest.name.trim(),
        phone: payload.guest.phone.trim(),
        email: payload.guest.email?.trim() || "",
      };
      const existingUser = await User.findOne({ phone: guestData.phone });
      if (existingUser) {
        userId = existingUser._id;
      }
    }

    const order = await Order.create({
      orderNumber,
      user: userId,
      guest: guestData,
      items: processedItems,
      payment: {
        method: payload.payment?.method || PaymentMethod.CASH,
        status: payload.payment?.status || PaymentStatus.PENDING,
        transactionId: payload.payment?.transactionId || "",
        amount: totalAmount,
      },
      status: OrderStatus.PENDING,
      subTotal,
      discount,
      totalAmount,
      notes: payload.notes?.trim() || "",
    });

    return order;
  }

  static async getAll(query: {
    status?: OrderStatus;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 10));
    const skip = (page - 1) * limit;

    const filter: any = { deleted: { $ne: true } };

    if (query.status) {
      filter.status = query.status;
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
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
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

  static async getById(id: string) {
    const order = await Order.findById(id).populate("user", "name phone email");
    if (!order) {
      throw new ApiError(404, "Order not found");
    }
    return order;
  }

  static async updateStatus(id: string, status: OrderStatus) {
    const order = await Order.findById(id);
    if (!order) {
      throw new ApiError(404, "Order not found");
    }
    order.status = status;
    await order.save();
    return order;
  }
}
