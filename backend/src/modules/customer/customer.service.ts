import { Customer } from "../../models/customer.model";
import { CustomerGroup } from "../../models/customerGroup.model";
import Order from "../../models/order.model";
import User from "../../models/user.model";
import mongoose from "mongoose";

export type CustomerSortBy = "name" | "orderCount" | "totalExpenses";
export type CustomerSortOrder = "asc" | "desc";

export interface CustomerQueryOptions {
  sortBy?: string;
  order?: string;
}

export class CustomerService {
  static async getAll(options?: CustomerQueryOptions) {
    const [customers, allGroups] = await Promise.all([
      Customer.find().sort({ createdAt: -1 }).select("-deleted -createdAt -updatedAt -__v"),
      CustomerGroup.find().select("_id name color customerIds discount"),
    ]);

    // Build a lookup map of customerId -> groups
    const customerGroupMap = new Map<string, Array<{ id: string; name: string; color: string; discount?: any }>>();
    allGroups.forEach((g) => {
      const groupData = {
        id: g._id.toString(),
        name: g.name,
        color: g.color || "emerald",
        discount: g.discount,
      };
      if (Array.isArray(g.customerIds)) {
        g.customerIds.forEach((cId) => {
          const strId = cId.toString();
          if (!customerGroupMap.has(strId)) {
            customerGroupMap.set(strId, []);
          }
          customerGroupMap.get(strId)!.push(groupData);
        });
      }
    });

    const updatedCustomers = await Promise.all(
      customers.map(async (custDoc) => {
        const cust = custDoc.toObject();
        const phone = cust.phone ? cust.phone.trim() : "";
        (cust as any).groups = customerGroupMap.get(cust._id.toString()) || [];

        if (!phone) {
          return cust;
        }

        // Match phone across User and Customer models exactly like OrderService
        const [matchingUsers, matchingCustomers] = await Promise.all([
          User.find({ phone }).select("_id"),
          Customer.find({ phone }).select("_id user"),
        ]);

        const matchedUserIds = matchingUsers.map((u) => u._id);
        const matchedCustomerIds = matchingCustomers.map((c) => c._id);
        matchingCustomers.forEach((c) => {
          if (c.user) matchedUserIds.push(c.user);
        });

        if (cust.user) {
          matchedUserIds.push(cust.user);
        }
        matchedCustomerIds.push(cust._id);

        const orderFilter = {
          deleted: { $ne: true },
          $or: [
            { user: { $in: matchedUserIds } },
            { customer: { $in: matchedCustomerIds } },
            { "guest.phone": phone },
          ],
        };

        const count = await Order.countDocuments(orderFilter);
        
        // Sum totalExpenses accurately from all orders matching the customer's phone
        // Support both $payment.totalAmount (new structure) and $totalAmount (legacy structure)
        const totalAmountAggregation = await Order.aggregate([
          { $match: orderFilter },
          {
            $group: {
              _id: null,
              total: {
                $sum: {
                  $ifNull: ["$payment.totalAmount", { $ifNull: ["$totalAmount", 0] }],
                },
              },
            },
          },
        ]);
        const totalExpenses = totalAmountAggregation.length > 0 ? totalAmountAggregation[0].total : cust.totalExpenses;

        return {
          ...cust,
          orderCount: count,
          totalExpenses,
        };
      })
    );

    const sortBy = options?.sortBy?.toLowerCase();
    const orderDirection = options?.order?.toLowerCase() === "asc" ? 1 : -1;

    if (sortBy === "name") {
      updatedCustomers.sort((a, b) => {
        const nameA = (a.primaryName || "").trim();
        const nameB = (b.primaryName || "").trim();
        return nameA.localeCompare(nameB, undefined, { sensitivity: "base" }) * orderDirection;
      });
    } else if (sortBy === "ordercount" || sortBy === "orders") {
      updatedCustomers.sort((a, b) => {
        const countA = a.orderCount || 0;
        const countB = b.orderCount || 0;
        return (countA - countB) * orderDirection;
      });
    } else if (sortBy === "totalexpenses" || sortBy === "spent") {
      updatedCustomers.sort((a, b) => {
        const spentA = a.totalExpenses || 0;
        const spentB = b.totalExpenses || 0;
        return (spentA - spentB) * orderDirection;
      });
    }

    return updatedCustomers;
  }
}
