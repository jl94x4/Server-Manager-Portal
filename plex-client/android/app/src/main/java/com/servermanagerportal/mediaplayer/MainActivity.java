package com.servermanagerportal.mediaplayer;

import android.content.pm.PackageManager;
import android.content.res.Configuration;
import android.os.Bundle;
import android.util.DisplayMetrics;
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
        // Overview mode fights a fixed desktop layout width on leanback.
        settings.setLoadWithOverviewMode(false);

        if (isTelevisionDevice()) {
            DisplayMetrics dm = getResources().getDisplayMetrics();
            // Prefer showing a ~1920 CSS-px layout; initial scale is percent of default.
            float cssWidth = dm.widthPixels / Math.max(dm.density, 0.5f);
            int initial = Math.max(25, Math.min(100, Math.round((cssWidth / 1920f) * 100f)));
            webView.setInitialScale(initial);
        }
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
        // Prefer the HTML helper (transform scale). Fall back to viewport-only hints.
        bridge.getWebView().evaluateJavascript(
            "(function(){"
                + "if(typeof window.__SMP_MARK_TV__==='function'){window.__SMP_MARK_TV__();return;}"
                + "window.__PLEX_CLIENT__=Object.assign({},window.__PLEX_CLIENT__||{},{isTv:true});"
                + "document.documentElement.dataset.tv='1';"
                + "document.documentElement.dataset.plexClient='1';"
                + "var m=document.querySelector('meta[name=viewport]');"
                + "if(!m){m=document.createElement('meta');m.setAttribute('name','viewport');document.head.appendChild(m);}"
                + "m.setAttribute('content','width=1920, initial-scale=1, maximum-scale=1, user-scalable=no');"
                + "document.documentElement.style.fontSize='16px';"
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
