package com.servermanagerportal.mediaplayer;

import android.content.Intent;
import android.os.Bundle;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NativeMediaPlayer")
public class NativeMediaPlayerPlugin extends Plugin {

    @PluginMethod
    public void isAvailable(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("value", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void open(PluginCall call) {
        String url = call.getString("url", "");
        if (url == null || url.trim().isEmpty()) {
            call.reject("url is required");
            return;
        }

        Intent intent = new Intent(getContext(), PlayerActivity.class);
        intent.putExtra(PlayerActivity.EXTRA_URL, url.trim());
        intent.putExtra(PlayerActivity.EXTRA_TITLE, call.getString("title", ""));
        Integer offset = call.getInt("offsetMs", 0);
        intent.putExtra(PlayerActivity.EXTRA_OFFSET_MS, offset == null ? 0 : offset);

        JSObject headers = call.getObject("headers");
        if (headers != null) {
            intent.putExtra(PlayerActivity.EXTRA_HEADERS_JSON, headers.toString());
        }

        startActivityForResult(call, intent, "onPlayerFinished");
    }

    @ActivityCallback
    private void onPlayerFinished(PluginCall call, ActivityResult result) {
        if (call == null) {
            return;
        }
        Intent data = result.getData();
        boolean ended = data != null && data.getBooleanExtra(PlayerActivity.EXTRA_ENDED, false);
        long positionMs = data != null ? data.getLongExtra(PlayerActivity.EXTRA_POSITION_MS, 0L) : 0L;

        JSObject ret = new JSObject();
        ret.put("ended", ended);
        ret.put("positionMs", positionMs);
        call.resolve(ret);
    }
}
