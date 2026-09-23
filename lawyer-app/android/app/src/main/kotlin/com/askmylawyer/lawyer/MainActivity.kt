package com.askmylawyer.lawyer

import android.media.RingtoneManager
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

/** Lets the in-app notification banner use the phone's own alert sound. */
private const val SOUND_CHANNEL = "askmylawyer/sound"

class MainActivity : FlutterActivity() {
    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, SOUND_CHANNEL)
            .setMethodCallHandler { call, result ->
                if (call.method == "notification") {
                    playDefaultNotification()
                    result.success(null)
                } else {
                    result.notImplemented()
                }
            }
    }

    /** Whatever the lawyer has set as their notification tone. */
    private fun playDefaultNotification() {
        runCatching {
            val uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
            RingtoneManager.getRingtone(applicationContext, uri)?.play()
        }
    }
}
