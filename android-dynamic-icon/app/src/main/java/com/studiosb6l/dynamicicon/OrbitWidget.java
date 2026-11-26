package com.studiosb6l.dynamicicon;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.widget.RemoteViews;
public class OrbitWidget extends AppWidgetProvider {
 @Override public void onUpdate(Context c, AppWidgetManager m, int[] ids) {
  for(int id:ids){
   RemoteViews v=new RemoteViews(c.getPackageName(),R.layout.widget);
   try(java.io.InputStream in=c.getAssets().open("official.png")){v.setImageViewBitmap(R.id.logo,BitmapFactory.decodeStream(in));}catch(java.io.IOException e){v.setImageViewResource(R.id.logo,android.R.drawable.ic_menu_gallery);}
   Intent open=new Intent(Intent.ACTION_VIEW,Uri.parse("https://www.studiosb6l.com/"));
   v.setOnClickPendingIntent(R.id.root,PendingIntent.getActivity(c,id,open,PendingIntent.FLAG_IMMUTABLE|PendingIntent.FLAG_UPDATE_CURRENT));
   m.updateAppWidget(id,v);
  }
 }
}