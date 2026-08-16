import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
  api_key: process.env.CLOUDINARY_API_KEY || "",
  api_secret: process.env.CLOUDINARY_API_SECRET || "",
  secure: true,
});

export { cloudinary };

// Generate signed parameters for secure uploads directly from the browser
export function getUploadSignature(folder: string = "kinetic_code_labs") {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

  if (!apiSecret || !apiKey || !cloudName) {
    // If not configured, we'll return mock info for local-only testing
    // to prevent application crash before user adds credentials.
    return {
      signature: "mock_signature",
      timestamp,
      folder,
      apiKey: "mock_api_key",
      cloudName: "mock_cloud_name",
      isMock: true,
    };
  }

  const paramsToSign = {
    timestamp,
    folder,
  };

  const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

  return {
    signature,
    timestamp,
    folder,
    apiKey,
    cloudName,
    isMock: false,
  };
}

// Delete media from Cloudinary (works for images, videos, etc.)
export async function deleteFromCloudinary(publicId: string, resourceType: "image" | "video" = "image") {
  try {
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!apiSecret) return { result: "mock_delete" };

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return result;
  } catch (error) {
    console.error("Cloudinary deletion error:", error);
    return null;
  }
}
