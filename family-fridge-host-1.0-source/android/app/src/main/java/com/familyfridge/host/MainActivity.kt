package com.familyfridge.host

import android.Manifest
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.google.zxing.BarcodeFormat
import com.google.zxing.EncodeHintType
import com.google.zxing.qrcode.QRCodeWriter

/*
 * The only screen.
 *
 * Deliberately one thing: the address to type, the code to scan, and a
 * switch. Everything else a host could offer (wall management, backups,
 * discovery) is a later slice, and none of it is needed to get the fridge
 * on the wall this evening.
 */
class MainActivity : ComponentActivity() {

    private val askNotifications =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { /* shown or not */ }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Android 13+ hides the foreground notification entirely without
        // this, which makes a running server look like a stopped one.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            askNotifications.launch(Manifest.permission.POST_NOTIFICATIONS)
        }

        setContent {
            MaterialTheme { Surface(Modifier.fillMaxSize()) { HostScreen() } }
        }
    }
}

@Composable
private fun HostScreen() {
    val context = LocalContext.current
    val running by FridgeService.running.collectAsStateWithLifecycle()
    val address by FridgeService.address.collectAsStateWithLifecycle()
    val wallId by FridgeService.wallId.collectAsStateWithLifecycle()
    val clients by FridgeService.hub.clients.collectAsStateWithLifecycle()

    val url = address?.let { "http://$it:$DEFAULT_PORT/w/${wallId.orEmpty()}" }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(28.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(18.dp),
    ) {
        Text("Family Fridge", fontSize = 26.sp, fontWeight = FontWeight.SemiBold)

        Text(
            when {
                !running -> "Not running"
                url == null -> "Running, but this phone is not on wifi"
                clients == 1 -> "Running · 1 device connected"
                else -> "Running · $clients devices connected"
            },
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )

        if (running && url != null) {
            Text(
                url,
                fontFamily = FontFamily.Monospace,
                fontSize = 15.sp,
                textAlign = TextAlign.Center,
                modifier = Modifier
                    .clip(RoundedCornerShape(10.dp))
                    .background(MaterialTheme.colorScheme.surfaceVariant)
                    .padding(14.dp),
            )

            val qr = remember(url) { qrBitmap(url, 640) }
            Image(
                bitmap = qr.asImageBitmap(),
                contentDescription = "QR code for the fridge address",
                modifier = Modifier
                    .size(260.dp)
                    .clip(RoundedCornerShape(12.dp)),
            )

            Text(
                "Scan this, or type the address, on any device on the same wifi.",
                textAlign = TextAlign.Center,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )

            OutlinedButton(
                onClick = { context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url))) },
                modifier = Modifier.fillMaxWidth(),
            ) { Text("Open in browser") }
        }

        Button(
            onClick = {
                if (running) FridgeService.stop(context) else FridgeService.start(context)
            },
            modifier = Modifier.fillMaxWidth(),
        ) { Text(if (running) "Stop" else "Start") }

        OutlinedButton(
            onClick = {
                // Without this most phones will eventually decide a service
                // that has been quiet for hours is not worth keeping.
                context.startActivity(Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS))
            },
            modifier = Modifier.fillMaxWidth(),
        ) { Text("Battery settings") }

        Text(
            "Leave this phone on the charger. The wall stays reachable for as " +
                "long as the notification is showing.",
            fontSize = 13.sp,
            textAlign = TextAlign.Center,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}

/** ZXing gives a bit matrix; turning it into something drawable is on us. */
private fun qrBitmap(text: String, size: Int): Bitmap {
    val matrix = QRCodeWriter().encode(
        text,
        BarcodeFormat.QR_CODE,
        size,
        size,
        mapOf(EncodeHintType.MARGIN to 1),
    )

    // setPixels once rather than setPixel in a loop: at this size that is the
    // difference between instant and a visible stutter on an old phone.
    val pixels = IntArray(size * size)
    for (y in 0 until size) {
        val row = y * size
        for (x in 0 until size) {
            pixels[row + x] = if (matrix[x, y]) Color.BLACK else Color.WHITE
        }
    }

    return Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888).apply {
        setPixels(pixels, 0, size, 0, 0, size, size)
    }
}
