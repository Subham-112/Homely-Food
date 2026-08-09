import { Request } from "express";

export interface UploadImageOptions {
  folder: string | ((req: Request) => string);
  subFolder?: string;
  publicId?: string;
  resourceType?: "image" | "video" | "raw";
  multiple?: boolean;
  maxCount?: number;
}

export interface UploadedImage {
  url: string;
  publicId: string;
  width: number;
  height: number;
  bytes: number;
  format: string;
}

export interface UploadedFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}
