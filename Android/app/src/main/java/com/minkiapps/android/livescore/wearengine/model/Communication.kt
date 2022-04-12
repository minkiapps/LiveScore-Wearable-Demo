package com.minkiapps.android.livescore.wearengine.model

const val COMM_HEALTH_CHECK = "COMM_HEALTH_CHECK"
const val COMM_GET_LIVE_EVENTS = "COMM_GET_LIVE_EVENTS"

class Communication(val command : String,
                    val intParam1 : Int)