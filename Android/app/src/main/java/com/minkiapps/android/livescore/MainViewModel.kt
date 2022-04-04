package com.minkiapps.android.livescore

import androidx.compose.runtime.mutableStateOf
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.huawei.wearengine.auth.AuthClient
import com.huawei.wearengine.auth.Permission
import com.huawei.wearengine.device.Device
import com.huawei.wearengine.device.DeviceClient
import com.huawei.wearengine.p2p.P2pClient
import com.minkiapps.android.livescore.di.PEER_PKG_NAME
import com.minkiapps.android.livescore.extensions.await
import com.minkiapps.android.livescore.extensions.suspendRequestPermissions
import com.minkiapps.android.livescore.log.LogListener
import com.minkiapps.android.livescore.log.LogModel
import com.minkiapps.android.livescore.log.Type
import com.minkiapps.android.livescore.prefs.AppPreferences
import kotlinx.coroutines.launch
import org.koin.core.component.KoinComponent
import org.koin.core.component.inject
import timber.log.Timber

class MainViewModel : ViewModel(), KoinComponent, LogListener {

    private val deviceClient: DeviceClient by inject()

    private val authClient : AuthClient by inject()

    private val p2pClient: P2pClient by inject()

    private val appPreferences : AppPreferences by inject()

    private val hiWearPermissions = arrayOf(Permission.DEVICE_MANAGER)

    val logs = mutableStateOf(listOf<LogModel>())
    val showHuaweiHealthPermissionApp = mutableStateOf(false)
    val showAppInBackgroundCouldGetKilledWarning = mutableStateOf(false)

    private val startWearEngineServiceLiveData = MutableLiveData<Device>()

    fun getStartWearEngineServiceLiveData() : LiveData<Device> = startWearEngineServiceLiveData

    /**
     * check if there is available device
     * check if HiWear permission is granted
     * check if device in background could get killed warning should be shown
     */
    fun checkWearablePreConditions() {
        viewModelScope.launch {
            try {
                val hasAvailableDevices = deviceClient.hasAvailableDevices().await()
                emitDebugLog("Has available devices: $hasAvailableDevices")

                if(!hasAvailableDevices)
                    return@launch

                val grantedPermissions = authClient.checkPermissions(hiWearPermissions).await()
                val allPermissionsGranted = grantedPermissions.all { it == true }
                emitDebugLog("${hiWearPermissions.joinToString { it.name }} permissions are granted: $allPermissionsGranted")

                if (!allPermissionsGranted) {
                    showHuaweiHealthPermissionApp.value = true
                    return@launch
                }

                registerReceiverToDevice()
            } catch (e : Exception) {
                emitExceptionLog("Failed to query available devices", e)
            }
        }
    }

    fun gotoHiWearPermissionPage() {
        viewModelScope.launch {
            try {
                authClient.suspendRequestPermissions(hiWearPermissions)
                registerReceiverToDevice()
            } catch (e : Exception) {
                emitExceptionLog("Failed to request hiWear permissions", e)
            }
        }
    }

    private suspend fun registerReceiverToDevice() {
        val devices = deviceClient.bondedDevices.await()
        if (devices.isNullOrEmpty()) {
            emitDebugLog("getBoundDevices list is null or empty")
            return
        }
        emitDebugLog("get bound devices successful! devices list size = " + devices.size)
        devices.forEach {
            emitDebugLog("${it.name} ${it.model} IsConnected: ${it.isConnected}")
        }

        devices.first { it.isConnected }?.let {
            val isAppInstalled = p2pClient.isAppInstalled(it, PEER_PKG_NAME).await()
            emitDebugLog("LiveScore App is installed: $isAppInstalled")
            startWearEngineServiceLiveData.value = it
        }
    }

    //private fun showAppCouldBeKilledInBackgroundWarning() {
    //    if(appPreferences.showAppCouldBeKilledInBackgroundWarning()) {
    //        showAppInBackgroundCouldGetKilledWarning.value = true
    //    }
    //}
    //
    //private fun setDontShowAppInBackgroundCouldGetKilledWarning() {
    //    appPreferences.setShowAppCouldBeKilledInBackgroundWarning(false)
    //}

    override fun emitDebugLog(log : String) {
        Timber.d(log)
        addLog(LogModel(Type.DEBUG, log))
    }

    override fun emitExceptionLog(log : String, e : Exception) {
        Timber.e(log, e)
        addLog(LogModel(Type.ERROR, "$log Exception message: ${e.message}"))
    }

    private  fun addLog(newLogs : LogModel) {
        logs.value = ArrayList(logs.value).apply { add(newLogs) }
    }

    fun addLogs(newLogs : List<LogModel>) {
        logs.value = ArrayList(logs.value).apply { addAll(newLogs) }
    }

    fun clearLogs() {
        logs.value = listOf()
    }
}