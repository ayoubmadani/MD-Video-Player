import { Directory } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library/legacy';

export type PickedFolder = { uri: string; name: string };

/** Sentinel root URI: index every video Android's media store knows about (no folder picking). */
export const ALL_VIDEOS_URI = 'mediastore://videos';
export const ALL_VIDEOS_NAME = 'All videos on this device';

export function isAllVideosRoot(uri: string | null | undefined): boolean {
  return uri === ALL_VIDEOS_URI;
}

/** Asks for the Android "Videos" permission. Resolves true when access is granted. */
export async function requestAllVideosAccess(): Promise<boolean> {
  try {
    const res = await MediaLibrary.requestPermissionsAsync(false, ['video']);
    return res.granted;
  } catch {
    return false;
  }
}

export async function hasAllVideosAccess(): Promise<boolean> {
  try {
    const res = await MediaLibrary.getPermissionsAsync(false, ['video']);
    return res.granted;
  } catch {
    return false;
  }
}

export async function pickMovieFolder(): Promise<PickedFolder | null> {
  try {
    const dir = await Directory.pickDirectoryAsync();
    if (!dir?.uri) return null;
    return { uri: dir.uri.replace(/\/+$/, ''), name: dir.name || 'Movie' };
  } catch {
    return null;
  }
}

export async function rootStillAccessible(uri: string): Promise<boolean> {
  if (isAllVideosRoot(uri)) return hasAllVideosAccess();
  return folderStillAccessible(uri);
}

export function folderStillAccessible(uri: string): boolean {
  try {
    const dir = new Directory(uri);
    if (!dir.exists) return false;
    dir.list();
    return true;
  } catch {
    return false;
  }
}
