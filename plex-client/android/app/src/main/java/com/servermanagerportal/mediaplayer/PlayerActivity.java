package com.servermanagerportal.mediaplayer;

import android.app.PictureInPictureParams;
import android.app.UiModeManager;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.content.res.Configuration;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.util.Rational;
import android.view.KeyEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.ImageButton;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.SeekBar;
import android.widget.TextView;
import android.widget.Toast;
import android.webkit.CookieManager;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import androidx.media3.common.AudioAttributes;
import androidx.media3.common.C;
import androidx.media3.common.MediaItem;
import androidx.media3.common.MimeTypes;
import androidx.media3.common.PlaybackException;
import androidx.media3.common.PlaybackParameters;
import androidx.media3.common.Player;
import androidx.media3.common.Tracks;
import androidx.media3.common.util.UnstableApi;
import androidx.media3.datasource.DefaultHttpDataSource;
import androidx.media3.exoplayer.DefaultLoadControl;
import androidx.media3.exoplayer.DefaultRenderersFactory;
import androidx.media3.exoplayer.ExoPlayer;
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory;
import androidx.media3.ui.PlayerView;

import com.getcapacitor.JSObject;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@UnstableApi
public class PlayerActivity extends AppCompatActivity {
    private static final String TAG = "SmpPlayerActivity";
    private static final String USER_AGENT = "SMP-MediaPlayer/1.0 (Android TV; ExoPlayer)";
    private static final String PREFS = "smp_player_prefs";

    public static final String EXTRA_URL = "url";
    public static final String EXTRA_TITLE = "title";
    public static final String EXTRA_OFFSET_MS = "offsetMs";
    public static final String EXTRA_HEADERS_JSON = "headersJson";
    public static final String EXTRA_SESSION_JSON = "sessionJson";
    public static final String EXTRA_SPEED = "speed";
    public static final String EXTRA_AUTOPLAY_NEXT = "autoplayNext";
    public static final String EXTRA_AUTO_SKIP_INTRO = "autoSkipIntro";
    public static final String EXTRA_AUTO_SKIP_CREDITS = "autoSkipCredits";
    public static final String EXTRA_ENDED = "ended";
    public static final String EXTRA_POSITION_MS = "positionMs";
    public static final String EXTRA_ERROR = "error";
    public static final String EXTRA_PLAY_NEXT = "playNext";
    public static final String EXTRA_NEXT_RATING_KEY = "nextRatingKey";

    private ExoPlayer player;
    private DefaultHttpDataSource.Factory httpFactory;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    private View chrome;
    private View topBar;
    private View bufferingView;
    private TextView errorView;
    private SeekBar seekBar;
    private TextView timeView;
    private TextView speedLabel;
    private TextView titleView;
    private TextView upNextLabel;
    private Button playPauseBtn;
    private Button skipIntroBtn;
    private Button skipCreditsBtn;
    private LinearLayout upNextRow;
    private Button pipBtn;

    private boolean playbackEnded;
    private boolean playbackError;
    private boolean finishing;
    private boolean seekingUi;
    private boolean chromeVisible = true;
    private boolean skippedIntro;
    private boolean skippedCredits;
    private long pendingSeekMs;
    private float playbackSpeed = 1f;
    private boolean autoplayNext = true;
    private boolean autoSkipIntro;
    private boolean autoSkipCredits;
    private long sleepUntilElapsedRealtime;
    private boolean sleepEndOfEpisode;

    private String currentUrl = "";
    private String headersJson = "";
    private String qualityId = "";
    private String audioStreamId = "";
    private String subtitleStreamId = "";
    private int mediaIndex;
    private long durationHintMs;
    private long introStartMs = -1;
    private long introEndMs = -1;
    private long creditsStartMs = -1;
    private String nextRatingKey = "";
    private String nextTitle = "";
    private String ratingKey = "";
    private String showKey = "";

    private final List<OptionItem> qualities = new ArrayList<>();
    private final List<OptionItem> audioTracks = new ArrayList<>();
    private final List<OptionItem> subtitles = new ArrayList<>();
    private final List<OptionItem> versions = new ArrayList<>();

    private final Runnable hideChromeRunnable = () -> setChromeVisible(false);
    private final Runnable tickRunnable = new Runnable() {
        @Override
        public void run() {
            updateProgressUi();
            maybeAutoSkip();
            maybeShowUpNext();
            maybeSleepTimer();
            emitProgress("playing");
            mainHandler.postDelayed(this, 1000);
        }
    };
    private final Runnable progressEmitRunnable = new Runnable() {
        @Override
        public void run() {
            if (player != null && player.isPlaying()) {
                emitProgress("playing");
            }
            mainHandler.postDelayed(this, 5000);
        }
    };

    private static final class OptionItem {
        final String id;
        final String label;

