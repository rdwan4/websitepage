package online.islamiclight.app;

import android.content.Intent;
import android.os.Bundle;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        handleNotificationIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        handleNotificationIntent(intent);
    }

    private void handleNotificationIntent(Intent intent) {
        if (intent == null || intent.getExtras() == null) return;

        String title = intent.getStringExtra("notif_title");
        String body = intent.getStringExtra("notif_body");

        if (title == null) title = intent.getStringExtra("google.c.a.c_l");
        if (body == null) body = intent.getStringExtra("google.c.a.c_p");

        if (title != null || body != null) {
            final String t = title != null ? title : "";
            final String b = body != null ? body : "";

            // Store in localStorage so the web app can read it on startup
            getBridge().getWebView().post(() -> {
                WebView webView = getBridge().getWebView();
                String js = "try { localStorage.setItem('pending_notification', JSON.stringify({title:'"
                        + escapeJs(t) + "',body:'" + escapeJs(b) + "'})); } catch(e){}";
                webView.evaluateJavascript(js, null);
            });
        }
    }

    private String escapeJs(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("'", "\\'")
                .replace("\n", "\\n")
                .replace("\r", "\\r");
    }
}
