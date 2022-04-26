package com.minkiapps.android.livescore.wearengine.model

const val COMM_HEALTH_CHECK = "COMM_HEALTH_CHECK"
const val COMM_GET_LIVE_EVENTS = "COMM_GET_LIVE_EVENTS"

const val MODEL_GT2_PRO = "gt2pro"
const val MODEL_GT3 = "gt3"
const val MODEL_GT3PRO = "gt3pro"

class Communication(val command : String,
                    val model : String,
                    val intParam1 : Int)