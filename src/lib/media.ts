/**
 * Automatically injects format and quality transformations (f_auto, q_auto)
 * into Cloudinary URLs to deliver heavily compressed media assets with zero perceived quality loss.
 */
export function optimizeCloudinaryUrl(url: string | null | undefined): string {
  if (!url) return "";
  
  // If the asset is not hosted on Cloudinary, return the original URL as-is
  if (!url.includes("res.cloudinary.com")) return url;
  
  // Prevent duplicating parameters if they are already present
  if (url.includes("/f_auto") || url.includes("/q_auto")) return url;
  
  const uploadMarker = "/upload/";
  const uploadIndex = url.indexOf(uploadMarker);
  
  if (uploadIndex === -1) return url;
  
  // Insert f_auto,q_auto transformation parameters immediately after the '/upload/' URL path
  const insertIndex = uploadIndex + uploadMarker.length;
  const transformations = "f_auto,q_auto/";
  
  return url.slice(0, insertIndex) + transformations + url.slice(insertIndex);
}
