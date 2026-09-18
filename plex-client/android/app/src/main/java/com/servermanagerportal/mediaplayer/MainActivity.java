package com.servermanagerportal.mediaplayer;

import android.content.pm.PackageManager;
import android.content.res.Configuration;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final long[] TV_INJECT_DELAYS_MS = { 50, 200, 500, 1000, 2000, 4000 };

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativeMediaPlayerPlugin.class);
        registerPlugin(DeviceUiPlugin.class);
        super.onCreate(savedInstanceState);
        applyWebViewDisplayFixes();
        scheduleTvHints();
    }

    @Override
    public void onStart() {
        super.onStart();
        applyWebViewDisplayFixes();
        scheduleTvHints();
    }

    private void applyWebViewDisplayFixes() {
        if (bridge == null || bridge.getWebView() == null) {
            return;
        }
        WebView webView = bridge.getWebView();
        WebSettings settings = webView.getSettings();
        // High-DPI / TV WebViews inflate text zoom and make the whole SPA look oversized.
        settings.setTextZoom(100);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(false);
        // Do not call setInitialScale — it fights CSS zoom and breaks hit-testing.
    }

    private void scheduleTvHints() {
        if (!isTelevisionDevice()) return;
        if (bridge == null || bridge.getWebView() == null) return;
        WebView webView = bridge.getWebView();
        for (long delayMs : TV_INJECT_DELAYS_MS) {
            webView.postDelayed(this::injectTvHints, delayMs);
        }
    }

    private void injectTvHints() {
        if (bridge == null || bridge.getWebView() == null) return;
        bridge.getWebView().evaluateJavascript(
            "(function(){"
                + "if(typeof window.__SMP_MARK_TV__==='function'){window.__SMP_MARK_TV__();return;}"
                + "window.__PLEX_CLIENT__=Object.assign({},window.__PLEX_CLIENT__||{},{isTv:true});"
                + "document.documentElement.dataset.tv='1';"
                + "document.documentElement.dataset.plexClient='1';"
                + "})();",
            null
        );
    }

    private boolean isTelevisionDevice() {
        PackageManager pm = getPackageManager();
        if (pm != null && (
            pm.hasSystemFeature(PackageManager.FEATURE_LEANBACK)
            || pm.hasSystemFeature("android.software.leanback")
        )) {
            return true;
        }
        int uiMode = getResources().getConfiguration().uiMode & Configuration.UI_MODE_TYPE_MASK;
        return uiMode == Configuration.UI_MODE_TYPE_TELEVISION;
    }
}
