package com.servermanagerportal.mediaplayer;

import android.content.Context;
import android.content.pm.PackageManager;
import android.content.res.Configuration;
import android.os.Build;
import android.os.Bundle;
import android.util.DisplayMetrics;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebSettings;
import android.webkit.WebView;

import androidx.activity.OnBackPressedCallback;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    /** Desktop-like CSS layout width on leanback (phone density makes TV look zoomed-in). */
    private static final int TV_TARGET_CSS_WIDTH = 1920;

    @Override
    protected void attachBaseContext(Context newBase) {
        super.attachBaseContext(applyTvDensity(newBase));
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativeMediaPlayerPlugin.class);
        registerPlugin(DeviceUiPlugin.class);
        super.onCreate(savedInstanceState);
        applyWebViewDisplayFixes();
        scheduleTvMark();
        registerSpaBackHandler();
    }

    /**
     * SPA pushState does not update WebView.canGoBack(), so Capacitor finishes the
     * Activity on hardware Back. Route Back into the JS history handler first.
     */
    private void registerSpaBackHandler() {
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (bridge == null || bridge.getWebView() == null) {
                    finishIfUnhandled(this);
                    return;
                }
                bridge.getWebView().evaluateJavascript(
                    "(function(){try{return !!(window.__SMP_HANDLE_BACK__&&window.__SMP_HANDLE_BACK__());}catch(e){return false;}})()",
                    value -> {
                        boolean handled = value != null && value.contains("true");
                        if (!handled) {
                            finishIfUnhandled(this);
                        }
                    }
                );
            }
        });
    }

    private void finishIfUnhandled(OnBackPressedCallback callback) {
        runOnUiThread(() -> {
            callback.setEnabled(false);
            try {
                getOnBackPressedDispatcher().onBackPressed();
            } finally {
                callback.setEnabled(true);
            }
        });
    }

    @Override
    public void onStart() {
        super.onStart();
        applyWebViewDisplayFixes();
        scheduleTvMark();
    }

    /**
     * Force a density so widthPixels maps to ~1920 CSS px without CSS zoom/transform.
     * cssWidth ≈ widthPixels * 160 / densityDpi
     */
    private static Context applyTvDensity(Context base) {
        if (base == null || !isTelevisionDevice(base)) return base;
        try {
            DisplayMetrics metrics = base.getResources().getDisplayMetrics();
            int widthPx = Math.max(metrics.widthPixels, metrics.heightPixels);
            if (widthPx < 720) return base;
            int densityDpi = Math.round(160f * widthPx / (float) TV_TARGET_CSS_WIDTH);
            densityDpi = Math.max(120, Math.min(640, densityDpi));
            Configuration config = new Configuration(base.getResources().getConfiguration());
            if (config.densityDpi == densityDpi) return base;
            config.densityDpi = densityDpi;
            return base.createConfigurationContext(config);
        } catch (Throwable ignored) {
            return base;
        }
    }

    private void applyWebViewDisplayFixes() {
        if (bridge == null || bridge.getWebView() == null) {
            return;
        }
        WebView webView = bridge.getWebView();
        WebSettings settings = webView.getSettings();
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setTextZoom(100);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setUseWideViewPort(true);
        // Overview mode fights a desktop-width layout on leanback.
        settings.setLoadWithOverviewMode(!isTelevisionDevice(this));
        settings.setNeedInitialFocus(true);

        webView.setFocusable(true);
        webView.setFocusableInTouchMode(true);
        webView.setDescendantFocusability(ViewGroup.FOCUS_AFTER_DESCENDANTS);
        if (isTelevisionDevice(this)) {
            // System / WebView chrome scrollbars ignore CSS on many TV WebViews.
            webView.setVerticalScrollBarEnabled(false);
            webView.setHorizontalScrollBarEnabled(false);
            webView.setScrollBarStyle(View.SCROLLBARS_INSIDE_OVERLAY);
            webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                try {
                    webView.setVerticalScrollbarThumbDrawable(null);
                    webView.setHorizontalScrollbarThumbDrawable(null);
                } catch (Throwable ignored) {
                    /* older WebView */
                }
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                webView.setFocusedByDefault(true);
            }
            webView.post(() -> webView.requestFocus(View.FOCUS_DOWN));
        }
    }

    private void scheduleTvMark() {
        if (!isTelevisionDevice(this)) return;
        if (bridge == null || bridge.getWebView() == null) return;
        // Mark leanback + apply CSS zoom density (WebView ignores Activity densityDpi).
        bridge.getWebView().postDelayed(() -> {
            if (bridge == null || bridge.getWebView() == null) return;
            bridge.getWebView().evaluateJavascript(
                "(function(){"
                    + "if(typeof window.__SMP_MARK_TV__==='function'){window.__SMP_MARK_TV__();return;}"
                    + "window.__PLEX_CLIENT__=Object.assign({},window.__PLEX_CLIENT__||{},{isTv:true});"
                    + "document.documentElement.dataset.tv='1';"
                    + "document.documentElement.dataset.plexClient='1';"
                    + "if(typeof window.__SMP_APPLY_TV_SCALE__==='function'){window.__SMP_APPLY_TV_SCALE__();}"
                    + "})();",
                null
            );
        }, 300);
        bridge.getWebView().postDelayed(() -> {
            if (bridge == null || bridge.getWebView() == null) return;
            bridge.getWebView().evaluateJavascript(
                "(function(){if(typeof window.__SMP_APPLY_TV_SCALE__==='function'){window.__SMP_APPLY_TV_SCALE__();}})();",
                null
            );
        }, 900);
    }

    private static boolean isTelevisionDevice(Context context) {
        if (context == null) return false;
        PackageManager pm = context.getPackageManager();
        if (pm != null && (
            pm.hasSystemFeature(PackageManager.FEATURE_LEANBACK)
            || pm.hasSystemFeature("android.software.leanback")
        )) {
            return true;
        }
        int uiMode = context.getResources().getConfiguration().uiMode & Configuration.UI_MODE_TYPE_MASK;
        return uiMode == Configuration.UI_MODE_TYPE_TELEVISION;
    }
}
