import { Customer } from "../../models/customer.model";

export class CustomerService {
  static async getAll() {
    return await Customer.find().sort({ createdAt: -1 });
  }
}
