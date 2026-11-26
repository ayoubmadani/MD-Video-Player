import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { fetchTvPlaylist, hlsAsChannel, importTvPlaylistFile } from '@/features/tv/api';
import { deleteTvPlaylist, listTvPlaylists, saveTvPlaylist, type TvPlaylist } from '@/features/tv/store';
import { colors, font, radius, spacing } from '@/theme';

export default function TvPlaylistsScreen() {
  const insets = useSafeAreaInsets();
  const [playlists, setPlaylists] = useState<TvPlaylist[]>([]);
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    listTvPlaylists().then(setPlaylists).catch(() => undefined);
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const onAdd = useCallback(async () => {
    const link = url.trim();
    if (!link || busy) return;
    setBusy(true);
    setError(null);
    try {
      const { name, content } = await fetchTvPlaylist(link);
      const channels = content.kind === 'channels' ? content.channels : hlsAsChannel(link, name);
      await saveTvPlaylist(link, name, channels);
      setUrl('');
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add that playlist.');
    } finally {
      setBusy(false);
    }
  }, [url, busy, reload]);

  const onImportFile = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const imported = await importTvPlaylistFile();
      if (!imported) return;
      await saveTvPlaylist(imported.sourceUri, imported.name, imported.channels);
      reload();
      Alert.alert('Playlist added', `"${imported.name}" — ${imported.channels.length} channels.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read that playlist file.');
    } finally {
      setBusy(false);
    }
  }, [busy, reload]);

  const onDelete = useCallback(
    (p: TvPlaylist) => {
      Alert.alert('Remove playlist?', `"${p.name}" and its ${p.channelCount} channels will be removed.`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            deleteTvPlaylist(p.id).then(reload);
          },
        },
      ]);
    },
    [reload],
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.heading}>TV Playlists</Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.base,
          paddingBottom: spacing['2xl'] + insets.bottom,
        }}>
        <Text style={styles.hint}>
          Paste an M3U/M3U8 playlist link or load a playlist file saved on this phone to add its
          channels to the TV tab. Channels stream over the internet and need a connection.
        </Text>

        <Text style={styles.fieldLabel}>Playlist URL</Text>
        <TextInput
          value={url}
          onChangeText={(t) => {
            setUrl(t);
            setError(null);
          }}
          placeholder="…/languages/hin.m3u or …/master.m3u8"
          placeholderTextColor={colors.textDisabled}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <View style={{ marginTop: spacing.base }}>
          <Button label={busy ? 'Adding…' : 'Add playlist'} onPress={onAdd} disabled={busy || !url.trim()} />
        </View>

        <Text style={[styles.fieldLabel, { marginTop: spacing.xl }]}>Or load a file from this phone</Text>
        <Button
          label={busy ? 'Loading…' : 'Load playlist file (.m3u / .m3u8)'}
          variant="secondary"
          onPress={onImportFile}
          disabled={busy}
        />

        <Text style={[styles.fieldLabel, { marginTop: spacing.xl }]}>
          {playlists.length} {playlists.length === 1 ? 'playlist' : 'playlists'} added
        </Text>
        {playlists.length === 0 ? (
          <Text style={styles.empty}>No playlists yet.</Text>
        ) : (
          playlists.map((p) => (
            <View key={p.id} style={styles.row}>
              <View style={styles.rowMain}>
                <View style={styles.thumb}>
                  <Ionicons name="tv-outline" size={18} color={colors.primary} />
                </View>
                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle} numberOfLines={2}>
                    {p.name}
                  </Text>
                  <Text style={styles.rowMeta}>
                    {p.channelCount} {p.channelCount === 1 ? 'channel' : 'channels'}
                  </Text>
                </View>
              </View>
              <Pressable hitSlop={8} onPress={() => onDelete(p)} style={styles.delete}>
                <Ionicons name="trash-outline" size={16} color={colors.textDisabled} />
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.sm,
  },
  heading: {
    color: colors.textPrimary,
    fontSize: font.title,
    fontWeight: '900',
  },
  hint: {
    color: colors.textDisabled,
    fontSize: font.small,
    lineHeight: font.small * 1.5,
  },
  fieldLabel: {
    color: colors.textSecondary,
    fontSize: font.caption,
    fontWeight: '700',
    marginTop: spacing.base,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    color: colors.textPrimary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.base,
    paddingVertical: 10,
    fontSize: font.body,
  },
  error: {
    color: colors.primary,
    fontSize: font.caption,
    marginTop: spacing.xs,
    fontWeight: '600',
  },
  empty: {
    color: colors.textDisabled,
    fontSize: font.small,
    paddingVertical: spacing.base,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  rowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    padding: spacing.sm,
  },
  thumb: {
    width: 64,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  rowBody: {
    flex: 1,
  },
  rowTitle: {
    color: colors.textPrimary,
    fontSize: font.body,
    fontWeight: '700',
  },
  rowMeta: {
    color: colors.textDisabled,
    fontSize: font.small,
    marginTop: 2,
  },
  delete: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
});
