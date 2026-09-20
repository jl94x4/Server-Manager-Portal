package com.servermanagerportal.mediaplayer;

import android.content.pm.PackageManager;
import android.content.res.Configuration;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebSettings;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativeMediaPlayerPlugin.class);
        registerPlugin(DeviceUiPlugin.class);
        super.onCreate(savedInstanceState);
        applyWebViewDisplayFixes();
        scheduleTvMark();
    }

    @Override
    public void onStart() {
        super.onStart();
        applyWebViewDisplayFixes();
        scheduleTvMark();
    }

    private void applyWebViewDisplayFixes() {
        if (bridge == null || bridge.getWebView() == null) {
            return;
        }
        WebView webView = bridge.getWebView();
        WebSettings settings = webView.getSettings();
        settings.setTextZoom(100);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setNeedInitialFocus(true);

        webView.setFocusable(true);
        webView.setFocusableInTouchMode(true);
        webView.setDescendantFocusability(ViewGroup.FOCUS_AFTER_DESCENDANTS);
        if (isTelevisionDevice()) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                webView.setFocusedByDefault(true);
            }
            webView.post(() -> webView.requestFocus(View.FOCUS_DOWN));
        }
    }

    private void scheduleTvMark() {
        if (!isTelevisionDevice()) return;
        if (bridge == null || bridge.getWebView() == null) return;
        // Mark leanback for the JS remote layer only — no viewport/zoom injection.
        bridge.getWebView().postDelayed(() -> {
            if (bridge == null || bridge.getWebView() == null) return;
            bridge.getWebView().evaluateJavascript(
                "(function(){"
                    + "window.__PLEX_CLIENT__=Object.assign({},window.__PLEX_CLIENT__||{},{isTv:true});"
                    + "document.documentElement.dataset.tv='1';"
                    + "document.documentElement.dataset.plexClient='1';"
                    + "})();",
                null
            );
        }, 300);
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
