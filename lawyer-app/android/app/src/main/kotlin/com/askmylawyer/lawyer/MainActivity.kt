package com.askmylawyer.lawyer

import android.media.AudioAttributes
import android.media.AudioManager
import android.media.MediaPlayer
import android.media.RingtoneManager
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.util.Log
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

/**
 * Sounds the app cannot make on its own: the phone's notification tone for an
 * in-app banner, and a proper looping ringtone when a consultation comes in.
 */
private const val SOUND_CHANNEL = "askmylawyer/sound"

/** Rings, pauses, rings — roughly the cadence of an incoming call. */
private val RING_PATTERN = longArrayOf(0, 1000, 1000)

private const val TAG = "AmlRing"

class MainActivity : FlutterActivity() {
    private var ringtone: MediaPlayer? = null

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        Log.i(TAG, "configureFlutterEngine: registering the sound channel")

        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, SOUND_CHANNEL)
            .setMethodCallHandler { call, result ->
                Log.i(TAG, "channel call: ${call.method}")
                when (call.method) {
                    "notification" -> {
                        playDefaultNotification()
                        result.success(null)
                    }
                    "ringStart" -> {
                        startRinging()
                        result.success(null)
                    }
                    "ringStop" -> {
                        stopRinging()
                        result.success(null)
                    }
                    else -> result.notImplemented()
                }
            }
    }

    /** A ringing phone must not outlive the screen that started it. */
    override fun onDestroy() {
        stopRinging()
        super.onDestroy()
    }

    /** Whatever the lawyer has set as their notification tone. */
    private fun playDefaultNotification() {
        runCatching {
            val uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
            RingtoneManager.getRingtone(applicationContext, uri)?.play()
        }
    }

    /**
     * The lawyer's own ringtone, looping until the call is answered or gone.
     *
     * Plays on the ring stream rather than the media one, so the phone's
     * silent and vibrate modes are honoured the way they are for any call.
     */
    private fun startRinging() {
        stopRinging()

        val audio = getSystemService(AUDIO_SERVICE) as? AudioManager
        val mode = audio?.ringerMode ?: AudioManager.RINGER_MODE_NORMAL
        Log.i(TAG, "ringStart: ringer mode = $mode")

        // Silent means silent. Vibrate still buzzes, just without the tone.
        if (mode != AudioManager.RINGER_MODE_SILENT) vibrate()
        if (mode != AudioManager.RINGER_MODE_NORMAL) {
            Log.i(TAG, "Phone is not on normal ring; vibrating only.")
            return
        }

        runCatching {
            val uri = RingtoneManager.getActualDefaultRingtoneUri(
                applicationContext,
                RingtoneManager.TYPE_RINGTONE,
            ) ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)

            ringtone = MediaPlayer().apply {
                setDataSource(applicationContext, uri)
                setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build(),
                )
                isLooping = true
                prepare()
                start()
            }
            Log.i(TAG, "Ringing on $uri")
        }.onFailure {
            // Worth saying out loud: a silent failure here looks exactly like
            // a phone that never rang.
            Log.e(TAG, "Could not start the ringtone", it)
            stopRinging()
        }
    }

    private fun stopRinging() {
        if (ringtone != null) Log.i(TAG, "ringStop")
        runCatching { ringtone?.stop() }
        runCatching { ringtone?.release() }
        ringtone = null
        runCatching { vibrator()?.cancel() }
    }

    private fun vibrate() {
        val vibrator = vibrator() ?: return

        runCatching {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                // 0 repeats the pattern from the start, so it keeps going.
                vibrator.vibrate(VibrationEffect.createWaveform(RING_PATTERN, 0))
            } else {
                @Suppress("DEPRECATION")
                vibrator.vibrate(RING_PATTERN, 0)
            }
        }
    }

    private fun vibrator(): Vibrator? =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            (getSystemService(VIBRATOR_MANAGER_SERVICE) as? VibratorManager)?.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            getSystemService(VIBRATOR_SERVICE) as? Vibrator
        }
}
