package com.minkiapps.android.livescore.extensions

import com.huawei.wearengine.device.Device
import com.huawei.wearengine.p2p.P2pClient
import com.minkiapps.android.livescore.extensions.TaskException
import kotlinx.coroutines.isActive
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlin.coroutines.suspendCoroutine

suspend fun P2pClient.suspendPing(device: Device) = suspendCoroutine<Int>{ cont ->
    ping(device) {
        if(cont.context.isActive) {
            cont.resume(it)
        }
    }.addOnCompleteListener { task ->
        if(!task.isSuccessful && cont.context.isActive) {
            cont.resumeWithException(TaskException("Request permission task was not successful", task.exception))
        }
    }
}