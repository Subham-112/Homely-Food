import { Schema } from "mongoose";

export interface IImage {
  url: string;
  key?: string;
  name?: string;
  size?: number;
  mimetype?: string;
  publicId?: string;
}

export const ImageSchema = new Schema<IImage>(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },
    key: { type: String, trim: true },
    name: { type: String, trim: true },
    size: { type: Number },
    mimetype: { type: String, trim: true },
    publicId: { type: String, trim: true },
  },
  { _id: false, versionKey: false }
);
