import { CustomerGroup, ICustomerGroup, IGroupDiscount } from "../../models/customerGroup.model";
import { Customer } from "../../models/customer.model";
import mongoose from "mongoose";

export class CustomerGroupService {
  /**
   * Get all customer groups with customer details populated
   */
  static async getAllGroups() {
    const groups = await CustomerGroup.find().sort({ createdAt: -1 });

    // Fetch basic details for each group's members
    const result = await Promise.all(
      groups.map(async (grpDoc) => {
        const grp = grpDoc.toObject();
        const memberCount = grp.customerIds ? grp.customerIds.length : 0;

        return {
          ...grp,
          memberCount,
        };
      })
    );

    return result;
  }

  /**
   * Get single group by ID
   */
  static async getGroupById(groupId: string) {
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      throw new Error("Invalid group ID");
    }

    const group = await CustomerGroup.findById(groupId).populate({
      path: "customerIds",
      select: "primaryName phone orderCount totalExpenses",
    });

    if (!group) {
      throw new Error("Customer group not found");
    }

    return group;
  }

  /**
   * Create a new customer group
   */
  static async createGroup(payload: {
    name: string;
    description?: string;
    color?: string;
    customerIds?: string[];
  }) {
    if (!payload.name || !payload.name.trim()) {
      throw new Error("Group name is required");
    }

    const trimmedName = payload.name.trim();

    // Check if group name already exists
    const existing = await CustomerGroup.findOne({
      name: { $regex: new RegExp(`^${trimmedName}$`, "i") },
    });

    if (existing) {
      throw new Error(`Group with name "${trimmedName}" already exists`);
    }

    const validCustomerIds: mongoose.Types.ObjectId[] = [];
    if (payload.customerIds && Array.isArray(payload.customerIds)) {
      payload.customerIds.forEach((id) => {
        if (mongoose.Types.ObjectId.isValid(id)) {
          validCustomerIds.push(new mongoose.Types.ObjectId(id));
        }
      });
    }

    const newGroup = await CustomerGroup.create({
      name: trimmedName,
      description: payload.description?.trim() || "",
      color: payload.color || "emerald",
      customerIds: validCustomerIds,
      discount: {
        type: "percentage",
        value: 0,
        maxOrdersPerCustomer: 0,
        minOrderAmount: 0,
        active: false,
      },
    });

    return newGroup;
  }

  /**
   * Update basic group information (name, description, color)
   */
  static async updateGroup(
    groupId: string,
    payload: { name?: string; description?: string; color?: string }
  ) {
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      throw new Error("Invalid group ID");
    }

    const group = await CustomerGroup.findById(groupId);
    if (!group) {
      throw new Error("Customer group not found");
    }

    if (payload.name && payload.name.trim()) {
      const trimmedName = payload.name.trim();
      const duplicate = await CustomerGroup.findOne({
        _id: { $ne: groupId },
        name: { $regex: new RegExp(`^${trimmedName}$`, "i") },
      });
      if (duplicate) {
        throw new Error(`Another group with name "${trimmedName}" already exists`);
      }
      group.name = trimmedName;
    }

    if (payload.description !== undefined) {
      group.description = payload.description.trim();
    }

    if (payload.color) {
      group.color = payload.color;
    }

    await group.save();
    return group;
  }

  /**
   * Delete a customer group
   */
  static async deleteGroup(groupId: string) {
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      throw new Error("Invalid group ID");
    }

    const group = await CustomerGroup.findById(groupId);
    if (!group) {
      throw new Error("Customer group not found");
    }

    await (group as any).delete();
    return { success: true, message: "Group deleted successfully" };
  }

  /**
   * Configure / update group discount
   */
  static async updateGroupDiscount(
    groupId: string,
    discountPayload: Partial<IGroupDiscount>
  ) {
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      throw new Error("Invalid group ID");
    }

    const group = await CustomerGroup.findById(groupId);
    if (!group) {
      throw new Error("Customer group not found");
    }

    const currentDiscount = group.discount || {
      type: "percentage",
      value: 0,
      maxOrdersPerCustomer: 0,
      minOrderAmount: 0,
      active: false,
    };

    const type = discountPayload.type || currentDiscount.type;
    const value =
      discountPayload.value !== undefined ? Number(discountPayload.value) : currentDiscount.value;
    const maxOrdersPerCustomer =
      discountPayload.maxOrdersPerCustomer !== undefined
        ? Number(discountPayload.maxOrdersPerCustomer)
        : currentDiscount.maxOrdersPerCustomer;
    const minOrderAmount =
      discountPayload.minOrderAmount !== undefined
        ? Number(discountPayload.minOrderAmount)
        : currentDiscount.minOrderAmount;
    const active =
      discountPayload.active !== undefined ? Boolean(discountPayload.active) : currentDiscount.active;
    const validUntil =
      discountPayload.validUntil !== undefined
        ? discountPayload.validUntil
        : currentDiscount.validUntil;

    if (value < 0) {
      throw new Error("Discount value cannot be negative");
    }

    if (type === "percentage" && value > 100) {
      throw new Error("Percentage discount cannot exceed 100%");
    }

    group.discount = {
      type,
      value,
      maxOrdersPerCustomer: Math.max(0, maxOrdersPerCustomer),
      minOrderAmount: Math.max(0, minOrderAmount),
      active,
      validUntil,
    };

    await group.save();
    return group;
  }

  /**
   * Add or remove customers from a group (Assign / Unassign)
   */
  static async assignCustomers(
    groupId: string,
    customerIds: string[],
    action: "add" | "remove" | "set" = "add"
  ) {
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      throw new Error("Invalid group ID");
    }

    const group = await CustomerGroup.findById(groupId);
    if (!group) {
      throw new Error("Customer group not found");
    }

    const objectIds = customerIds
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    const currentSet = new Set(group.customerIds.map((id) => id.toString()));

    if (action === "add") {
      objectIds.forEach((id) => currentSet.add(id.toString()));
    } else if (action === "remove") {
      objectIds.forEach((id) => currentSet.delete(id.toString()));
    } else if (action === "set") {
      currentSet.clear();
      objectIds.forEach((id) => currentSet.add(id.toString()));
    }

    group.customerIds = Array.from(currentSet).map((id) => new mongoose.Types.ObjectId(id));
    await group.save();

    return group;
  }

  /**
   * Find group membership and active discount perk for a given customer or phone
   */
  static async getCustomerPerk(customerIdOrPhone: string) {
    let customerDoc = null;

    if (mongoose.Types.ObjectId.isValid(customerIdOrPhone)) {
      customerDoc = await Customer.findById(customerIdOrPhone);
      if (!customerDoc) {
        // Might be a User ID
        customerDoc = await Customer.findOne({ user: customerIdOrPhone });
      }
    }

    if (!customerDoc) {
      customerDoc = await Customer.findOne({ phone: customerIdOrPhone.trim() });
    }

    if (!customerDoc) {
      return null;
    }

    const custId = customerDoc._id;

    // Find any group this customer belongs to
    const groups = await CustomerGroup.find({
      customerIds: custId,
    });

    if (!groups || groups.length === 0) {
      return null;
    }

    // Find active group discount (prioritize the one with active discount)
    const activeGroup = groups.find((g) => g.discount && g.discount.active) || groups[0];

    const usedMap = activeGroup.usedCounts || new Map();
    const usedCount =
      typeof usedMap.get === "function"
        ? usedMap.get(custId.toString()) || 0
        : (usedMap as any)[custId.toString()] || 0;

    return {
      group: {
        id: activeGroup._id,
        name: activeGroup.name,
        color: activeGroup.color,
      },
      discount: activeGroup.discount,
      usedOrdersCount: usedCount,
      remainingOrders:
        activeGroup.discount && activeGroup.discount.maxOrdersPerCustomer > 0
          ? Math.max(0, activeGroup.discount.maxOrdersPerCustomer - usedCount)
          : null, // null means unlimited
    };
  }

  /**
   * Record a discount order usage for a customer
   */
  static async recordUsage(groupId: string, customerId: string) {
    if (!mongoose.Types.ObjectId.isValid(groupId)) return;

    const group = await CustomerGroup.findById(groupId);
    if (!group) return;

    const usedMap = group.usedCounts || new Map();
    const current =
      typeof usedMap.get === "function"
        ? usedMap.get(customerId) || 0
        : (usedMap as any)[customerId] || 0;

    if (typeof usedMap.set === "function") {
      usedMap.set(customerId, current + 1);
    } else {
      (usedMap as any)[customerId] = current + 1;
    }

    group.usedCounts = usedMap;
    group.markModified("usedCounts");
    await group.save();
  }
}
