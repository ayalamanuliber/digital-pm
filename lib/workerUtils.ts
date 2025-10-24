// Worker utility functions

/**
 * Generate a random 4-digit PIN for worker login
 */
export function generateWorkerPin(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Get the full worker login URL
 */
export function getWorkerLoginUrl(): string {
  if (typeof window === 'undefined') {
    return 'https://digital-pm-skku.vercel.app/worker-login';
  }
  const baseUrl = window.location.origin;
  return `${baseUrl}/worker-login`;
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers or non-HTTPS
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        textArea.remove();
        return true;
      } catch (error) {
        textArea.remove();
        return false;
      }
    }
  } catch (error) {
    console.error('Failed to copy:', error);
    return false;
  }
}

/**
 * Format PIN for display (adds spaces: 1234 -> 1 2 3 4)
 */
export function formatPin(pin: string): string {
  return pin.split('').join(' ');
}
