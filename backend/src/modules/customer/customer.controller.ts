import { Request, Response, NextFunction } from "express";
import { CustomerService } from "./customer.service";
import ApiResponse from "../../utils/ApiResponse";

export class CustomerController {
  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sortBy, order } = req.query as { sortBy?: string; order?: string };
      const customers = await CustomerService.getAll({ sortBy, order });
      res.status(200).json(new ApiResponse(200, customers, "Customers fetched successfully"));
    } catch (error) {
      next(error);
    }
  }
}
