// PIN lock for the whole app and/or the TV tab.
// The PIN is stored as a salted SHA-256 hash in app_setting — a local privacy lock,
// not strong security (anyone who can clear app data can reset it).
import * as Crypto from 'expo-crypto';
import { useSyncExternalStore } from 'react';

import { getSetting, setSetting } from '@/db/repositories';

export const PIN_LENGTH = 4;

const KEY_HASH = 'lock_pin_hash';
const KEY_SALT = 'lock_pin_salt';
const KEY_APP = 'lock_app';
const KEY_TV = 'lock_tv';

export type LockConfig = { hasPin: boolean; lockApp: boolean; lockTv: boolean };

type State = { config: LockConfig; loaded: boolean; appUnlocked: boolean; tvUnlocked: boolean };

let state: State = {
  config: { hasPin: false, lockApp: false, lockTv: false },
  loaded: false,
  appUnlocked: false,
  tvUnlocked: false,
};
const listeners = new Set<() => void>();

function update(patch: Partial<State>) {
  state = { ...state, ...patch };
  for (const l of listeners) l();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function useLockState(): State {
  return useSyncExternalStore(subscribe, () => state);
}

async function hashPin(pin: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${pin}`);
}

export async function loadLockConfig(): Promise<LockConfig> {
  const [hash, app, tv] = await Promise.all([getSetting(KEY_HASH), getSetting(KEY_APP), getSetting(KEY_TV)]);
  const hasPin = Boolean(hash);
  const config = { hasPin, lockApp: hasPin && app === '1', lockTv: hasPin && tv === '1' };
  update({ config, loaded: true });
  return config;
}

export async function setPin(pin: string): Promise<void> {
  const salt = Crypto.randomUUID();
  await setSetting(KEY_SALT, salt);
  await setSetting(KEY_HASH, await hashPin(pin, salt));
  // Whoever just set the PIN is already "inside".
  update({ appUnlocked: true, tvUnlocked: true });
  await loadLockConfig();
}

export async function verifyPin(pin: string): Promise<boolean> {
  const [hash, salt] = await Promise.all([getSetting(KEY_HASH), getSetting(KEY_SALT)]);
  if (!hash || !salt) return false;
  return (await hashPin(pin, salt)) === hash;
}

export async function removePin(): Promise<void> {
  await Promise.all([setSetting(KEY_HASH, ''), setSetting(KEY_APP, '0'), setSetting(KEY_TV, '0')]);
  await loadLockConfig();
}

export async function setLockFlag(which: 'app' | 'tv', on: boolean): Promise<void> {
  // Turning a lock on happens from inside the app — don't lock the current session out.
  if (on) markUnlocked(which);
  await setSetting(which === 'app' ? KEY_APP : KEY_TV, on ? '1' : '0');
  await loadLockConfig();
}

export function markUnlocked(which: 'app' | 'tv') {
  // Unlocking the whole app also opens the TV tab for this session.
  update(which === 'app' ? { appUnlocked: true, tvUnlocked: true } : { tvUnlocked: true });
}

export function relock() {
  update({ appUnlocked: false, tvUnlocked: false });
}
