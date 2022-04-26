package com.minkiapps.android.livescore.wearengine

import android.app.Notification
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.provider.Settings
import androidx.core.app.NotificationCompat
import com.google.gson.Gson
import com.huawei.wearengine.HiWear
import com.huawei.wearengine.client.ServiceConnectionListener
import com.huawei.wearengine.client.WearEngineClient
import com.huawei.wearengine.device.Device
import com.huawei.wearengine.p2p.Message
import com.huawei.wearengine.p2p.P2pClient
import com.huawei.wearengine.p2p.Receiver
import com.huawei.wearengine.p2p.SendCallback
import com.jakewharton.rxrelay3.PublishRelay
import com.minkiapps.android.livescore.App
import com.minkiapps.android.livescore.MainActivity
import com.minkiapps.android.livescore.R
import com.minkiapps.android.livescore.extensions.await
import com.minkiapps.android.livescore.log.LogListener
import com.minkiapps.android.livescore.log.LogModel
import com.minkiapps.android.livescore.log.Type
import com.minkiapps.android.livescore.network.ApiService
import com.minkiapps.android.livescore.network.model.Wrapper
import com.minkiapps.android.livescore.network.model.formatStartedAt
import com.minkiapps.android.livescore.prefs.AppPreferences
import com.minkiapps.android.livescore.wearengine.model.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import org.koin.android.ext.android.inject
import timber.log.Timber
import java.io.File
import java.io.FileOutputStream
import kotlin.math.max
import kotlin.math.min

class WearEngineService : Service(), LogListener {

    private val appPreferences : AppPreferences by inject()

    private inner class ReceiverImpl : Receiver {

        var device : Device? = null

        override fun onReceiveMessage(m: Message) {
            val msgString = String(m.data)
            emitDebugLog("Received message: $msgString")
            device?.let { d ->
                processMessage(d, msgString)
            }
        }
    }

    private val job = Job()
    private val scope = CoroutineScope(Dispatchers.Main + job)

    private val gson : Gson by inject()
    private val apiService : ApiService by inject()
    private val p2pClient: P2pClient by inject()

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

    private var receiver = ReceiverImpl()

    override fun onCreate() {
        super.onCreate()
        wearEngineClient.registerServiceConnectionListener()

        appPreferences.addServiceLog("WearEngine Service created")
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        intent?.getParcelableExtra<Device>(EXTRA_DEVICE)?.let { d ->
            if(d.uuid == receiver.device?.uuid) {
                emitFlashyLog("Receiver for device ${d.name} is already registered")
                return@let
            }

            startForeground(d.name)
            scope.launch {
                try {
                    if(receiver.device != null) {
                        emitDebugLog("Unregister receiver for device: ${receiver.device?.name}")
                        p2pClient.unregisterReceiver(receiver).await()
                    }
                    receiver.device = d
                    p2pClient.registerReceiver(d, receiver).await()
                    emitDebugLog("Register receiver to device successful")
                } catch (e : Exception) {
                    emitExceptionLog("Failed to register receiver", e)
                }
            }
        }
        return super.onStartCommand(intent, flags, startId)
    }

    private fun startForeground(deviceName : String) {
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

        val contextText = "Connected to ${deviceName}\nYou can choose to hide this notification in notification settings."
        val notification: Notification = NotificationCompat.Builder(this, App.CHANNEL_ID)
            .setContentTitle("Huawei Watch")
            .setContentText(contextText)
            .setSmallIcon(R.drawable.ic_baseline_watch_24)
            .setContentIntent(pendingIntent)
            .setStyle(NotificationCompat.BigTextStyle()
                .bigText(contextText))
            .addAction(NotificationCompat.Action(R.mipmap.ic_launcher, "GOTO SETTINGS", notificationSettingsIntent))
            .addAction(NotificationCompat.Action(R.mipmap.ic_launcher, "OPEN HEALTH", healthIntent))
            .build()

        // Notification ID cannot be 0.
        startForeground(ONGOING_NOTIFICATION_ID, notification)
    }

    private fun processMessage(device : Device, msgString : String) {
        scope.launch {
            try {
                val comm = gson.fromJson(msgString, Communication::class.java)

                when(comm.command) {
                    COMM_HEALTH_CHECK -> {
                        //noop
                    }
                    COMM_GET_LIVE_EVENTS -> {
                        val wrapper = apiService.fetchLiveEvents(comm.intParam1)

                        //lets take only max 25 to avoid OOM on the wearable site
                        val maxItems = when(comm.model) {
                            MODEL_GT2_PRO -> 10
                            MODEL_GT3, MODEL_GT3PRO -> 25
                            else -> 10
                        }

                        val minified = Wrapper(wrapper.data.subList(0,
                            min(max(0, wrapper.data.size - 1), maxItems)
                        ).map { it.copy(start_at = it.formatStartedAt()) })
                        val jsonString = gson.toJson(minified)
                        Timber.d("Sending message: $jsonString")
                        emitDebugLog("Sending message length: ${jsonString.length}")
                        sendMessage(device, jsonString)
                    }
                }
            } catch (e : Exception) {
                emitExceptionLog("Failed to process wearable message", e)
            }
        }
    }

    private fun sendMessage(device: Device, text: String) {
        val file = File.createTempFile("temp", ".json", cacheDir)
        FileOutputStream(file).use { out ->
            out.write(text.toByteArray())
        }

        val message = Message.Builder()
            .setPayload(file)
            .build()

        val sendCallback: SendCallback = object : SendCallback {
            override fun onSendResult(resultCode: Int) {
                emitDebugLog("Send message result: $resultCode")
            }
            override fun onSendProgress(progress: Long) {
                emitDebugLog("Send message progress: $progress")
            }
        }

        p2pClient.send(device, message, sendCallback).addOnSuccessListener {
            emitDebugLog("Send message successful")
            file.delete()
        }.addOnFailureListener {
            emitDebugLog("Send message failed")
            file.delete()
        }
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }

    override fun onDestroy() {
        super.onDestroy()
        appPreferences.addServiceLog("WearEngine Service destroyed")
        job.cancel()
    }

    override fun emitDebugLog(log: String) {
        Timber.d(log)
        appPreferences.addServiceLog(log)
        logRelay.accept(LogModel(Type.DEBUG, log))
    }

    override fun emitFlashyLog(log: String) {
        Timber.w(log)
        appPreferences.addServiceLog(log)
        logRelay.accept(LogModel(Type.FLASHY, log))
    }

    override fun emitExceptionLog(log: String, e: Exception) {
        Timber.e(log, e.message)
        appPreferences.addServiceLog("$log Exception message: ${e.message}")
        logRelay.accept(LogModel(Type.ERROR, "$log Exception message: ${e.message}"))
    }

    companion object {
        const val EXTRA_DEVICE = "EXTRA_DEVICE"

        private const val ONGOING_NOTIFICATION_ID = 10001

        //why I use rxrelay instead of binder because unbind service on Activity
        // brings on some devices to Service to restart, which is undesirable,
        //also broadcast receiver seems to bring Service to restart
        //https://stackoverflow.com/questions/33267793/android-service-closes-after-unbind
        val logRelay = PublishRelay.create<LogModel>()
    }
}