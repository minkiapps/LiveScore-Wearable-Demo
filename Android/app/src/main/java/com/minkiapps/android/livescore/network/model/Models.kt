package com.minkiapps.android.livescore.network.model

class Wrapper(val data : List<LiveEvent>)

class LiveEvent(val name : String,
                val status_more : String,
                val home_score : Score,
                val away_score : Score)

class Score(val display : Int)

