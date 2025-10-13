/**
 * Upload helper for durable file copy
 * Ensures media files are copied to documentDirectory before upload
 * to prevent "file does not exist" errors
 */

import { Platform } from 'react-native';
import { eventService } from '../../services/events';

let FileSystem: any = null;

const getFileSystem = async () => {
  if (Platform.OS === 'web') return null;
  if (!FileSystem) {
    try {
      FileSystem = await import('expo-file-system/legacy');
    } catch (error) {
      console.warn('[Upload] expo-file-system not available');
      return null;
    }
  }
  return FileSystem;
};

/**
 * Copy a temporary file (from camera/picker) to documentDirectory
 * Returns the durable URI that can be safely used for upload
 */
export async function persistBeforeUpload(
  tempUri: string,
  filename?: string
): Promise<string> {
  try {
    eventService.emit('upload_persist_start', { tempUri });

    if (Platform.OS === 'web') {
      // Web: return URI as-is (already in memory/blob)
      return tempUri;
    }

    const FS = await getFileSystem();
    if (!FS) {
      console.warn('[Upload] FileSystem not available, returning original URI');
      return tempUri;
    }

    // Generate filename if not provided
    const finalFilename =
      filename || `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Ensure filename has extension
    let filenameWithExt = finalFilename;
    if (!filenameWithExt.includes('.')) {
      // Try to extract extension from tempUri
      const uriParts = tempUri.split('.');
      const ext = uriParts[uriParts.length - 1];
      if (ext && ext.length <= 4) {
        filenameWithExt = `${finalFilename}.${ext}`;
      } else {
        filenameWithExt = `${finalFilename}.jpg`; // default to jpg
      }
    }

    const destUri = `${FS.documentDirectory}${filenameWithExt}`;

    // Check if source file exists
    const sourceInfo = await FS.getInfoAsync(tempUri);
    if (!sourceInfo.exists) {
      throw new Error(`Source file does not exist: ${tempUri}`);
    }

    // Copy file to documentDirectory
    await FS.copyAsync({
      from: tempUri,
      to: destUri,
    });

    eventService.emit('upload_persist_success', { tempUri, destUri });

    return destUri;
  } catch (error) {
    eventService.emit('upload_persist_failure', { tempUri, error: error?.message });
    console.error('[Upload] Failed to persist file:', error);
    // Return original URI as fallback
    return tempUri;
  }
}

/**
 * Clean up temporary files after successful upload
 */
export async function cleanupTempFile(uri: string): Promise<void> {
  try {
    if (Platform.OS === 'web') return;

    const FS = await getFileSystem();
    if (!FS) return;

    // Only delete from cacheDirectory (don't delete from documentDirectory)
    if (uri.includes('/cache/') || uri.includes('/tmp/')) {
      await FS.deleteAsync(uri, { idempotent: true });
      eventService.emit('upload_cleanup_success', { uri });
    }
  } catch (error) {
    console.error('[Upload] Failed to cleanup temp file:', error);
  }
}

/**
 * Get file info (size, exists, etc.)
 */
export async function getFileInfo(uri: string): Promise<any> {
  try {
    if (Platform.OS === 'web') {
      return { exists: true, uri };
    }

    const FS = await getFileSystem();
    if (!FS) {
      return { exists: false };
    }

    return await FS.getInfoAsync(uri);
  } catch (error) {
    console.error('[Upload] Failed to get file info:', error);
    return { exists: false };
  }
}

