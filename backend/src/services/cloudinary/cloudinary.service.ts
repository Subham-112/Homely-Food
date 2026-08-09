import streamifier from "streamifier";
import cloudinary from "../../config/cloudinary";
import {
  UploadImageOptions,
  UploadedImage,
  UploadedFile,
} from "./cloudinary.types";

const cloudinaryService = {
  /**
   * Upload Image
   */
  async uploadImage(
    file: UploadedFile,
    options: UploadImageOptions
  ): Promise<UploadedImage> {
    const folder =
      typeof options.folder === "string"
        ? options.subFolder
          ? `${options.folder}/${options.subFolder}`
          : options.folder
        : undefined;

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          public_id: options.publicId,
          overwrite: true,
          resource_type: "image",
          format: "webp",
          quality: "auto:eco",
          transformation: [{ width: 1200, crop: "limit" }],
        },
        (error, result) => {
          if (error || !result) {
            console.error("❌ [Cloudinary Service] Upload Failed:", error);
            return reject(error);
          }

          console.log(
            `✅ [Cloudinary Service] Upload Success! Public ID: ${result.public_id} | Format: ${result.format} | Size: ${result.bytes} bytes | Time: ${new Date().toISOString()}`
          );

          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
            bytes: result.bytes,
            format: result.format,
          });
        }
      );

      console.log(
        `⏳ [Cloudinary Service] Starting stream upload to Cloudinary... Time: ${new Date().toISOString()}`
      );
      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  },

  /**
   * Delete Image
   */
  async deleteImage(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
  },

  /**
   * Generate Presigned Signature for Client Direct Upload
   */
  generateSignature(folder: string = "homely_food") {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        folder,
      },
      cloudinary.config().api_secret!
    );

    return {
      timestamp,
      signature,
      apiKey: cloudinary.config().api_key,
      cloudName: cloudinary.config().cloud_name,
      folder,
    };
  },

  /**
   * Delete Folder
   */
  async deleteFolder(folder: string): Promise<void> {
    await cloudinary.api.delete_resources_by_prefix(folder);
    await cloudinary.api.delete_folder(folder);
  },
};

export default cloudinaryService;
