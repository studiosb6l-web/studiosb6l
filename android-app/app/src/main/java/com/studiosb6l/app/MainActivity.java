package com.studiosb6l.app;
import android.app.Activity;
import android.os.Bundle;
import android.content.Intent;
import android.net.Uri;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
public class MainActivity extends Activity {
 private WebView web;
 @Override public void onCreate(Bundle state){super.onCreate(state);web=new WebView(this);setContentView(web);WebSettings s=web.getSettings();s.setJavaScriptEnabled(true);s.setDomStorageEnabled(true);s.setMediaPlaybackRequiresUserGesture(true);web.setWebChromeClient(new WebChromeClient());web.setWebViewClient(new WebViewClient(){@Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest req){Uri u=req.getUrl();String host=u.getHost();if("https".equals(u.getScheme()) && ("www.studiosb6l.com".equals(host)||"studiosb6l.com".equals(host)))return false;try{startActivity(new Intent(Intent.ACTION_VIEW,u));}catch(Exception ignored){}return true;}});if(state==null)web.loadUrl("https://www.studiosb6l.com/?source=android-app");else web.restoreState(state);}
 @Override protected void onSaveInstanceState(Bundle out){web.saveState(out);super.onSaveInstanceState(out);}
 @Override public void onBackPressed(){if(web.canGoBack())web.goBack();else super.onBackPressed();}
}
