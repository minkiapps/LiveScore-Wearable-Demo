package com.minkiapps.android.livescore.prefs

import android.content.Context
import androidx.core.content.edit

class AppPreferences(private val context : Context) {

    private val prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)

    fun showAppCouldBeKilledInBackgroundWarning() : Boolean {
        return prefs.getBoolean(PREF_SHOW_APP_COULD_GET_KILLED_IN_BACKGROUND_WARNING, true)
    }

    fun setShowAppCouldBeKilledInBackgroundWarning(value : Boolean) {
        prefs.edit {
            putBoolean(PREF_SHOW_APP_COULD_GET_KILLED_IN_BACKGROUND_WARNING, value)
        }
    }

    companion object {
        private const val PREF_SHOW_APP_COULD_GET_KILLED_IN_BACKGROUND_WARNING = "PREF_SHOW_APP_COULD_GET_KILLED_IN_BACKGROUND_WARNING"

        private const val PREF_NAME = "livescore_default"
    }
}