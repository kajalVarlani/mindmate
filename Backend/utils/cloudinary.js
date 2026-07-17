import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export const uploadFile = async (filePath) => {
  try {
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      const result = await cloudinary.uploader.upload(filePath, {
        resource_type: "auto",
      });
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return result.secure_url;
    }

    const fileName = filePath.split(/[/\\]/).pop();
    return `/uploads/${fileName}`;
  } catch (err) {
    console.error("Cloudinary upload failed:", err);
    const fileName = filePath.split(/[/\\]/).pop();
    return `/uploads/${fileName}`;
  }
};
export default uploadFile;
