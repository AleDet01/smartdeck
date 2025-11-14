/**
 * Image Optimization Utilities
 * Lazy loading, WebP support detection, placeholder blur
 */

/**
 * Check if browser supports WebP
 */
export function supportsWebP() {
  if (typeof window === 'undefined') return false;
  
  const canvas = document.createElement('canvas');
  if (canvas.getContext && canvas.getContext('2d')) {
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }
  return false;
}

/**
 * Get optimized image source with WebP fallback
 */
export function getOptimizedImageSrc(basePath, ext = 'jpg') {
  const webpSupported = supportsWebP();
  
  if (webpSupported && ext !== 'svg') {
    return basePath.replace(`.${ext}`, '.webp');
  }
  
  return basePath;
}

/**
 * Create blur placeholder for lazy loaded images
 * Uses tiny base64 encoded image for instant display
 */
export function createBlurPlaceholder(width, height, color = '#667eea') {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);
  
  return canvas.toDataURL('image/jpeg', 0.1);
}

/**
 * Intersection Observer for lazy loading images
 * More performant than scroll events
 */
export function lazyLoadImages(selector = 'img[data-src]') {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.add('loaded');
          observer.unobserve(img);
        }
      });
    }, {
      rootMargin: '50px 0px', // Start loading 50px before entering viewport
      threshold: 0.01
    });

    document.querySelectorAll(selector).forEach(img => {
      imageObserver.observe(img);
    });
  } else {
    // Fallback for old browsers
    document.querySelectorAll(selector).forEach(img => {
      img.src = img.dataset.src;
    });
  }
}

/**
 * Preload critical images
 */
export function preloadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Batch preload multiple images
 */
export async function preloadImages(srcArray) {
  const promises = srcArray.map(src => preloadImage(src));
  return Promise.all(promises);
}

/**
 * Convert image to base64
 * Useful for small icons/logos to reduce HTTP requests
 */
export function imageToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Compress image client-side before upload
 * Reduces bandwidth and upload time
 */
export function compressImage(file, maxWidth = 1920, maxHeight = 1080, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Calculate new dimensions maintaining aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = height * (maxWidth / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = width * (maxHeight / height);
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            resolve(new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            }));
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = reject;
      img.src = e.target.result;
    };
    
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Generate responsive image srcset
 */
export function generateSrcSet(basePath, sizes = [320, 640, 1024, 1920]) {
  return sizes
    .map(size => `${basePath.replace(/\.(jpg|png)$/, `-${size}w.$1`)} ${size}w`)
    .join(', ');
}
