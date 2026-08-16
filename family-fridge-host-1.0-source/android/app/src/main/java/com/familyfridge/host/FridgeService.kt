package com.familyfridge.host

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.net.wifi.WifiManager
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

/*
 * What keeps the wall answering.
 *
 * A foreground service is the only arrangement Android will actually leave
 * running, so the persistent notification is the price of the whole idea
 * rather than a design choice. The wifi lock matters at least as much: with
 * the screen off the radio parks itself, and every open socket dies quietly
 * while the service itself stays perfectly alive.
 */
class FridgeService : Service() {

    private lateinit var store: WallStore
    private lateinit var server: FridgeServer
    private var wifiLock: WifiManager.WifiLock? = null
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        store = WallStore(this)
        server = FridgeServer(this, store, hub)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (running.value) return START_STICKY

        createChannel()
        startForegroundCompat(0)
        acquireWifiLock()
        server.start()

        _wallId.value = server.wallId
        _address.value = lanAddress()
        _running.value = true

        // The notification is the only place the count is visible on a phone
        // that is meant to live face-down on a charger.
        scope.launch {
            hub.clients.collect { count -> notify(count) }
        }

        return START_STICKY
    }

    override fun onDestroy() {
        scope.cancel()
        server.stop()
        wifiLock?.takeIf { it.isHeld }?.release()
        wifiLock = null
        store.close()
        _running.value = false
        _address.value = null
        super.onDestroy()
    }

    private fun acquireWifiLock() {
        val wifi = applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
        val mode =
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                WifiManager.WIFI_MODE_FULL_LOW_LATENCY
            } else {
                @Suppress("DEPRECATION")
                WifiManager.WIFI_MODE_FULL_HIGH_PERF
            }
        wifiLock = wifi.createWifiLock(mode, "family-fridge:host").apply {
            setReferenceCounted(false)
            acquire()
        }
    }

    private fun createChannel() {
        val channel = NotificationChannel(
            CHANNEL_ID,
            "Fridge host",
            // Low: present and permanent, but it should never make a sound
            // or push itself in front of anything.
            NotificationManager.IMPORTANCE_LOW,
        ).apply { setShowBadge(false) }

        getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
    }

    private fun startForegroundCompat(clients: Int) {
        val notification = build(clients)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIF_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC)
        } else {
            startForeground(NOTIF_ID, notification)
        }
    }

    private fun notify(clients: Int) {
        getSystemService(NotificationManager::class.java).notify(NOTIF_ID, build(clients))
    }

    private fun build(clients: Int): android.app.Notification {
        val open = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
        )

        val where = _address.value?.let { "$it:$DEFAULT_PORT" } ?: "waiting for wifi"
        val who = when (clients) {
            0 -> "no devices"
            1 -> "1 device"
            else -> "$clients devices"
        }

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Family Fridge")
            .setContentText("$where  ·  $who")
            .setSmallIcon(android.R.drawable.stat_sys_upload_done)
            .setOngoing(true)
            .setSilent(true)
            .setContentIntent(open)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    /*
     * Single process, so the screen reads this directly rather than binding.
     * Binding would buy correctness across processes the app does not have.
     */
    companion object {
        private const val CHANNEL_ID = "fridge-host"
        private const val NOTIF_ID = 1

        val hub = Hub()

        private val _running = MutableStateFlow(false)
        val running: StateFlow<Boolean> = _running

        private val _address = MutableStateFlow<String?>(null)
        val address: StateFlow<String?> = _address

        private val _wallId = MutableStateFlow<String?>(null)
        val wallId: StateFlow<String?> = _wallId

        fun start(context: Context) {
            ContextCompat.startForegroundService(context, Intent(context, FridgeService::class.java))
        }

        fun stop(context: Context) {
            context.stopService(Intent(context, FridgeService::class.java))
        }
    }
}
