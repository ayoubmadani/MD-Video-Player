// In-memory channel order for prev/next zapping in the TV player.
// Set by the TV tab right before opening a channel, so the player follows the list exactly
// as it was shown (groups, search, favorites filter). Too large for route params.

export type ZapChannel = { streamUrl: string; name: string };

let list: ZapChannel[] = [];

export function setZapList(channels: ZapChannel[]) {
  list = channels;
}

export function getZapList(): ZapChannel[] {
  return list;
}

/** Index of `streamUrl` moved by `step` (wrapping), or -1 when the channel isn't in the list. */
export function zapIndex(channels: ZapChannel[], streamUrl: string, step: number): number {
  const at = channels.findIndex((c) => c.streamUrl === streamUrl);
  if (at < 0 || channels.length === 0) return -1;
  return (((at + step) % channels.length) + channels.length) % channels.length;
}
