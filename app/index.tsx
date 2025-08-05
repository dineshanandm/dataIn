// App.js
// Deps: expo install expo-file-system react-native-webview

import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  Button,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import { WebView } from 'react-native-webview';

const PUBLIC_URL = 'https://storage.googleapis.com/10th_science/Aram.pdf';
const FILE_NAME = 'Aram.pdf';

export default function App() {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showViewer, setShowViewer] = useState(false);
  const [viewerUri, setViewerUri] = useState<string | null>(null);

  const handleConnect = async () => {
    try {
      setDownloading(true);
      setProgress(0);

      // Ensure a folder exists to store downloads
      const dir = FileSystem.documentDirectory + 'downloads/';
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
      const dest = dir + FILE_NAME;

      // Download with progress
      const callback = (downloadProgress) => {
        const p =
          downloadProgress.totalBytesExpectedToWrite > 0
            ? downloadProgress.totalBytesWritten /
              downloadProgress.totalBytesExpectedToWrite
            : 0;
        setProgress(p);
      };

      const downloadResumable = FileSystem.createDownloadResumable(
        PUBLIC_URL,
        dest,
        {},
        callback
      );

      const { uri, status } = await downloadResumable.downloadAsync();
      if (status !== 200) throw new Error(`HTTP ${status}`);

      // Show viewer:
      // iOS can render PDF from local file in WebView.
      // Android WebView can't render local PDFs; use Google Docs Viewer with the public URL.
      if (Platform.OS === 'ios') {
        setViewerUri(uri);
      } else {
        const googleViewer = `https://drive.google.com/viewer?embedded=1&url=${encodeURIComponent(
          PUBLIC_URL
        )}`;
        setViewerUri(googleViewer);
      }

      setShowViewer(true);
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', e?.message ?? 'Failed to download');
    } finally {
      setDownloading(false);
      setProgress(0);
    }
  };

  if (showViewer && viewerUri) {
    return (
      <SafeAreaView style={styles.viewerContainer}>
        <View style={styles.viewerHeader}>
          <Button title="← Back" onPress={() => setShowViewer(false)} />
          <Text style={styles.viewerTitle}>PDF Viewer</Text>
          <View style={{ width: 64 }} />{/* spacer to balance header */}
        </View>

        <WebView
          source={{ uri: viewerUri }}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.loading}>
              <ActivityIndicator />
              <Text style={{ marginTop: 8 }}>Loading PDF…</Text>
            </View>
          )}
          // Helpful flags for local files on Android (no-op on iOS)
          allowFileAccess
          allowUniversalAccessFromFileURLs
          originWhitelist={['*']}
          style={{ flex: 1 }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Database Integration</Text>
        <View style={{ height: 16 }} />
        <Button
          title={
            downloading
              ? `Connecting… ${Math.round(progress * 100)}%`
              : 'Connect'
          }
          onPress={handleConnect}
          disabled={downloading}
        />
        {downloading && (
          <View style={{ alignItems: 'center', marginTop: 12 }}>
            <ActivityIndicator />
            <Text style={{ marginTop: 8 }}>
              Downloading… {Math.round(progress * 100)}%
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', justifyContent: 'center' },
  content: { paddingHorizontal: 24, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '600' },

  viewerContainer: { flex: 1, backgroundColor: '#fff' },
  viewerHeader: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  viewerTitle: { fontSize: 16, fontWeight: '600' },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
