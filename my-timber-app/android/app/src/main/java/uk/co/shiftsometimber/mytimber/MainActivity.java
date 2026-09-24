package uk.co.shiftsometimber.mytimber;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.net.http.SslError;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowManager;
import android.webkit.*;
import android.widget.*;
import java.io.InputStream;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;

/** Native client for the existing hosted My Timber service. No privileged JS bridge. */
public final class MainActivity extends Activity {
    private WebView web;
    private LinearLayout failure;
    private String presentation;
    private final Handler timer = new Handler(Looper.getMainLooper());
    private final Runnable timeout = () -> showFailure("My Timber is taking longer than expected. Nothing has been confirmed as saved by this app.");
    private ValueCallback<Uri[]> fileResult;
    private boolean pageFailed;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        if ((getApplicationInfo().flags & android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE) == 0)
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_SECURE);
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Color.rgb(5,5,5));
        if (Build.VERSION.SDK_INT >= 30) {
            getWindow().setDecorFitsSystemWindows(false);
            root.setOnApplyWindowInsetsListener((v, insets) -> {
                android.graphics.Insets bars = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.ime());
                v.setPadding(bars.left, bars.top, bars.right, bars.bottom);
                return insets;
            });
        }
        failure = new LinearLayout(this);
        failure.setOrientation(LinearLayout.VERTICAL);
        failure.setPadding(24,24,24,24);
        failure.setVisibility(View.GONE);
        root.addView(failure);
        web = new WebView(this);
        web.setBackgroundColor(Color.rgb(5,5,5));
        root.addView(web, new LinearLayout.LayoutParams(-1,0,1));
        FrameLayout shell = new FrameLayout(this);
        shell.setBackgroundColor(Color.rgb(5,5,5));
        shell.addView(root,new FrameLayout.LayoutParams(-1,-1));
        StartupOverlay startup = new StartupOverlay(this);
        shell.addView(startup,new FrameLayout.LayoutParams(-1,-1));
        setContentView(shell);
        try (InputStream stream = getAssets().open("native-presentation.js")) {
            ByteArrayOutputStream bytes = new ByteArrayOutputStream();
            byte[] block = new byte[4096]; int n;
            while ((n=stream.read(block)) != -1) bytes.write(block,0,n);
            presentation = bytes.toString(StandardCharsets.UTF_8.name());
        } catch (Exception e) { showFailure("My Timber could not start securely. Please close the app and try again."); return; }
        WebView.setWebContentsDebuggingEnabled(false);
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true); // Required by the existing PWA.
        settings.setDomStorageEnabled(true);
        settings.setCacheMode(WebSettings.LOAD_NO_CACHE);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true); // Explicit user-selected document uploads only.
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setSafeBrowsingEnabled(true);
        settings.setGeolocationEnabled(false);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setSupportMultipleWindows(false);
        settings.setUserAgentString(settings.getUserAgentString()+" MyTimber/1.0.0");
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(web,false);
        web.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                NavigationPolicy.Decision decision = NavigationPolicy.classify(request.getUrl().toString());
                if (!request.isForMainFrame()) {
                    // Let HTTPS challenge frames use normal browser isolation.
                    // Never open phone/email/native schemes from embedded frames.
                    return !"https".equalsIgnoreCase(request.getUrl().getScheme())
                        || decision == NavigationPolicy.Decision.DENY;
                }
                if (decision == NavigationPolicy.Decision.INTERNAL) return false;
                openOutside(request.getUrl().toString());
                return true;
            }
            @Override public void onPageStarted(WebView view, String url, android.graphics.Bitmap icon) {
                // Also guard navigations (including forms) not passed to the URL override.
                if (NavigationPolicy.classify(url) != NavigationPolicy.Decision.INTERNAL) {
                    timer.removeCallbacks(timeout);
                    view.stopLoading();
                    openOutside(url);
                    return;
                }
                pageFailed=false; failure.setVisibility(View.GONE);
                timer.removeCallbacks(timeout); timer.postDelayed(timeout,30000);
            }
            @Override public void onPageFinished(WebView view, String url) {
                timer.removeCallbacks(timeout);
                if (!pageFailed && NavigationPolicy.classify(url)==NavigationPolicy.Decision.INTERNAL) {
                    view.evaluateJavascript(presentation,null);
                    CookieManager.getInstance().flush();
                }
            }
            @Override public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) showFailure("A connection is needed. Check your connection, then return to Today. Check your account before repeating any save or payment.");
            }
            @Override public void onReceivedHttpError(WebView view, WebResourceRequest request, WebResourceResponse response) {
                if (request.isForMainFrame() && response.getStatusCode() >= 500) showFailure("My Timber could not load. Check your account before repeating any save or payment.");
            }
            @Override public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
                handler.cancel(); showFailure("The secure connection could not be verified. Do not enter account details until it is restored.");
            }
            @Override public void onFormResubmission(WebView view, android.os.Message dontResend, android.os.Message resend) {
                dontResend.sendToTarget(); showFailure("This form has not been sent again. Return to Today and check the result before trying again.");
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onJsAlert(WebView view,String url,String message,JsResult result) {
                if(NavigationPolicy.classify(url)!=NavigationPolicy.Decision.INTERNAL){result.cancel();return true;}
                new AlertDialog.Builder(MainActivity.this).setTitle("My Timber").setMessage(message)
                    .setPositiveButton("OK",(d,w)->result.confirm()).setOnCancelListener(d->result.cancel()).show(); return true;
            }
            @Override public boolean onJsConfirm(WebView view,String url,String message,JsResult result) {
                if(NavigationPolicy.classify(url)!=NavigationPolicy.Decision.INTERNAL){result.cancel();return true;}
                new AlertDialog.Builder(MainActivity.this).setTitle("My Timber").setMessage(message)
                    .setPositiveButton("Continue",(d,w)->result.confirm()).setNegativeButton("Cancel",(d,w)->result.cancel())
                    .setOnCancelListener(d->result.cancel()).show();return true;
            }
            @Override public void onPermissionRequest(PermissionRequest request) { request.deny(); }
            @Override public boolean onShowFileChooser(WebView view,ValueCallback<Uri[]> result,FileChooserParams params) {
                if(NavigationPolicy.classify(view.getUrl())!=NavigationPolicy.Decision.INTERNAL){result.onReceiveValue(null);return true;}
                if(fileResult!=null)fileResult.onReceiveValue(null);
                fileResult=result;
                Intent pick=new Intent(Intent.ACTION_OPEN_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("*/*");
                String[] types=params.getAcceptTypes();
                if(types!=null && types.length>0 && !types[0].isEmpty())pick.putExtra(Intent.EXTRA_MIME_TYPES,types);
                pick.putExtra(Intent.EXTRA_ALLOW_MULTIPLE,params.getMode()==FileChooserParams.MODE_OPEN_MULTIPLE);
                try { startActivityForResult(pick,41); } catch (Exception e) { fileResult.onReceiveValue(null);fileResult=null; }
                return true;
            }
        });
        // Never restore/replay form history from a Bundle, or copy Safari/Chrome cookies.
        web.loadUrl(NavigationPolicy.START);
        if (Build.VERSION.SDK_INT >= 33) getOnBackInvokedDispatcher().registerOnBackInvokedCallback(
            android.window.OnBackInvokedDispatcher.PRIORITY_DEFAULT, () -> {if(web.canGoBack())web.goBack();else finish();});
    }
    private void openOutside(String url) {
        if(NavigationPolicy.classify(url)!=NavigationPolicy.Decision.EXTERNAL) {
            new AlertDialog.Builder(this).setTitle("Link not opened").setMessage("This app only opens secure web links and phone or email links.").setPositiveButton("OK",null).show(); return;
        }
        new AlertDialog.Builder(this).setTitle("Open outside My Timber?")
            .setMessage("Your browser, phone or email app will handle this link.")
            .setPositiveButton("Open",(d,w)->{try{startActivity(new Intent(Intent.ACTION_VIEW,Uri.parse(url)).addCategory(Intent.CATEGORY_BROWSABLE));}catch(Exception e){showFailure("No suitable app was found to open that link.");}})
            .setNegativeButton("Cancel",null).show();
    }
    private void showFailure(String message) {
        pageFailed=true;timer.removeCallbacks(timeout);failure.removeAllViews();
        TextView text=new TextView(this);text.setText(message);text.setTextColor(Color.rgb(231,227,218));text.setTextSize(16);failure.addView(text);
        Button retry=new Button(this);retry.setText("Return to Today");
        retry.setOnClickListener(v->new AlertDialog.Builder(this).setTitle("Return to Today?")
            .setMessage("Anything still in this page that has not been saved may be lost. No form or payment will be resent automatically.")
            .setPositiveButton("Return",(d,w)->web.loadUrl(NavigationPolicy.START)).setNegativeButton("Stay here",(d,w)->{}).show());
        failure.addView(retry);failure.setVisibility(View.VISIBLE);
    }
    @Override protected void onActivityResult(int request,int result,Intent data) {
        super.onActivityResult(request,result,data);
        if(request!=41||fileResult==null)return;
        Uri[] values=WebChromeClient.FileChooserParams.parseResult(result,data);
        if(values!=null)for(Uri uri:values)if(uri==null||!"content".equals(uri.getScheme())){values=null;break;}
        fileResult.onReceiveValue(values);fileResult=null;
    }
    @SuppressWarnings("deprecation") @Override public void onBackPressed() {
        if(web!=null&&web.canGoBack())web.goBack();else super.onBackPressed();
    }
    @Override protected void onPause(){super.onPause();if(web!=null)web.onPause();CookieManager.getInstance().flush();}
    @Override protected void onResume(){super.onResume();if(web!=null)web.onResume();}
    @Override protected void onDestroy(){timer.removeCallbacksAndMessages(null);if(fileResult!=null)fileResult.onReceiveValue(null);if(web!=null){web.stopLoading();web.destroy();}super.onDestroy();}
}
