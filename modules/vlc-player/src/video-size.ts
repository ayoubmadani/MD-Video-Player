import { requireOptionalNativeModule } from 'expo';

type VlcPlayerNativeModule = {
  getVideoSize(uri: string): Promise<{ width: number; height: number } | null>;
};

const native = requireOptionalNativeModule<VlcPlayerNativeModule>('VlcPlayer');

/** Display size of a local video (rotation applied). Null if unknown or unsupported. */
export async function getVideoSize(uri: string): Promise<{ width: number; height: number } | null> {
  if (!native?.getVideoSize) return null;
  try {
    return await native.getVideoSize(uri);
  } catch {
    return null;
  }
}
