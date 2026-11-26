package fr.erwan.scancourses

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews

/** Widget de l'écran d'accueil : un bouton qui ouvre directement le scanner. */
class ScanWidget : AppWidgetProvider() {
    override fun onUpdate(ctx: Context, mgr: AppWidgetManager, ids: IntArray) {
        val i = Intent(ctx, MainActivity::class.java).setAction(ACTION_SCAN).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        val pi = PendingIntent.getActivity(ctx, 7, i, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        for (id in ids) {
            val v = RemoteViews(ctx.packageName, R.layout.widget_scan)
            v.setOnClickPendingIntent(R.id.widget_root, pi)
            mgr.updateAppWidget(id, v)
        }
    }
    companion object { const val ACTION_SCAN = "fr.erwan.scancourses.SCAN" }
}
