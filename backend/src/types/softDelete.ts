import { Document, Model } from "mongoose";

export interface ISoftDeleteDocument extends Document {
  deleted?: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  delete(
    deletedBy?: string,
    fn?: (err: Error | null, doc: Document) => void
  ): Promise<Document>;
  restore(fn?: (err: Error | null, doc: Document) => void): Promise<Document>;
}

export interface ISoftDeleteModel<T extends Document> extends Model<T> {
  delete(
    conditions?: any,
    deletedBy?: any,
    callback?: (err: Error | null) => void
  ): any;
  deleteById(
    id?: string,
    deletedBy?: any,
    callback?: (err: Error | null) => void
  ): any;
  restore(conditions?: any, callback?: (err: Error | null) => void): any;
  findDeleted(conditions?: any): any;
  findOneDeleted(conditions?: any): any;
  countDeleted(conditions?: any): any;
}
