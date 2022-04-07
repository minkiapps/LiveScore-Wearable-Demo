package com.minkiapps.android.livescore.util

import android.content.Context
import android.content.pm.PackageManager
import androidx.compose.ui.text.toUpperCase
import com.minkiapps.android.livescore.BuildConfig
import timber.log.Timber
import java.security.MessageDigest
import java.util.*

fun Context.getSignatureSha256Fingerprint() : String? {
    try {
        val info = packageManager.getPackageInfo(
            BuildConfig.APPLICATION_ID,
            PackageManager.GET_SIGNATURES
        )
        info.signatures.first()?.let { s ->
            val md = MessageDigest.getInstance("SHA256")
            md.update(s.toByteArray())
            val digest = md.digest()
            val toRet = StringBuilder()
            for (i in digest.indices) {
                if (i != 0) toRet.append(":")
                val b = digest[i].toInt() and 0xff
                val hex = Integer.toHexString(b)
                if (hex.length == 1) toRet.append("0")
                toRet.append(hex)
            }
            return toRet.toString().uppercase()
        }
    } catch (e: Exception) {
        Timber.e("name not found", e)
    }

    return null
}