        OptionItem(String id, String label) {
            this.id = id;
            this.label = label;
        }
    }

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        PlayerBridge.get().attachActivity(this);
        try {
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
            WindowInsetsControllerCompat insets = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
            if (insets != null) {
                insets.hide(WindowInsetsCompat.Type.systemBars());
                insets.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            }
            setContentView(R.layout.activity_player);
            bindViews();

            Intent intent = getIntent();
            currentUrl = intent.getStringExtra(EXTRA_URL);
            String title = intent.getStringExtra(EXTRA_TITLE);
            pendingSeekMs = Math.max(0, intent.getIntExtra(EXTRA_OFFSET_MS, 0));
            headersJson = intent.getStringExtra(EXTRA_HEADERS_JSON);
            playbackSpeed = intent.getFloatExtra(EXTRA_SPEED, 1f);
            autoplayNext = intent.getBooleanExtra(EXTRA_AUTOPLAY_NEXT, true);
            autoSkipIntro = intent.getBooleanExtra(EXTRA_AUTO_SKIP_INTRO, false);
            autoSkipCredits = intent.getBooleanExtra(EXTRA_AUTO_SKIP_CREDITS, false);
            applySessionJson(intent.getStringExtra(EXTRA_SESSION_JSON));
            restoreAvPrefs();

            if (title != null && !title.trim().isEmpty()) {
                titleView.setText(title.trim());
            }

            if (currentUrl == null || currentUrl.trim().isEmpty()) {
                Log.e(TAG, "Missing playback url");
                finishWithResult(false, false);
                return;
            }
            currentUrl = currentUrl.trim();

            Map<String, String> headers = headersWithCookies(currentUrl, parseHeaders(headersJson));

            httpFactory = new DefaultHttpDataSource.Factory()
                .setUserAgent(USER_AGENT)
                .setAllowCrossProtocolRedirects(true)
                .setConnectTimeoutMs(30_000)
                .setReadTimeoutMs(30_000)
                .setDefaultRequestProperties(headers);

            DefaultLoadControl loadControl = new DefaultLoadControl.Builder()
                .setBufferDurationsMs(5_000, 50_000, 1_000, 2_000)
                .build();

            DefaultRenderersFactory renderersFactory = new DefaultRenderersFactory(this)
                .setExtensionRendererMode(DefaultRenderersFactory.EXTENSION_RENDERER_MODE_OFF)
                .setEnableDecoderFallback(true);

            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                .setUsage(C.USAGE_MEDIA)
                .setContentType(C.AUDIO_CONTENT_TYPE_MOVIE)
                .build();

            player = new ExoPlayer.Builder(this, renderersFactory)
                .setMediaSourceFactory(new DefaultMediaSourceFactory(httpFactory))
                .setLoadControl(loadControl)
                .setAudioAttributes(audioAttributes, false)
                .setWakeMode(C.WAKE_MODE_NETWORK)
                .build();
            player.setVideoScalingMode(C.VIDEO_SCALING_MODE_SCALE_TO_FIT);
            applySpeed(playbackSpeed);

            PlayerView playerView = findViewById(R.id.player_view);
            playerView.setPlayer(player);
            playerView.setShowBuffering(PlayerView.SHOW_BUFFERING_NEVER);
            playerView.setKeepScreenOn(true);
            playerView.setOnClickListener(v -> toggleChrome());

            MediaItem mediaItem = buildMediaItem(currentUrl);
            Log.i(TAG, "Starting ExoPlayer url=" + summarizeUrl(currentUrl));
            player.setMediaItem(mediaItem);
            player.setPlayWhenReady(true);
            player.prepare();
            wirePlayerListener();
            wireControls();
            bumpChrome();
            if (playPauseBtn != null) playPauseBtn.requestFocus();
            mainHandler.post(tickRunnable);
            mainHandler.postDelayed(progressEmitRunnable, 5000);
            updatePipVisibility();
        } catch (Throwable t) {
            Log.e(TAG, "PlayerActivity failed to start", t);
            playbackError = true;
            toast("Unable to start player");
            finishWithResult(false, false);
        }
    }

    private void bindViews() {
        chrome = findViewById(R.id.player_chrome);
        topBar = findViewById(R.id.player_top);
        bufferingView = findViewById(R.id.player_buffering);
        errorView = findViewById(R.id.player_error);
        titleView = findViewById(R.id.player_title);
        seekBar = findViewById(R.id.player_seek);
        timeView = findViewById(R.id.player_time);
        speedLabel = findViewById(R.id.player_speed_label);
        playPauseBtn = findViewById(R.id.player_play_pause);
        skipIntroBtn = findViewById(R.id.player_skip_intro);
        skipCreditsBtn = findViewById(R.id.player_skip_credits);
        upNextRow = findViewById(R.id.player_up_next);
        upNextLabel = findViewById(R.id.player_up_next_label);
        pipBtn = findViewById(R.id.player_pip);

        ImageButton close = findViewById(R.id.player_close);
        close.setOnClickListener(v -> finishWithResult(false, false));
    }

    private void wireControls() {
        playPauseBtn.setOnClickListener(v -> togglePlayPause());
        findViewById(R.id.player_seek_back).setOnClickListener(v -> seekBy(-10_000));
        findViewById(R.id.player_seek_fwd).setOnClickListener(v -> seekBy(10_000));
        skipIntroBtn.setOnClickListener(v -> doSkipIntro());
        skipCreditsBtn.setOnClickListener(v -> doSkipCredits());
        findViewById(R.id.player_up_next_play).setOnClickListener(v -> finishForPlayNext());
        findViewById(R.id.player_quality).setOnClickListener(v -> showOptionMenu("quality", qualities, qualityId));
        findViewById(R.id.player_audio).setOnClickListener(v -> showOptionMenu("audio", audioTracks, audioStreamId));
        findViewById(R.id.player_subs).setOnClickListener(v -> {
            List<OptionItem> withOff = new ArrayList<>();
            withOff.add(new OptionItem("", getString(R.string.player_subs_off)));
            withOff.addAll(subtitles);
            showOptionMenu("subtitle", withOff, subtitleStreamId == null ? "" : subtitleStreamId);
        });
        findViewById(R.id.player_version).setOnClickListener(v -> showOptionMenu("version", versions, String.valueOf(mediaIndex)));
        findViewById(R.id.player_speed).setOnClickListener(v -> showSpeedMenu());
        findViewById(R.id.player_sleep).setOnClickListener(v -> showSleepMenu());
        findViewById(R.id.player_external).setOnClickListener(v -> openExternalPlayer());
        pipBtn.setOnClickListener(v -> enterPip());

        seekBar.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener() {
            @Override
            public void onProgressChanged(SeekBar bar, int progress, boolean fromUser) {
                if (!fromUser || player == null) return;
                long duration = Math.max(durationHintMs, player.getDuration() > 0 ? player.getDuration() : 0);
                if (duration <= 0) return;
                long pos = (long) ((progress / 1000.0) * duration);
                timeView.setText(formatClock(pos) + " / " + formatClock(duration));
            }

            @Override
            public void onStartTrackingTouch(SeekBar bar) {
                seekingUi = true;
                bumpChrome();
            }

            @Override
            public void onStopTrackingTouch(SeekBar bar) {
                seekingUi = false;
                if (player == null) return;
                long duration = Math.max(durationHintMs, player.getDuration() > 0 ? player.getDuration() : 0);
                if (duration <= 0) return;
                long pos = (long) ((bar.getProgress() / 1000.0) * duration);
                player.seekTo(pos);
                emitProgress("playing");
                bumpChrome();
            }
        });
    }

    private void wirePlayerListener() {
        player.addListener(new Player.Listener() {
            @Override
            public void onPlaybackStateChanged(int playbackState) {
                setBufferingVisible(playbackState == Player.STATE_BUFFERING);
                if (playbackState == Player.STATE_READY) {
                    playbackError = false;
                    hideError();
                    if (pendingSeekMs > 0) {
                        long seekTo = pendingSeekMs;
                        pendingSeekMs = 0;
                        player.seekTo(seekTo);
                    }
                    player.setPlayWhenReady(true);
                    if (player.isPlaying()) {
                        mainHandler.removeCallbacks(hideChromeRunnable);
                        mainHandler.postDelayed(hideChromeRunnable, 2500);
                    }
                }
                if (playbackState == Player.STATE_ENDED) {
                    playbackEnded = true;
                    if (sleepEndOfEpisode) {
                        sleepEndOfEpisode = false;
                        finishWithResult(true, false);
                        return;
                    }
                    if (autoplayNext && nextRatingKey != null && !nextRatingKey.isEmpty()) {
                        finishForPlayNext();
                    } else {
                        finishWithResult(true, false);
                    }
                }
                updatePlayPauseLabel();
            }

            @Override
            public void onIsPlayingChanged(boolean isPlaying) {
                updatePlayPauseLabel();
                emitProgress(isPlaying ? "playing" : "paused");
            }

            @Override
            public void onTracksChanged(Tracks tracks) {
                boolean hasVideo = false;
                boolean hasAudio = false;
                for (Tracks.Group group : tracks.getGroups()) {
                    if (!group.isSelected()) continue;
                    int type = group.getType();
                    if (type == C.TRACK_TYPE_VIDEO) hasVideo = true;
                    if (type == C.TRACK_TYPE_AUDIO) hasAudio = true;
                }
                if (!hasVideo && hasAudio) {
                    toast("Audio only — this file may need a transcode for this TV");
                }
            }

            @Override
            public void onPlayerError(PlaybackException error) {
                playbackError = true;
                Log.e(TAG, "ExoPlayer error " + error.getErrorCodeName(), error);
                String message = "Playback error: " + error.getErrorCodeName();
                toast(message);
                showError(message);
                JSObject data = new JSObject();
                data.put("message", error.getErrorCodeName());
                PlayerBridge.get().emit("error", data);
            }
        });
    }

    void applySessionJson(@Nullable String sessionJson) {
        if (sessionJson == null || sessionJson.trim().isEmpty()) return;
        try {
            JSONObject root = new JSONObject(sessionJson);
            ratingKey = root.optString("ratingKey", ratingKey);
            showKey = root.optString("showKey", showKey);
            qualityId = root.optString("qualityId", qualityId);
            audioStreamId = root.optString("audioStreamId", audioStreamId);
            subtitleStreamId = root.optString("subtitleStreamId", subtitleStreamId);
            mediaIndex = root.optInt("mediaIndex", mediaIndex);
            durationHintMs = root.optLong("durationMs", durationHintMs);
            if (root.has("autoplayNext")) autoplayNext = root.optBoolean("autoplayNext", autoplayNext);
            if (root.has("autoSkipIntro")) autoSkipIntro = root.optBoolean("autoSkipIntro", autoSkipIntro);
            if (root.has("autoSkipCredits")) autoSkipCredits = root.optBoolean("autoSkipCredits", autoSkipCredits);

            JSONObject markers = root.optJSONObject("markers");
            if (markers != null) {
                JSONObject intro = markers.optJSONObject("intro");
                if (intro != null) {
                    introStartMs = intro.optLong("startMs", -1);
                    introEndMs = intro.optLong("endMs", -1);
                }
                JSONObject credits = markers.optJSONObject("credits");
                if (credits != null) {
                    creditsStartMs = credits.optLong("startMs", -1);
                }
            }

            JSONObject next = root.optJSONObject("nextItem");
            if (next != null) {
                nextRatingKey = next.optString("ratingKey", "");
                nextTitle = next.optString("title", "");
            }

            qualities.clear();
            qualities.addAll(parseOptions(root.optJSONArray("qualities")));
            audioTracks.clear();
            audioTracks.addAll(parseOptions(root.optJSONArray("audioTracks")));
            subtitles.clear();
            subtitles.addAll(parseOptions(root.optJSONArray("subtitles")));
            versions.clear();
            versions.addAll(parseOptions(root.optJSONArray("versions")));
        } catch (Exception e) {
            Log.w(TAG, "Failed to parse sessionJson", e);
        }
    }

    private List<OptionItem> parseOptions(@Nullable JSONArray arr) {
        List<OptionItem> out = new ArrayList<>();
        if (arr == null) return out;
        for (int i = 0; i < arr.length(); i++) {
            JSONObject row = arr.optJSONObject(i);
            if (row == null) continue;
            String id = row.optString("id", "");
            String label = row.optString("label", id);
            if (id.isEmpty() && row.has("mediaIndex")) {
                id = String.valueOf(row.optInt("mediaIndex", i));
            }
            if (!label.isEmpty()) out.add(new OptionItem(id, label));
        }
        return out;
    }

    void applyUpdateSrc(String url, @Nullable String nextHeadersJson, long offsetMs) {
        if (player == null || url == null || url.trim().isEmpty()) return;
        currentUrl = url.trim();
        if (nextHeadersJson != null && !nextHeadersJson.isEmpty()) {
            headersJson = nextHeadersJson;
        }
        if (httpFactory != null) {
            httpFactory.setDefaultRequestProperties(headersWithCookies(currentUrl, parseHeaders(headersJson)));
        }
        pendingSeekMs = Math.max(0, offsetMs);
        skippedIntro = false;
        skippedCredits = false;
        player.setMediaItem(buildMediaItem(currentUrl));
        player.prepare();
        player.setPlayWhenReady(true);
        bumpChrome();
    }

    void applySeek(long positionMs) {
        if (player == null) return;
        player.seekTo(Math.max(0, positionMs));
        emitProgress("playing");
    }

    void applySpeed(float speed) {
        playbackSpeed = Math.max(0.25f, Math.min(2f, speed));
        if (player != null) {
            player.setPlaybackParameters(new PlaybackParameters(playbackSpeed));
        }
        if (speedLabel != null) {
            speedLabel.setText(String.format(Locale.US, "%.2gx", playbackSpeed));
        }
    }

    private void showOptionMenu(String kind, List<OptionItem> items, String selectedId) {
        bumpChrome();
        if (items.isEmpty()) {
            toast("No " + kind + " options");
            return;
        }
        String[] labels = new String[items.size()];
        int checked = 0;
        for (int i = 0; i < items.size(); i++) {
            labels[i] = items.get(i).label;
            if (items.get(i).id.equals(selectedId)) checked = i;
        }
        new AlertDialog.Builder(this)
            .setTitle(kind.substring(0, 1).toUpperCase(Locale.US) + kind.substring(1))
            .setSingleChoiceItems(labels, checked, (dialog, which) -> {
                OptionItem picked = items.get(which);
                dialog.dismiss();
                if ("version".equals(kind)) {
                    try {
                        mediaIndex = Integer.parseInt(picked.id);
                    } catch (Exception ignored) {
                        mediaIndex = which;
                    }
                    requestStreamChange(qualityId, audioStreamId, subtitleStreamId, mediaIndex);
                } else if ("quality".equals(kind)) {
                    qualityId = picked.id;
                    saveAvPrefs();
                    requestStreamChange(qualityId, audioStreamId, subtitleStreamId, mediaIndex);
                } else if ("audio".equals(kind)) {
                    audioStreamId = picked.id;
                    saveAvPrefs();
                    requestStreamChange(qualityId, audioStreamId, subtitleStreamId, mediaIndex);
                } else if ("subtitle".equals(kind)) {
                    subtitleStreamId = picked.id;
                    saveAvPrefs();
                    requestStreamChange(qualityId, audioStreamId, subtitleStreamId, mediaIndex);
                }
            })
            .setNegativeButton(android.R.string.cancel, null)
            .show();
    }

    private void showSpeedMenu() {
        bumpChrome();
        final float[] speeds = {0.5f, 0.75f, 1f, 1.25f, 1.5f, 1.75f, 2f};
        String[] labels = new String[speeds.length];
        int checked = 2;
        for (int i = 0; i < speeds.length; i++) {
            labels[i] = String.format(Locale.US, "%.2gx", speeds[i]);
            if (Math.abs(speeds[i] - playbackSpeed) < 0.01f) checked = i;
        }
        new AlertDialog.Builder(this)
            .setTitle(R.string.player_speed)
            .setSingleChoiceItems(labels, checked, (dialog, which) -> {
                applySpeed(speeds[which]);
                dialog.dismiss();
                JSObject data = new JSObject();
                data.put("speed", playbackSpeed);
                PlayerBridge.get().emit("speed", data);
            })
            .setNegativeButton(android.R.string.cancel, null)
            .show();
    }

    private void showSleepMenu() {
        bumpChrome();
        String[] labels = {
            getString(R.string.player_sleep_off),
            getString(R.string.player_sleep_15),
            getString(R.string.player_sleep_30),
            getString(R.string.player_sleep_45),
            getString(R.string.player_sleep_end),
        };
        new AlertDialog.Builder(this)
            .setTitle(R.string.player_sleep)
            .setItems(labels, (dialog, which) -> {
                sleepEndOfEpisode = false;
                sleepUntilElapsedRealtime = 0;
                if (which == 1) sleepUntilElapsedRealtime = android.os.SystemClock.elapsedRealtime() + 15 * 60_000L;
                else if (which == 2) sleepUntilElapsedRealtime = android.os.SystemClock.elapsedRealtime() + 30 * 60_000L;
                else if (which == 3) sleepUntilElapsedRealtime = android.os.SystemClock.elapsedRealtime() + 45 * 60_000L;
                else if (which == 4) sleepEndOfEpisode = true;
                toast(labels[which]);
            })
            .show();
    }

    private void requestStreamChange(String q, String a, String s, int mi) {
        long pos = player != null ? Math.max(0, player.getCurrentPosition()) : 0;
        JSObject data = new JSObject();
        data.put("qualityId", q == null ? "" : q);
        data.put("audioStreamId", a == null ? "" : a);
        data.put("subtitleStreamId", s == null ? "" : s);
        data.put("mediaIndex", mi);
        data.put("positionMs", pos);
        PlayerBridge.get().emit("streamChange", data);
        toast("Updating stream…");
    }

    private void openExternalPlayer() {
        bumpChrome();
        if (currentUrl == null || currentUrl.isEmpty()) return;
        try {
            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(Uri.parse(currentUrl), "video/*");
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            Intent chooser = Intent.createChooser(intent, getString(R.string.player_external));
            startActivity(chooser);
            emitProgress("paused");
        } catch (Exception e) {
            toast("No external player found");
        }
    }

    private void enterPip() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        if (isTelevision()) return;
        if (!getPackageManager().hasSystemFeature(PackageManager.FEATURE_PICTURE_IN_PICTURE)) return;
        try {
            PictureInPictureParams params = new PictureInPictureParams.Builder()
                .setAspectRatio(new Rational(16, 9))
                .build();
            enterPictureInPictureMode(params);
            setChromeVisible(false);
        } catch (Exception e) {
            toast("PiP unavailable");
        }
    }

    private void updatePipVisibility() {
        boolean show = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
            && !isTelevision()
            && getPackageManager().hasSystemFeature(PackageManager.FEATURE_PICTURE_IN_PICTURE);
        pipBtn.setVisibility(show ? View.VISIBLE : View.GONE);
    }

    private boolean isTelevision() {
        UiModeManager ui = (UiModeManager) getSystemService(UI_MODE_SERVICE);
        return ui != null && ui.getCurrentModeType() == Configuration.UI_MODE_TYPE_TELEVISION;
    }

    private void togglePlayPause() {
        if (player == null) return;
        if (player.isPlaying()) player.pause();
        else player.play();
        bumpChrome();
    }

    private void seekBy(long deltaMs) {
        if (player == null) return;
        long next = Math.max(0, player.getCurrentPosition() + deltaMs);
        long duration = player.getDuration();
        if (duration > 0) next = Math.min(next, duration);
        player.seekTo(next);
        emitProgress("playing");
        bumpChrome();
    }

    private void doSkipIntro() {
        if (player == null || introEndMs < 0) return;
        player.seekTo(introEndMs);
        skippedIntro = true;
        skipIntroBtn.setVisibility(View.GONE);
        emitProgress("playing");
    }

    private void doSkipCredits() {
        skippedCredits = true;
        skipCreditsBtn.setVisibility(View.GONE);
        if (autoplayNext && nextRatingKey != null && !nextRatingKey.isEmpty()) {
            finishForPlayNext();
        } else {
            finishWithResult(true, false);
        }
    }

    private void maybeAutoSkip() {
        if (player == null) return;
        long pos = player.getCurrentPosition();
        if (autoSkipIntro && !skippedIntro && introStartMs >= 0 && introEndMs > introStartMs
            && pos >= introStartMs && pos < introEndMs) {
            doSkipIntro();
        }
        if (autoSkipCredits && !skippedCredits && creditsStartMs >= 0 && pos >= creditsStartMs) {
            doSkipCredits();
        }
        boolean inIntro = !skippedIntro && introStartMs >= 0 && introEndMs > introStartMs
            && pos >= introStartMs && pos < introEndMs;
        boolean inCredits = !skippedCredits && creditsStartMs >= 0 && pos >= creditsStartMs;
        skipIntroBtn.setVisibility(inIntro ? View.VISIBLE : View.GONE);
        skipCreditsBtn.setVisibility(inCredits ? View.VISIBLE : View.GONE);
    }

    private void maybeShowUpNext() {
        if (nextRatingKey == null || nextRatingKey.isEmpty()) {
            upNextRow.setVisibility(View.GONE);
            return;
        }
        long pos = player != null ? player.getCurrentPosition() : 0;
        long duration = player != null && player.getDuration() > 0 ? player.getDuration() : durationHintMs;
        boolean nearEnd = duration > 0 && pos >= Math.max(0, duration - 30_000);
        boolean inCredits = creditsStartMs >= 0 && pos >= creditsStartMs;
        if (nearEnd || inCredits) {
            upNextLabel.setText(nextTitle.isEmpty() ? getString(R.string.player_play_next) : ("Up next: " + nextTitle));
            upNextRow.setVisibility(View.VISIBLE);
        } else {
            upNextRow.setVisibility(View.GONE);
        }
    }

    private void maybeSleepTimer() {
        if (sleepEndOfEpisode) return;
        if (sleepUntilElapsedRealtime <= 0) return;
        if (android.os.SystemClock.elapsedRealtime() >= sleepUntilElapsedRealtime) {
            sleepUntilElapsedRealtime = 0;
            if (player != null) player.pause();
            toast("Sleep timer");
            finishWithResult(false, false);
        }
    }

    private void updateProgressUi() {
        if (player == null || seekingUi) return;
        long pos = Math.max(0, player.getCurrentPosition());
        long duration = player.getDuration() > 0 ? player.getDuration() : durationHintMs;
        if (duration > 0) {
            int progress = (int) Math.min(1000, Math.max(0, (pos * 1000L) / duration));
            seekBar.setProgress(progress);
        }
        timeView.setText(formatClock(pos) + " / " + formatClock(Math.max(0, duration)));
        updatePlayPauseLabel();
    }

    private void updatePlayPauseLabel() {
        if (playPauseBtn == null || player == null) return;
        playPauseBtn.setText(player.isPlaying() ? R.string.player_pause : R.string.player_play);
    }

    private void emitProgress(String state) {
        if (player == null) return;
        JSObject data = new JSObject();
        data.put("state", state);
        data.put("positionMs", Math.max(0, player.getCurrentPosition()));
        long duration = player.getDuration() > 0 ? player.getDuration() : durationHintMs;
        data.put("durationMs", Math.max(0, duration));
        data.put("ratingKey", ratingKey);
        PlayerBridge.get().emit("progress", data);
    }

    private void toggleChrome() {
        setChromeVisible(!chromeVisible);
        if (chromeVisible) bumpChrome();
    }

    private void setChromeVisible(boolean visible) {
        boolean wasHidden = chrome == null || chrome.getVisibility() != View.VISIBLE;
        chromeVisible = visible;
        int vis = visible ? View.VISIBLE : View.GONE;
        if (chrome != null) chrome.setVisibility(vis);
        if (topBar != null) topBar.setVisibility(vis);
        if (visible && wasHidden && playPauseBtn != null) {
            playPauseBtn.requestFocus();
        }
    }

    private void setBufferingVisible(boolean visible) {
        if (bufferingView != null) {
            bufferingView.setVisibility(visible ? View.VISIBLE : View.GONE);
        }
    }

    private void showError(String message) {
        if (errorView == null) return;
        errorView.setText(message);
        errorView.setVisibility(View.VISIBLE);
        setBufferingVisible(false);
        setChromeVisible(true);
    }

    private void hideError() {
        if (errorView != null) errorView.setVisibility(View.GONE);
    }

    private Map<String, String> headersWithCookies(String url, Map<String, String> incoming) {
        Map<String, String> headers = incoming == null ? new HashMap<>() : new HashMap<>(incoming);
        if (!headers.containsKey("User-Agent")) {
            headers.put("User-Agent", USER_AGENT);
        }
        try {
            String cookie = CookieManager.getInstance().getCookie(url);
            if (cookie != null && !cookie.isEmpty()) {
                headers.put("Cookie", cookie);
            }
        } catch (Throwable ignored) {
            /* CookieManager not ready */
        }
        return headers;
    }

    private void bumpChrome() {
        setChromeVisible(true);
        mainHandler.removeCallbacks(hideChromeRunnable);
        mainHandler.postDelayed(hideChromeRunnable, 5000);
    }

    private void restoreAvPrefs() {
        if (ratingKey == null || ratingKey.isEmpty()) return;
        SharedPreferences prefs = getSharedPreferences(PREFS, MODE_PRIVATE);
        String key = prefsKey();
        String savedAudio = prefs.getString(key + ":audio", null);
        String savedSub = prefs.getString(key + ":sub", null);
        if (savedAudio != null && !savedAudio.isEmpty()) audioStreamId = savedAudio;
        if (savedSub != null) subtitleStreamId = savedSub;
    }

    private void saveAvPrefs() {
        if (ratingKey == null || ratingKey.isEmpty()) return;
        SharedPreferences prefs = getSharedPreferences(PREFS, MODE_PRIVATE);
        String key = prefsKey();
        prefs.edit()
            .putString(key + ":audio", audioStreamId == null ? "" : audioStreamId)
            .putString(key + ":sub", subtitleStreamId == null ? "" : subtitleStreamId)
            .apply();
    }

    private String prefsKey() {
        return (showKey != null && !showKey.isEmpty()) ? ("show:" + showKey) : ("item:" + ratingKey);
    }

    private static MediaItem buildMediaItem(String url) {
        MediaItem.Builder builder = new MediaItem.Builder().setUri(Uri.parse(url));
        String lower = url.toLowerCase(Locale.US);
        if (lower.contains(".m3u8") || lower.contains("/hls/")) {
            builder.setMimeType(MimeTypes.APPLICATION_M3U8);
        }
        return builder.build();
    }

    private static String summarizeUrl(String url) {
        try {
            Uri uri = Uri.parse(url);
            return uri.getScheme() + "://" + uri.getHost() + uri.getPath();
        } catch (Throwable ignored) {
            return "(invalid)";
        }
    }

    private Map<String, String> parseHeaders(@Nullable String json) {
        Map<String, String> headers = new HashMap<>();
        if (json == null || json.trim().isEmpty()) return headers;
        try {
            JSONObject obj = new JSONObject(json);
            Iterator<String> keys = obj.keys();
            while (keys.hasNext()) {
                String key = keys.next();
                String value = obj.optString(key, "");
                if (key != null && !key.isEmpty() && value != null && !value.isEmpty()) {
                    headers.put(key, value);
                }
            }
        } catch (Exception ignored) {
            /* keep empty */
        }
        return headers;
    }

    private static String formatClock(long ms) {
        long totalSec = Math.max(0, ms / 1000);
        long h = totalSec / 3600;
        long m = (totalSec % 3600) / 60;
        long s = totalSec % 60;
        if (h > 0) return String.format(Locale.US, "%d:%02d:%02d", h, m, s);
        return String.format(Locale.US, "%d:%02d", m, s);
    }

    private void toast(String msg) {
        try {
            Toast.makeText(this, msg, Toast.LENGTH_SHORT).show();
        } catch (Throwable ignored) {
            /* ignore */
        }
    }

    private void finishForPlayNext() {
        JSObject data = new JSObject();
        data.put("ratingKey", nextRatingKey);
        PlayerBridge.get().emit("playNext", data);
        finishWithResult(true, true);
    }

    private void finishWithResult(boolean ended, boolean playNext) {
        if (finishing) return;
        finishing = true;
        mainHandler.removeCallbacks(tickRunnable);
        mainHandler.removeCallbacks(progressEmitRunnable);
        mainHandler.removeCallbacks(hideChromeRunnable);
        long positionMs = 0L;
        if (player != null) {
            try {
                positionMs = Math.max(0L, player.getCurrentPosition());
                emitProgress(ended ? "stopped" : "paused");
                player.stop();
            } catch (Throwable ignored) {
                /* ignore */
            }
        }
        Intent data = new Intent();
        data.putExtra(EXTRA_ENDED, ended || playbackEnded);
        data.putExtra(EXTRA_POSITION_MS, positionMs);
        data.putExtra(EXTRA_ERROR, playbackError && !ended && !playbackEnded);
        data.putExtra(EXTRA_PLAY_NEXT, playNext);
        if (playNext && nextRatingKey != null) {
            data.putExtra(EXTRA_NEXT_RATING_KEY, nextRatingKey);
        }
        setResult(RESULT_OK, data);
        finish();
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK || keyCode == KeyEvent.KEYCODE_ESCAPE) {
            if (chromeVisible) {
                setChromeVisible(false);
                return true;
            }
            finishWithResult(false, false);
            return true;
        }

        boolean mediaPlay = keyCode == KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE
            || keyCode == KeyEvent.KEYCODE_MEDIA_PLAY
            || keyCode == KeyEvent.KEYCODE_MEDIA_PAUSE;
        boolean confirm = keyCode == KeyEvent.KEYCODE_DPAD_CENTER || keyCode == KeyEvent.KEYCODE_ENTER;

        if (!chromeVisible) {
            if (confirm || mediaPlay) {
                togglePlayPause();
                return true;
            }
            if (keyCode == KeyEvent.KEYCODE_MEDIA_REWIND || keyCode == KeyEvent.KEYCODE_DPAD_LEFT) {
                seekBy(-10_000);
                return true;
            }
            if (keyCode == KeyEvent.KEYCODE_MEDIA_FAST_FORWARD || keyCode == KeyEvent.KEYCODE_DPAD_RIGHT) {
                seekBy(10_000);
                return true;
            }
            if (keyCode == KeyEvent.KEYCODE_DPAD_UP || keyCode == KeyEvent.KEYCODE_DPAD_DOWN
                || keyCode == KeyEvent.KEYCODE_MENU) {
                bumpChrome();
                if (playPauseBtn != null) playPauseBtn.requestFocus();
                return true;
            }
            return super.onKeyDown(keyCode, event);
        }

        bumpChrome();
        View focus = getCurrentFocus();
        boolean seekFocused = focus == seekBar;
        if (mediaPlay) {
            togglePlayPause();
            return true;
        }
        if (confirm && (focus == null || seekFocused || focus == findViewById(R.id.player_view))) {
            togglePlayPause();
            return true;
        }
        if (seekFocused && (keyCode == KeyEvent.KEYCODE_DPAD_LEFT || keyCode == KeyEvent.KEYCODE_MEDIA_REWIND)) {
            seekBy(-10_000);
            return true;
        }
        if (seekFocused && (keyCode == KeyEvent.KEYCODE_DPAD_RIGHT || keyCode == KeyEvent.KEYCODE_MEDIA_FAST_FORWARD)) {
            seekBy(10_000);
            return true;
        }
        if (keyCode == KeyEvent.KEYCODE_MEDIA_REWIND) {
            seekBy(-10_000);
            return true;
        }
        if (keyCode == KeyEvent.KEYCODE_MEDIA_FAST_FORWARD) {
            seekBy(10_000);
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }

    @Override
    protected void onStart() {
        super.onStart();
        if (player != null) player.setPlayWhenReady(true);
    }

    @Override
    protected void onStop() {
        super.onStop();
        if (player != null && !finishing && !isInPictureInPictureMode()) {
            try {
                player.pause();
                emitProgress("paused");
            } catch (Throwable ignored) {
                /* ignore */
            }
        }
    }

    @Override
    protected void onDestroy() {
        PlayerBridge.get().detachActivity(this);
        mainHandler.removeCallbacksAndMessages(null);
        if (player != null) {
            try {
                player.release();
            } catch (Throwable ignored) {
                /* ignore */
            }
            player = null;
        }
        super.onDestroy();
    }
}
