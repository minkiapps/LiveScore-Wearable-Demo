package com.minkiapps.android.livescore.di

import com.google.gson.Gson
import com.huawei.wearengine.HiWear
import com.huawei.wearengine.auth.AuthClient
import com.huawei.wearengine.device.DeviceClient
import com.huawei.wearengine.p2p.P2pClient
import com.minkiapps.android.livescore.prefs.AppPreferences
import org.koin.android.ext.koin.androidContext
import org.koin.dsl.module

const val PEER_PKG_NAME = "com.minkiapps.hos.livescore"
const val PEER_FINGERPRINT = "com.minkiapps.hos.livescore_BJsgJpKOKw0GyMGjCBnvkkwn+4qjKoRviLXEomoGhOrgSntXvroKmujhq0Z9jDBimZupk83c9K3nlo+q5RsgL/A="

val appModule = module {

    single<DeviceClient> {
        HiWear.getDeviceClient(androidContext())
    }

    single<AuthClient> {
        HiWear.getAuthClient(androidContext())
    }

    single<P2pClient> {
        HiWear.getP2pClient(androidContext()).apply {
            setPeerPkgName(PEER_PKG_NAME)
            setPeerFingerPrint(PEER_FINGERPRINT)
        }
    }

    single {
        Gson()
    }

    single {
        AppPreferences(androidContext())
    }
}
