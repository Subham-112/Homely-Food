import { Customer } from "../../models/customer.model";
import Order from "../../models/order.model";
import User from "../../models/user.model";
import mongoose from "mongoose";

export class CustomerService {
  static async getAll() {
    const customers = await Customer.find().sort({ createdAt: -1 });

    const updatedCustomers = await Promise.all(
      customers.map(async (custDoc) => {
        const cust = custDoc.toObject();
        const phone = cust.phone ? cust.phone.trim() : "";

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
        const totalAmountAggregation = await Order.aggregate([
          { $match: orderFilter },
          { $group: { _id: null, total: { $sum: "$totalAmount" } } },
        ]);
        const totalExpenses = totalAmountAggregation.length > 0 ? totalAmountAggregation[0].total : cust.totalExpenses;

        return {
          ...cust,
          orderCount: count,
          totalExpenses,
        };
      })
    );

    return updatedCustomers;
  }
}
