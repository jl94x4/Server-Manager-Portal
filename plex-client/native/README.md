# Native ExoPlayer Capacitor plugin (scaffold)

The JS bridge expects `window.NativeMediaPlayer`:

```ts
window.NativeMediaPlayer = {
  isAvailable: () => true,
  open: async ({ url, title, offsetMs, headers }) => {
    // Launch ExoPlayer Activity / Fragment
    // Return { ended, positionMs } when the user exits
  },
};
```

## Android TV + phone

One APK:

1. After `npx cap add android`, edit `AndroidManifest.xml`:
   - `android.software.leanback` feature `required="false"`
   - Launcher activity: both `LAUNCHER` and `LEANBACK_LAUNCHER`
   - `android.hardware.touchscreen` `required="false"`
2. Implement `NativeMediaPlayerPlugin` with Media3 ExoPlayer.
3. Pass `Authorization: Bearer …` (and optional `access_token` query) for portal stream URLs.

Until the plugin ships, playback falls back to the WebView `<video>` / HLS.js path.
