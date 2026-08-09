import { NextFunction, Request, Response } from "express";
import multer from "multer";
import cloudinaryService from "../services/cloudinary/cloudinary.service";

interface UploadOptions {
  folder: string | ((req: Request) => string);
  multiple?: boolean;
  maxCount?: number;
}

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },

  fileFilter(req, file, cb) {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed."));
    }

    cb(null, true);
  },
});

export const uploadImage = (options: UploadOptions) => {
  const uploader = options.multiple
    ? upload.array("images", options.maxCount ?? 10)
    : upload.single("image");

  return async (req: Request, res: Response, next: NextFunction) => {
    uploader(req, res, async (err) => {
      if (err) {
        return next(err);
      }

      try {
        const folder =
          typeof options.folder === "function"
            ? options.folder(req)
            : options.folder;

        if (options.multiple) {
          const files = req.files as Express.Multer.File[];
          if (files && files.length > 0) {
            const uploadedFiles = await Promise.all(
              files.map((file) =>
                cloudinaryService.uploadImage(file, {
                  folder,
                })
              )
            );
            (req as any).uploadedFiles = uploadedFiles;
          }
        } else {
          if (req.file) {
            const uploadedFile = await cloudinaryService.uploadImage(req.file, {
              folder,
            });
            (req as any).uploadedFile = uploadedFile;
          }
        }

        next();
      } catch (error) {
        next(error);
      }
    });
  };
};
