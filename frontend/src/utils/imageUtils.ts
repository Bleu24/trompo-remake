/**
 * Utility functions for handling image URLs
 */

/**
 * Get the full URL for an image, handling both local uploads and Cloudinary URLs
 * @param imagePath - The image path (could be a local path like "/uploads/..." or a full Cloudinary URL)
 * @returns The full URL to display the image
 */
export const getImageUrl = (imagePath: string | null | undefined): string | null => {
  if (!imagePath) return null;
  
  // If it's already a full URL (Cloudinary), return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // If it's a local path, prepend the API base URL
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
  return `${baseUrl}${imagePath}`;
};

/**
 * Check if an image URL is from Cloudinary
 * @param imageUrl - The image URL to check
 * @returns true if the URL is from Cloudinary
 */
export const isCloudinaryUrl = (imageUrl: string | null | undefined): boolean => {
  if (!imageUrl) return false;
  return imageUrl.includes('cloudinary.com');
};

/**
 * Get a placeholder image URL for when no image is available
 * @param type - The type of placeholder ('profile', 'business', 'product')
 * @returns A placeholder image URL
 */
export const getPlaceholderImage = (type: 'profile' | 'business' | 'product' = 'business'): string => {
  const placeholders = {
    profile: '/api/placeholder/150/150',
    business: '/api/placeholder/300/200',
    product: '/api/placeholder/400/300'
  };
  
  return placeholders[type];
};
