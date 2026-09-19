import { Request, Response } from "express";
import mongoose from "mongoose";
import Order from "../../models/order.model";
import MenuItem from "../../models/menuItem.model";
import { OrderStatus, PaymentStatus } from "../../common/enum";

/**
 * Resolves item display name, showing "(Deleted)" or "Item is deleted" if the menu item was deleted
 */
const resolveItemDisplayName = (mDoc: any, item: any): string => {
  if (!mDoc || mDoc.deleted === true) {
    const originalName = mDoc?.name || mDoc?.title || item.name || item.title || item.variant?.label;
    return originalName ? `${originalName} (Deleted)` : "Item is deleted";
  }
  return mDoc.name || mDoc.title || item.name || item.title || item.variant?.label || "Item";
};

/**
 * GET /api/internal/orders
 * Returns paginated, filtered orders formatted for Business Management.
 * Returns ONLY orders where order status is COMPLETED and payment status is PAID.
 * Only sends: orderNumber, items, totalAmount, paymentMethod, orderType, createdAt.
 */
export const getInternalOrders = async (req: Request, res: Response) => {
  try {
    const { search, startDate, endDate, page = 1, limit = 50 } = req.query;

    const andConditions: any[] = [
      // Enforce order status is COMPLETED
      {
        $or: [
          { status: { $in: ["completed", "COMPLETED", OrderStatus.COMPLETED] } },
          { orderStatus: { $in: ["completed", "COMPLETED", OrderStatus.COMPLETED] } },
        ],
      },
      // Enforce payment status is PAID
      {
        $or: [
          { "payment.status": { $in: ["paid", "PAID", PaymentStatus.PAID] } },
          { paymentStatus: { $in: ["paid", "PAID", PaymentStatus.PAID] } },
        ],
      },
    ];

    if (search) {
      const searchRegex = { $regex: String(search), $options: "i" };
      andConditions.push({
        $or: [
          { orderNumber: searchRegex },
          { "guest.name": searchRegex },
          { "guest.phone": searchRegex },
          { customerName: searchRegex },
          { customerPhone: searchRegex },
        ],
      });
    }

    if (startDate || endDate) {
      const dateFilter: any = {};
      if (startDate) dateFilter.$gte = new Date(startDate as string);
      if (endDate) dateFilter.$lte = new Date(endDate as string);
      andConditions.push({ createdAt: dateFilter });
    }

    const filter: any = { $and: andConditions };

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("user", "name phone email")
        .populate("customer", "name phone email")
        .lean(),
      Order.countDocuments(filter),
    ]);

    // Collect all menuItem IDs across all orders (including soft-deleted ones)
    const menuItemIds = Array.from(
      new Set(
        orders.flatMap((o: any) =>
          (o.items || [])
            .map((item: any) => item.menuItem?._id || item.menuItem)
            .filter((id: any) => id && mongoose.Types.ObjectId.isValid(id.toString()))
            .map((id: any) => id.toString())
        )
      )
    );

    // Fetch all menu items (including soft-deleted ones) using findWithDeleted
    const menuItems = menuItemIds.length > 0
      ? await (MenuItem as any).findWithDeleted({ _id: { $in: menuItemIds } }).select("_id name price title deleted").lean()
      : [];

    const menuItemMap = new Map<string, any>(menuItems.map((m: any) => [m._id.toString(), m]));

    // Format fields: only orderNumber, items, totalAmount, paymentMethod, orderType, createdAt
    const formattedOrders = orders.map((o: any) => ({
      orderNumber: o.orderNumber || o._id.toString().slice(-6).toUpperCase(),
      items: (o.items || []).map((item: any) => {
        const mId = (item.menuItem?._id || item.menuItem || "").toString();
        const mDoc = menuItemMap.get(mId);
        const name = resolveItemDisplayName(mDoc, item);
        const price = item.price ?? mDoc?.price ?? 0;
        const quantity = item.quantity || 1;
        return {
          name,
          quantity,
          price,
          total: price * quantity,
        };
      }),
      totalAmount: o.payment?.totalAmount ?? o.totalAmount ?? o.total ?? 0,
      paymentMethod: o.payment?.method || o.payment?.mode || o.paymentMethod || "ONLINE",
      orderType: (o.orderType || "DINE_IN").toUpperCase(),
      createdAt: o.createdAt,
    }));

    return res.status(200).json({
      success: true,
      data: {
        orders: formattedOrders,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve orders",
      error: error.message,
    });
  }
};

