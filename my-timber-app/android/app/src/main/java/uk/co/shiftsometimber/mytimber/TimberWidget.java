package uk.co.shiftsometimber.mytimber;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.widget.RemoteViews;

/** No account data, network, background tracking or medicine information in the widget. */
public final class TimberWidget extends AppWidgetProvider {
    public static final String ROUTE = "uk.co.shiftsometimber.mytimber.WIDGET_ROUTE";
    private static PendingIntent open(Context context, String route, int requestCode) {
        Intent intent = new Intent(context, MainActivity.class)
            .setAction("uk.co.shiftsometimber.mytimber.widget." + route)
            .putExtra(ROUTE, route)
            .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        return PendingIntent.getActivity(context, requestCode, intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }
    @Override public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        for (int id : ids) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.timber_widget);
            views.setOnClickPendingIntent(R.id.widget_today, open(context, "today", 701));
            views.setOnClickPendingIntent(R.id.widget_progress, open(context, "progress", 702));
            views.setOnClickPendingIntent(R.id.widget_grub, open(context, "grub", 703));
            manager.updateAppWidget(id, views);
        }
    }
}
