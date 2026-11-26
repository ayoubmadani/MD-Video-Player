import { Ionicons } from '@expo/vector-icons';
import { useEventListener } from 'expo';
import { router, useLocalSearchParams } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { StatusBar } from 'expo-status-bar';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TvLockGate } from '@/components/tv-lock-gate';
import { colors, font, radius, spacing } from '@/theme';

// Distinguish "no internet" from "stream dead/geo-blocked": if the device can
// reach the URL, the failure is the stream itself. HEAD is enough; some servers
// reject it (405) but answering at all means the network path works.
const MAX_AUTO_RETRIES = 6;

async function probeReachable(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(6000) });
    return res.status < 500;
  } catch {
    return false;
  }
}

function TvPlayerScreenContent() {
  const { stream, name } = useLocalSearchParams<{ stream: string; name: string }>();
  const insets = useSafeAreaInsets();
  const [error, setError] = useState<string | null>(null);
  const [probing, setProbing] = useState(false);
  const [reconnecting, setReconnecting] = useState(0); // current auto-retry attempt, 0 = none
  const attemptsRef = useRef(0);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const player = useVideoPlayer(String(stream ?? ''), (p) => {
    p.keepScreenOnWhilePlaying = true;
    p.play();
  });

  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => undefined);
    return () => {
      ScreenOrientation.unlockAsync().catch(() => undefined);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (retryTimer.current) clearTimeout(retryTimer.current);
    };
  }, []);

  const reload = useCallback(() => {
    player
      .replaceAsync(String(stream ?? ''))
      .then(() => player.play())
      .catch(() => undefined);
  }, [player, stream]);

  useEventListener(player, 'statusChange', ({ status }) => {
    if (status === 'error' && attemptsRef.current < MAX_AUTO_RETRIES) {
      // Live IPTV streams drop often (network blips, server resets): reconnect quietly first.
      attemptsRef.current += 1;
      setReconnecting(attemptsRef.current);
      setError(null);
      const delay = Math.min(2000 * 2 ** (attemptsRef.current - 1), 15000);
      if (retryTimer.current) clearTimeout(retryTimer.current);
      retryTimer.current = setTimeout(reload, delay);
      return;
    }
    if (status === 'error') {
      setReconnecting(0);
      setProbing(true);
      setError(null);
      probeReachable(String(stream ?? ''))
        .then((ok) => {
          setError(
            ok
              ? 'Stream unavailable — this channel may be dead or geo-blocked.'
              : 'No internet connection.',
          );
        })
        .finally(() => setProbing(false));
      return;
    }
    if (status === 'readyToPlay') {
      attemptsRef.current = 0;
      setReconnecting(0);
      setError(null);
    }
  });

  const retry = () => {
    attemptsRef.current = 0;
    setReconnecting(0);
    setError(null);
    player.replaceAsync(String(stream ?? '')).then(() => player.play()).catch(() => setError('Could not load the stream.'));
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        nativeControls={false}
        contentFit="contain"
        fullscreenOptions={{ enable: false }}
      />
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={() => (player.playing ? player.pause() : player.play())}
      />

      {/* TOP BAR */}
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.xs }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {name ?? 'Live TV'}
        </Text>
        <View style={{ width: 38 }} />
      </View>

      {reconnecting > 0 && !error && !probing ? (
        <View style={styles.errorOverlay} pointerEvents="none">
          <View style={styles.errorCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.errorText}>
              Reconnecting… ({reconnecting}/{MAX_AUTO_RETRIES})
            </Text>
          </View>
        </View>
      ) : null}

      {/* ERROR OVERLAY */}
      {error || probing ? (
        <View style={styles.errorOverlay} pointerEvents="box-none">
          <View style={styles.errorCard}>
            {probing ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : (
              <>
                <Ionicons
                  name={error?.includes('internet') ? 'cloud-offline-outline' : 'alert-circle-outline'}
                  size={40}
                  color={colors.textSecondary}
                />
                <Text style={styles.errorText}>{error}</Text>
                <Pressable onPress={retry} style={({ pressed }) => [styles.retryBtn, pressed && { opacity: 0.7 }]}>
                  <Ionicons name="refresh" size={16} color={colors.onPrimary} />
                  <Text style={styles.retryText}>Retry</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.playerBackground,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  back: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: font.heading,
    fontWeight: '800',
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: spacing.xl,
  },
  errorCard: {
    alignItems: 'center',
    gap: spacing.base,
    maxWidth: 360,
  },
  errorText: {
    color: colors.textPrimary,
    fontSize: font.body,
    textAlign: 'center',
    fontWeight: '600',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  retryText: {
    color: colors.onPrimary,
    fontSize: font.body,
    fontWeight: '800',
  },
});

export default function TvPlayerScreen() {
  return (
    <TvLockGate canGoBack>
      <TvPlayerScreenContent />
    </TvLockGate>
  );
}
