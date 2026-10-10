import { Request, Response } from "express";
import { CustomerGroupService } from "./customerGroup.service";

export class CustomerGroupController {
  static async getAll(req: Request, res: Response) {
    try {
      const groups = await CustomerGroupService.getAllGroups();
      return res.status(200).json({
        success: true,
        data: groups,
      });
    } catch (err: any) {
      console.error("Error in CustomerGroupController.getAll:", err);
      return res.status(500).json({
        success: false,
        message: err?.message || "Failed to fetch customer groups",
      });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const group = await CustomerGroupService.getGroupById(id);
      return res.status(200).json({
        success: true,
        data: group,
      });
    } catch (err: any) {
      console.error("Error in CustomerGroupController.getById:", err);
      return res.status(400).json({
        success: false,
        message: err?.message || "Failed to fetch customer group",
      });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const { name, description, color, customerIds } = req.body;
      const group = await CustomerGroupService.createGroup({
        name,
        description,
        color,
        customerIds,
      });
      return res.status(201).json({
        success: true,
        message: "Customer group created successfully",
        data: group,
      });
    } catch (err: any) {
      console.error("Error in CustomerGroupController.create:", err);
      return res.status(400).json({
        success: false,
        message: err?.message || "Failed to create customer group",
      });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const { name, description, color } = req.body;
      const updated = await CustomerGroupService.updateGroup(id, { name, description, color });
      return res.status(200).json({
        success: true,
        message: "Customer group updated successfully",
        data: updated,
      });
    } catch (err: any) {
      console.error("Error in CustomerGroupController.update:", err);
      return res.status(400).json({
        success: false,
        message: err?.message || "Failed to update customer group",
      });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const result = await CustomerGroupService.deleteGroup(id);
      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (err: any) {
      console.error("Error in CustomerGroupController.delete:", err);
      return res.status(400).json({
        success: false,
        message: err?.message || "Failed to delete customer group",
      });
    }
  }

  static async updateDiscount(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const { type, value, maxOrdersPerCustomer, minOrderAmount, active, validUntil } = req.body;
      const updated = await CustomerGroupService.updateGroupDiscount(id, {
        type,
        value,
        maxOrdersPerCustomer,
        minOrderAmount,
        active,
        validUntil,
      });
      return res.status(200).json({
        success: true,
        message: "Group discount updated successfully",
        data: updated,
      });
    } catch (err: any) {
      console.error("Error in CustomerGroupController.updateDiscount:", err);
      return res.status(400).json({
        success: false,
        message: err?.message || "Failed to update group discount",
      });
    }
  }

  static async assignCustomers(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const { customerIds, action } = req.body; // action: 'add' | 'remove' | 'set'
      if (!Array.isArray(customerIds)) {
        return res.status(400).json({
          success: false,
          message: "customerIds must be an array of IDs",
        });
      }
      const updated = await CustomerGroupService.assignCustomers(id, customerIds, action || "add");
      return res.status(200).json({
        success: true,
        message: "Customers updated in group successfully",
        data: updated,
      });
    } catch (err: any) {
      console.error("Error in CustomerGroupController.assignCustomers:", err);
      return res.status(400).json({
        success: false,
        message: err?.message || "Failed to assign customers",
      });
    }
  }

  static async getPerk(req: Request, res: Response) {
    try {
      const customerIdOrPhone = String(req.params.customerIdOrPhone);
      const perk = await CustomerGroupService.getCustomerPerk(customerIdOrPhone);
      return res.status(200).json({
        success: true,
        data: perk,
      });
    } catch (err: any) {
      console.error("Error in CustomerGroupController.getPerk:", err);
      return res.status(400).json({
        success: false,
        message: err?.message || "Failed to get customer perk",
      });
    }
  }
}
