package com.minkiapps.android.livescore.log

enum class Type {
    DEBUG, FLASHY, ERROR
}

data class LogModel(val type : Type, val text : String, val timeStamp : Long = System.currentTimeMillis())