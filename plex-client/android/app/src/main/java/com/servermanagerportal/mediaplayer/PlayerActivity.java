package com.servermanagerportal.mediaplayer;

import android.content.Intent;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.TextView;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;

import androidx.media3.common.MediaItem;
import androidx.media3.common.PlaybackException;
import androidx.media3.common.Player;
import androidx.media3.common.util.UnstableApi;
import androidx.media3.datasource.DefaultHttpDataSource;
import androidx.media3.exoplayer.ExoPlayer;
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory;
import androidx.media3.ui.PlayerView;

import org.json.JSONObject;

import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

@UnstableApi
public class PlayerActivity extends AppCompatActivity {
    public static final String EXTRA_URL = "url";
    public static final String EXTRA_TITLE = "title";
    public static final String EXTRA_OFFSET_MS = "offsetMs";
    public static final String EXTRA_HEADERS_JSON = "headersJson";
    public static final String EXTRA_ENDED = "ended";
    public static final String EXTRA_POSITION_MS = "positionMs";

    private ExoPlayer player;
    private boolean playbackEnded;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        setContentView(R.layout.activity_player);

        String url = getIntent().getStringExtra(EXTRA_URL);
        String title = getIntent().getStringExtra(EXTRA_TITLE);
        int offsetMs = getIntent().getIntExtra(EXTRA_OFFSET_MS, 0);
        String headersJson = getIntent().getStringExtra(EXTRA_HEADERS_JSON);

        TextView titleView = findViewById(R.id.player_title);
        if (title != null && !title.trim().isEmpty()) {
            titleView.setText(title.trim());
            titleView.setVisibility(View.VISIBLE);
        } else {
            titleView.setVisibility(View.GONE);
        }

        findViewById(R.id.player_close).setOnClickListener(v -> finishWithResult(false));

        if (url == null || url.trim().isEmpty()) {
            finishWithResult(false);
            return;
        }

        Map<String, String> headers = parseHeaders(headersJson);
        DefaultHttpDataSource.Factory httpFactory = new DefaultHttpDataSource.Factory()
            .setAllowCrossProtocolRedirects(true)
            .setConnectTimeoutMs(20_000)
            .setReadTimeoutMs(20_000)
            .setDefaultRequestProperties(headers);

        player = new ExoPlayer.Builder(this)
            .setMediaSourceFactory(new DefaultMediaSourceFactory(httpFactory))
            .build();

        PlayerView playerView = findViewById(R.id.player_view);
        playerView.setPlayer(player);
        playerView.setShowBuffering(PlayerView.SHOW_BUFFERING_WHEN_PLAYING);
        playerView.requestFocus();

        player.setMediaItem(MediaItem.fromUri(url.trim()));
        player.prepare();
        if (offsetMs > 0) {
            player.seekTo(offsetMs);
        }
        player.play();

        player.addListener(new Player.Listener() {
            @Override
            public void onPlaybackStateChanged(int playbackState) {
                if (playbackState == Player.STATE_ENDED) {
                    playbackEnded = true;
                    finishWithResult(true);
                }
            }

            @Override
            public void onPlayerError(PlaybackException error) {
                finishWithResult(false);
            }
        });
    }

    private Map<String, String> parseHeaders(@Nullable String headersJson) {
        Map<String, String> headers = new HashMap<>();
        if (headersJson == null || headersJson.trim().isEmpty()) {
            return headers;
        }
        try {
            JSONObject obj = new JSONObject(headersJson);
            Iterator<String> keys = obj.keys();
            while (keys.hasNext()) {
                String key = keys.next();
                String value = obj.optString(key, "");
                if (key != null && !key.isEmpty() && value != null && !value.isEmpty()) {
                    headers.put(key, value);
                }
            }
        } catch (Exception ignored) {
            /* keep empty headers */
        }
        return headers;
    }

    private void finishWithResult(boolean ended) {
        long positionMs = 0L;
        if (player != null) {
            positionMs = Math.max(0L, player.getCurrentPosition());
            player.stop();
        }
        Intent data = new Intent();
        data.putExtra(EXTRA_ENDED, ended || playbackEnded);
        data.putExtra(EXTRA_POSITION_MS, positionMs);
        setResult(RESULT_OK, data);
        finish();
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK || keyCode == KeyEvent.KEYCODE_ESCAPE) {
            finishWithResult(false);
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }

    @Override
    protected void onStop() {
        super.onStop();
        if (player != null) {
            player.pause();
        }
    }

    @Override
    protected void onDestroy() {
        if (player != null) {
            player.release();
            player = null;
        }
        super.onDestroy();
    }
}
