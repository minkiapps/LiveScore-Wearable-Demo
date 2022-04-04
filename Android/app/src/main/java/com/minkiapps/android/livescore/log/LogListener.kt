package com.minkiapps.android.livescore.log

interface LogListener {

    fun emitDebugLog(log : String)

    fun emitExceptionLog(log : String, e : Exception)
}