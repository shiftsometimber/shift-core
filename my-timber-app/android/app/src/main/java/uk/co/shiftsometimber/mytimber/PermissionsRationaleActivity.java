package uk.co.shiftsometimber.mytimber;
import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebResourceRequest;

/** Health Connect permission rationale: the same public policy URL used in Play Console. */
public final class PermissionsRationaleActivity extends Activity {
 @Override public void onCreate(Bundle state){
  super.onCreate(state);
  WebView web=new WebView(this);
  web.getSettings().setJavaScriptEnabled(false);
  web.getSettings().setAllowFileAccess(false);
  web.getSettings().setAllowContentAccess(false);
  web.setWebViewClient(new WebViewClient(){
   @Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest r){
    return !"https".equalsIgnoreCase(r.getUrl().getScheme())||!"shiftsometimber.co.uk".equalsIgnoreCase(r.getUrl().getHost());
   }
  });
  setContentView(web);
  web.loadUrl("https://shiftsometimber.co.uk/my-timber/privacy");
 }
}
