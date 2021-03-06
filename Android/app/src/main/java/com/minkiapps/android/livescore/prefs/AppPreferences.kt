package com.minkiapps.android.livescore.prefs

import android.content.Context
import androidx.core.content.edit

class AppPreferences(private val context : Context) {

    private val serviceLogPrefs = context.getSharedPreferences(PREF_SERVICE_LIVECYCLE_LOGS, Context.MODE_PRIVATE)

    fun addServiceLog(log : String) {
        serviceLogPrefs.edit {
            putString(System.currentTimeMillis().toString(), log)
        }
    }

    fun getAllServiceLog() : List<Pair<Long, String>>{
        return serviceLogPrefs.all.map { e ->
            Pair(e.key.toLong(), e.value.toString())
        }.sortedBy {
            it.first
        }
    }

    fun deleteServiceLogs() {
        serviceLogPrefs.edit {
            clear()
        }
    }


    companion object {
        private const val PREF_NAME = "livescore_default"
        private const val PREF_SERVICE_LIVECYCLE_LOGS = "livescore_service_logs"
    }
}