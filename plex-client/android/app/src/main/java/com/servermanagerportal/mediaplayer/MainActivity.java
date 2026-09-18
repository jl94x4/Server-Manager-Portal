package com.servermanagerportal.mediaplayer;

import android.content.pm.PackageManager;
import android.content.res.Configuration;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativeMediaPlayerPlugin.class);
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onStart() {
        super.onStart();
        if (bridge == null || bridge.getWebView() == null) {
            return;
        }

        WebView webView = bridge.getWebView();
        WebSettings settings = webView.getSettings();
        // Android TV / high-DPI WebViews often bump text zoom and make the UI look "zoomed in".
        settings.setTextZoom(100);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);

        if (isTelevisionDevice()) {
            webView.evaluateJavascript(
                "(function(){"
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
