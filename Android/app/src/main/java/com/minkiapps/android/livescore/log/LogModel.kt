package com.minkiapps.android.livescore.log

import android.os.Parcelable
import kotlinx.parcelize.Parcelize

enum class Type {
    DEBUG, FLASHY, ERROR
}

@Parcelize
data class LogModel(val type : Type,
                    val text : String,
                    val timeStamp : Long = System.currentTimeMillis()) : Parcelable