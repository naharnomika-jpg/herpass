package com.herpass.hostel;

import android.annotation.SuppressLint;
import android.content.Intent;
import android.net.ConnectivityManager;
import android.net.NetworkCapabilities;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.activity.OnBackPressedCallback;
import androidx.appcompat.app.AppCompatActivity;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

/**
 * MainActivity — Herpass WebView Host
 *
 * Loads the Herpass FastAPI web app inside a full-screen, hardware-accelerated
 * WebView. Provides:
 *   • Branded loading splash that fades out when the page finishes loading
 *   • Detailed error/no-connection screen with a Retry button
 *   • External links (not on the Herpass host) open in the system browser
 *   • Swipe-to-refresh with Herpass brand colour
 *   • Modern OnBackPressedCallback for proper WebView back-navigation
 *   • Custom User-Agent suffix ("HerpassAndroid/1.0") for server-side detection
 *
 * Server target:
 *   http://10.0.2.2:8000  →  Android emulator → host machine localhost
 *   Change APP_URL below to your PC's LAN IP when testing on a physical device.
 */
public class MainActivity extends AppCompatActivity {

    // ── Configuration ─────────────────────────────────────────────────────────

    /**
     * URL of the running Herpass FastAPI server.
     *
     * Emulator default : http://10.0.2.2:8000
     * Physical device  : http://<YOUR_PC_LAN_IP>:8000  (e.g. http://192.168.1.5:8000)
     */
    private static final String APP_URL  = "http://10.0.2.2:8000/";
    /** Host portion used to distinguish internal vs external links. */
    private static final String APP_HOST = "10.0.2.2";

    // ── Views ─────────────────────────────────────────────────────────────────

    private WebView            mWebView;
    private SwipeRefreshLayout mSwipeRefreshLayout;
    private View               mLoadingOverlay;
    private View               mErrorView;

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    @Override
    @SuppressLint("SetJavaScriptEnabled")
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        mWebView            = findViewById(R.id.webView);
        mSwipeRefreshLayout = findViewById(R.id.swipeRefreshLayout);
        mLoadingOverlay     = findViewById(R.id.loadingOverlay);
        mErrorView          = findViewById(R.id.errorView);

        setupSwipeRefresh();
        setupWebView();
        setupBackNavigation();

        // Wire up the retry button
        findViewById(R.id.retryButton).setOnClickListener(v -> loadApp());

        loadApp();
    }

    // ── Setup Helpers ─────────────────────────────────────────────────────────

    /** Configure SwipeRefreshLayout with Herpass brand pink. */
    private void setupSwipeRefresh() {
        mSwipeRefreshLayout.setColorSchemeColors(getColor(R.color.brand_pink));
        mSwipeRefreshLayout.setProgressBackgroundColorSchemeColor(getColor(R.color.bg_card));
        mSwipeRefreshLayout.setOnRefreshListener(() -> mWebView.reload());
    }

    /** Configure WebView settings and WebViewClient callbacks. */
    @SuppressLint("SetJavaScriptEnabled")
    private void setupWebView() {
        WebSettings settings = mWebView.getSettings();

        // Core capability flags required by the Herpass SPA
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);

        // Allow mixed HTTP content (needed since we're loading from HTTP locally)
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);

        // Let the browser cache assist page loads when server is slow
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);

        // Append HerpassAndroid to the user-agent so the web app can detect the
        // native wrapper and conditionally hide the PWA install button, etc.
        String defaultUA = settings.getUserAgentString();
        settings.setUserAgentString(defaultUA + " HerpassAndroid/1.0");

        mWebView.setWebViewClient(new WebViewClient() {

            /**
             * Route URLs:
             *  - Herpass host (APP_HOST)  → stay in WebView
             *  - Everything else           → open in system browser
             */
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                String host = uri.getHost();
                if (host != null && host.equals(APP_HOST)) {
                    return false; // Let WebView handle it
                }
                // Open external URLs in the default browser
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW, uri);
                    startActivity(intent);
                } catch (Exception ignored) { /* no browser installed — just ignore */ }
                return true;
            }

            /** Page loaded successfully — hide the loading overlay with a fade. */
            @Override
            public void onPageFinished(WebView view, String url) {
                mSwipeRefreshLayout.setRefreshing(false);
                // Smooth fade-out of the loading overlay
                mLoadingOverlay.animate()
                        .alpha(0f)
                        .setDuration(450)
                        .withEndAction(() -> mLoadingOverlay.setVisibility(View.GONE))
                        .start();
                mErrorView.setVisibility(View.GONE);
            }

            /** Main frame failed to load — show the error/offline screen. */
            @Override
            public void onReceivedError(WebView view,
                                        WebResourceRequest request,
                                        WebResourceError error) {
                if (request.isForMainFrame()) {
                    mSwipeRefreshLayout.setRefreshing(false);
                    mLoadingOverlay.setVisibility(View.GONE);
                    mErrorView.setVisibility(View.VISIBLE);
                }
            }
        });
    }

    /**
     * Register a modern OnBackPressedCallback so pressing back navigates the
     * WebView history before leaving the Activity.
     */
    private void setupBackNavigation() {
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (mWebView != null && mWebView.canGoBack()) {
                    mWebView.goBack();
                } else {
                    // Disable this callback temporarily and let the system handle back
                    setEnabled(false);
                    getOnBackPressedDispatcher().onBackPressed();
                    setEnabled(true);
                }
            }
        });
    }

    // ── App Load / Retry ──────────────────────────────────────────────────────

    /**
     * (Re-)load the Herpass web app.
     * Shows the loading overlay and hides the error view first.
     */
    private void loadApp() {
        mErrorView.setVisibility(View.GONE);
        mLoadingOverlay.setAlpha(1f);
        mLoadingOverlay.setVisibility(View.VISIBLE);
        mWebView.loadUrl(APP_URL);
    }
}
