// Fetch + classify a TV playlist URL (IPTV .m3u channel list or raw .m3u8 HLS), or import a local file.
import { File } from 'expo-file-system';

import {
  absoluteStreamsOnly,
  defaultPlaylistName,
  parseM3u,
  playlistNameFromFile,
  type M3uContent,
  type ParsedChannel,
} from './parse';

const PLAYLIST_TIMEOUT_MS = 120_000;

export type FetchedTvPlaylist = { name: string; content: M3uContent };

export async function fetchTvPlaylist(url: string): Promise<FetchedTvPlaylist> {
  // Big IPTV lists (tens of thousands of channels) on slow servers can take well over 20s.
  let text: string;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(PLAYLIST_TIMEOUT_MS) });
    if (!res.ok) throw new Error(`Server responded ${res.status}`);
    text = await res.text();
  } catch (err) {
    if (err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError')) {
      throw new Error('The playlist server took too long to respond. Check your connection and try again.');
    }
    throw err;
  }
  const content = parseM3u(text, url);
  if (content.kind === 'invalid') throw new Error('Not a valid M3U/M3U8 file');
  return { name: defaultPlaylistName(url, content.kind), content };
}

/** Single playable entry for an HLS master (the player picks the variant). */
export function hlsAsChannel(url: string, name: string): ParsedChannel[] {
  return [{ name, streamUrl: url, logoUrl: null, groupName: null }];
}

export type ImportedTvPlaylist = { sourceUri: string; name: string; channels: ParsedChannel[] };

/**
 * Let the user pick an .m3u/.m3u8 file stored on the device and parse its channels.
 * Resolves null when the picker is cancelled. Any MIME type is allowed because file
 * managers label playlists inconsistently (octet-stream, text/plain, mpegurl...).
 */
export async function importTvPlaylistFile(): Promise<ImportedTvPlaylist | null> {
  const picked = await File.pickFileAsync({ mimeTypes: '*/*' });
  if (picked.canceled || !picked.result) return null;
  const file = picked.result;
  const text = await file.text();
  const content = parseM3u(text, file.uri);
  if (content.kind === 'hls') {
    throw new Error('This file is a single HLS stream, not a channel list. Add it by its URL instead.');
  }
  if (content.kind === 'invalid') throw new Error('Not a valid M3U/M3U8 playlist file.');
  const channels = absoluteStreamsOnly(content.channels);
  if (channels.length === 0) {
    throw new Error('No playable channel links were found in this file.');
  }
  return { sourceUri: file.uri, name: playlistNameFromFile(file.name), channels };
}
