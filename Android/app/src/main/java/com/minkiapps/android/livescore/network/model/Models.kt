package com.minkiapps.android.livescore.network.model

import timber.log.Timber
import java.text.SimpleDateFormat
import java.util.*

class LiteWrapper(val data : List<LiteLiveEvent>)

class Wrapper(val data : List<LiveEvent>)

data class LiteLiveEvent(val name : String,
                         val status_more : String,
                         val start_at : String,
                         val home_score : Score,
                         val away_score : Score)

data class LiveEvent(val name : String,
                     val status_more : String,
                     val start_at : String,
                     val home_team : Team,
                     val away_team : Team,
                     val home_score : Score,
                     val away_score : Score)

data class Score(val display : Int)

data class Team(val logo : String)

private val parseFormatter = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault())
private val formatter = SimpleDateFormat("HH:mm", Locale.getDefault())

fun LiteLiveEvent.formatStartedAt() : String {
    return try {
        formatter.format(parseFormatter.parse(start_at)!!)
    } catch (e : Exception) {
        Timber.e("Failed to parse data string", e)
        ""
    }
}