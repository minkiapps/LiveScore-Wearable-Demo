package com.minkiapps.android.livescore

import android.app.Notification
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.os.Binder
import android.os.Build
import android.os.IBinder
import android.provider.Settings
import androidx.core.app.NotificationCompat
import com.huawei.wearengine.HiWear
import com.huawei.wearengine.client.ServiceConnectionListener
import com.huawei.wearengine.client.WearEngineClient
import com.huawei.wearengine.device.Device
import com.huawei.wearengine.p2p.P2pClient
import com.huawei.wearengine.p2p.Receiver
import com.minkiapps.android.livescore.extensions.await
import com.minkiapps.android.livescore.log.LogListener
import com.minkiapps.android.livescore.log.LogModel
import com.minkiapps.android.livescore.log.Type
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import org.koin.android.ext.android.inject
import timber.log.Timber

class WearEngineService : Service(), LogListener {

    inner class LocalBinder : Binder() {
        fun getService(): WearEngineService = this@WearEngineService
    }

    private val job = Job()
    private val scope = CoroutineScope(Dispatchers.Main + job)

    private val p2pClient: P2pClient by inject()

    private val binder = LocalBinder()

    val temporaryLogPersistence = mutableListOf<LogModel>()

    private val wearEngineClient : WearEngineClient by lazy {
        HiWear.getWearEngineClient(this, object : ServiceConnectionListener {
            override fun onServiceConnect() {
                Timber.d("On WearEngine connected")
            }

            override fun onServiceDisconnect() {
                Timber.d("On WearEngine disconnected")
                stopSelf()
            }
        })
    }

    var logListener : LogListener? = null

    private val receiver : Receiver = Receiver { m ->
        emitDebugLog("Received message from watch: ${String(m.data)}")
    }

    override fun onCreate() {
        super.onCreate()
        wearEngineClient.registerServiceConnectionListener()
        startForeground()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        intent?.getParcelableExtra<Device>(EXTRA_DEVICE)?.let { d ->
            scope.launch {
                try {
                    p2pClient.registerReceiver(d, receiver).await()
                    emitDebugLog("Register receiver to device successful")
                } catch (e : Exception) {
                    emitExceptionLog("Failed to register receiver", e)
                }
            }
        }
        return super.onStartCommand(intent, flags, startId)
    }

    private fun startForeground() {
        val pendingIntent: PendingIntent =
            Intent(this, MainActivity::class.java).let { notificationIntent ->
                PendingIntent.getActivity(this, 0, notificationIntent, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
            }

        val notificationSettingsIntent = Intent().apply {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                action = Settings.ACTION_APP_NOTIFICATION_SETTINGS
                putExtra(Settings.EXTRA_APP_PACKAGE, packageName)
            } else
                action = "android.settings.APP_NOTIFICATION_SETTINGS"
                putExtra("app_package", packageName)
                putExtra("app_uid", applicationInfo.uid)
        }.let {
            PendingIntent.getActivity(this, 0, it, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
        }

        val healthIntent = packageManager.getLaunchIntentForPackage("com.huawei.health")?.let {
            PendingIntent.getActivity(this, 0, it, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
        }

        val notification: Notification = NotificationCompat.Builder(this, App.CHANNEL_ID)
            .setContentTitle("Huawei Watch")
            .setContentText("You can choose to hide this notification in notification settings.")
            .setSmallIcon(R.drawable.ic_baseline_watch_24)
            .setContentIntent(pendingIntent)
            .setStyle(NotificationCompat.BigTextStyle()
                .bigText("You can choose to hide this notification in notification settings."))
            .addAction(NotificationCompat.Action(R.mipmap.ic_launcher, "GOTO SETTINGS", notificationSettingsIntent))
            .addAction(NotificationCompat.Action(R.mipmap.ic_launcher, "OPEN HEALTH", healthIntent))
            .build()

        // Notification ID cannot be 0.
        startForeground(ONGOING_NOTIFICATION_ID, notification)
    }

    override fun onBind(intent: Intent?): IBinder? {
        return binder
    }

    override fun onDestroy() {
        super.onDestroy()
        job.cancel()
    }

    override fun emitDebugLog(log: String) {
        if(logListener == null) {
            Timber.d(log)
            temporaryLogPersistence.add(LogModel(Type.DEBUG, log))
        }
        logListener?.emitDebugLog(log)
    }

    override fun emitExceptionLog(log: String, e: Exception) {
        if(logListener == null) {
            Timber.e(log, e.message)
            temporaryLogPersistence.add(LogModel(Type.ERROR, "$log Exception message: ${e.message}"))
        }
        logListener?.emitExceptionLog(log, e)
    }

    companion object {
        const val EXTRA_DEVICE = "EXTRA_DEVICE"

        private const val ONGOING_NOTIFICATION_ID = 10001
    }
}