package com.servermanagerportal.mediaplayer;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativeMediaPlayerPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
