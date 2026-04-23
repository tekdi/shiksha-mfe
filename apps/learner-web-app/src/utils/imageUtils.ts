/**
 * Transforms image URLs from Azure Blob Storage to AWS S3 URLs
 * @param imageUrl - The image URL to transform
 * @returns Transformed image URL or fallback to feature-two.png
 */
export const transformImageUrl = (imageUrl: string): string => {
  if (!imageUrl) return '/images/feature-two.png';

  if (imageUrl.includes('https://sunbirdsaaspublic.blob.core.windows.net')) {
    // Handle double domain pattern
    if (
      imageUrl.includes(
        'https://sunbirdsaaspublic.blob.core.windows.net/https://sunbirdsaaspublic.blob.core.windows.net'
      )
    ) {
      // Extract everything after the second domain
      const urlParts = imageUrl.split(
        'https://sunbirdsaaspublic.blob.core.windows.net/https://sunbirdsaaspublic.blob.core.windows.net/'
      );
      if (urlParts.length > 1) {
        const pathAfterSecondDomain = urlParts[1];
        // Remove any existing content/content prefix to avoid duplication
        let cleanPath = pathAfterSecondDomain.replace(
          /^content\/content\//,
          ''
        );
        // Remove sunbird-content-prod/schemas/content/ if present
        cleanPath = cleanPath.replace(
          /^sunbird-content-prod\/schemas\/content\//,
          ''
        );
        // Transform to AWS S3 URL with the new pattern
        return `https://s3.ap-south-1.amazonaws.com/saas-prod/content/${cleanPath}`;
      }
    } else {
      // Handle single domain pattern
      const urlParts = imageUrl.split(
        'https://sunbirdsaaspublic.blob.core.windows.net/'
      );
      if (urlParts.length > 1) {
        const pathAfterDomain = urlParts[1];
        // Remove any existing content/content prefix to avoid duplication
        let cleanPath = pathAfterDomain.replace(/^content\/content\//, '');
        // Remove sunbird-content-prod/schemas/content/ if present
        cleanPath = cleanPath.replace(
          /^sunbird-content-prod\/schemas\/content\//,
          ''
        );
        // Transform to AWS S3 URL with the new pattern
        return `https://s3.ap-south-1.amazonaws.com/saas-prod/content/${cleanPath}`;
      }
    }
  }

  return imageUrl;
};