/**
 * GET /api/internal/orders/stats (and /api/internal/orders/summary)
 * Returns financial statistics (totalRevenue, totalDineInOrders, totalTakeawayOrders, totalDeliveryOrders, etc.)
 * Supports optional date range filtering (?startDate=...&endDate=...) and search query (?search=...)
 */
export const getInternalOrdersStats = async (req: Request, res: Response) => {
  try {
    const { search, startDate, endDate } = req.query;

    const andConditions: any[] = [
      // Enforce order status is COMPLETED
      {
        $or: [
          { status: { $in: ["completed", "COMPLETED", OrderStatus.COMPLETED] } },
          { orderStatus: { $in: ["completed", "COMPLETED", OrderStatus.COMPLETED] } },
        ],
      },
      // Enforce payment status is PAID
      {
        $or: [
          { "payment.status": { $in: ["paid", "PAID", PaymentStatus.PAID] } },
          { paymentStatus: { $in: ["paid", "PAID", PaymentStatus.PAID] } },
        ],
      },
    ];

    if (search) {
      const searchRegex = { $regex: String(search), $options: "i" };
      andConditions.push({
        $or: [
          { orderNumber: searchRegex },
          { "guest.name": searchRegex },
          { "guest.phone": searchRegex },
          { customerName: searchRegex },
          { customerPhone: searchRegex },
        ],
      });
    }

    if (startDate || endDate) {
      const dateFilter: any = {};
      if (startDate) dateFilter.$gte = new Date(startDate as string);
      if (endDate) dateFilter.$lte = new Date(endDate as string);
      andConditions.push({ createdAt: dateFilter });
    }

    const filter: any = { $and: andConditions };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [statsAgg, todayStatsAgg] = await Promise.all([
      Order.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalRevenue: {
              $sum: {
                $ifNull: ["$payment.totalAmount", { $ifNull: ["$totalAmount", "$total"] }],
              },
            },
            totalOrders: { $sum: 1 },
            totalDineInOrders: {
              $sum: {
                $cond: [
                  {
                    $in: [
                      { $toLower: { $ifNull: ["$orderType", ""] } },
                      ["dine-in", "dine_in", "dinein"],
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            totalTakeawayOrders: {
              $sum: {
                $cond: [
                  {
                    $in: [
                      { $toLower: { $ifNull: ["$orderType", ""] } },
                      ["pickup", "takeaway", "pick-up"],
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            totalDeliveryOrders: {
              $sum: {
                $cond: [
                  {
                    $in: [
                      { $toLower: { $ifNull: ["$orderType", ""] } },
                      ["delivery"],
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]),
      Order.aggregate([
        {
          $match: {
            ...filter,
            createdAt: { $gte: today },
          },
        },
        {
          $group: {
            _id: null,
            todayRevenue: {
              $sum: {
                $ifNull: ["$payment.totalAmount", { $ifNull: ["$totalAmount", "$total"] }],
              },
            },
            todayOrders: { $sum: 1 },
          },
        },
      ]),
    ]);

    const stats = statsAgg[0] || {
      totalRevenue: 0,
      totalOrders: 0,
      totalDineInOrders: 0,
      totalTakeawayOrders: 0,
      totalDeliveryOrders: 0,
    };

    const todayStats = todayStatsAgg[0] || {
      todayRevenue: 0,
      todayOrders: 0,
    };

    return res.status(200).json({
      success: true,
      data: {
        totalRevenue: stats.totalRevenue || 0,
        totalDineInOrders: stats.totalDineInOrders || 0,
        totalTakeawayOrders: stats.totalTakeawayOrders || 0,
        totalDeliveryOrders: stats.totalDeliveryOrders || 0,
        totalOrders: stats.totalOrders || 0,
        todayRevenue: todayStats.todayRevenue || 0,
        todayOrders: todayStats.todayOrders || 0,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve orders statistics",
      error: error.message,
    });
  }
};

/**
 * GET /api/internal/orders/:orderNumber
 * Returns single order details by unique orderNumber (with fallback to _id).
 * Throws an error if order status is not COMPLETED or payment status is not PAID.
 */
export const getInternalOrderById = async (req: Request, res: Response) => {
  try {
    const rawIdentifier = req.params.orderNumber || req.params.id || "";
    const identifier = (Array.isArray(rawIdentifier) ? rawIdentifier[0] : String(rawIdentifier)).trim();

    if (!identifier) {
      return res.status(400).json({ success: false, message: "Order number is required" });
    }

    // Lookup by unique orderNumber first
    let order: any = await Order.findOne({
      orderNumber: { $regex: new RegExp(`^${identifier}$`, "i") },
    })
      .populate("user", "name phone email")
      .populate("customer", "name phone email")
      .lean();

    // Fallback: If not found and identifier is a valid MongoDB ObjectId, check by _id
    if (!order && mongoose.Types.ObjectId.isValid(identifier)) {
      order = await Order.findById(identifier)
        .populate("user", "name phone email")
        .populate("customer", "name phone email")
        .lean();
    }

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const orderStatus = (order.status || order.orderStatus || "").toString().toUpperCase();
    const paymentStatus = (order.payment?.status || order.paymentStatus || "").toString().toUpperCase();

    // Verify status is COMPLETED and payment status is PAID
    if (orderStatus !== "COMPLETED" || paymentStatus !== "PAID") {
      return res.status(400).json({
        success: false,
        message: `Order #${order.orderNumber || identifier} is not eligible. Status must be COMPLETED and payment status must be PAID (Current order status: ${orderStatus || "UNKNOWN"}, payment status: ${paymentStatus || "UNKNOWN"}).`,
      });
    }

    // Collect menuItem IDs for this order
    const menuItemIds = Array.from(
      new Set(
        (order.items || [])
          .map((item: any) => item.menuItem?._id || item.menuItem)
          .filter((id: any) => id && mongoose.Types.ObjectId.isValid(id.toString()))
          .map((id: any) => id.toString())
      )
    );

    const menuItems = menuItemIds.length > 0
      ? await (MenuItem as any).findWithDeleted({ _id: { $in: menuItemIds } }).select("_id name price title deleted").lean()
      : [];

    const menuItemMap = new Map<string, any>(menuItems.map((m: any) => [m._id.toString(), m]));

    return res.status(200).json({
      success: true,
      data: {
        orderNumber: order.orderNumber || order._id.toString().slice(-6).toUpperCase(),
        customerName: order.customerName || order.guest?.name || order.user?.name || order.customer?.name || "Customer",
        customerPhone: order.customerPhone || order.guest?.phone || order.user?.phone || order.customer?.phone,
        customerEmail: order.customerEmail || order.guest?.email || order.user?.email || order.customer?.email,
        customerAddress: order.deliveryAddress || order.customerAddress || order.address,
        items: (order.items || []).map((item: any) => {
          const mId = (item.menuItem?._id || item.menuItem || "").toString();
          const mDoc = menuItemMap.get(mId);
          const name = resolveItemDisplayName(mDoc, item);
          const price = item.price ?? mDoc?.price ?? 0;
          const quantity = item.quantity || 1;
          return {
            name,
            quantity,
            price,
            total: price * quantity,
          };
        }),
        totalAmount: order.payment?.totalAmount ?? order.totalAmount ?? order.total ?? 0,
        paymentMethod: order.payment?.method || order.payment?.mode || order.paymentMethod || "ONLINE",
        orderType: (order.orderType || "DINE_IN").toUpperCase(),
        deliveryNotes: order.notes || order.deliveryNotes,
        createdAt: order.createdAt,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
