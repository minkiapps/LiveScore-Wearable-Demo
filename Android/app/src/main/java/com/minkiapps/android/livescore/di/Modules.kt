package com.minkiapps.android.livescore.di

import com.google.gson.Gson
import com.huawei.wearengine.HiWear
import com.huawei.wearengine.auth.AuthClient
import com.huawei.wearengine.device.DeviceClient
import com.huawei.wearengine.p2p.P2pClient
import com.minkiapps.android.livescore.BuildConfig
import com.minkiapps.android.livescore.network.ApiService
import com.minkiapps.android.livescore.prefs.AppPreferences
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.logging.HttpLoggingInterceptor
import org.koin.android.ext.koin.androidContext
import org.koin.dsl.module
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory


const val PEER_PKG_NAME = "com.minkiapps.hos.livescore"
const val PEER_FINGERPRINT =
    "com.minkiapps.hos.livescore_BJsgJpKOKw0GyMGjCBnvkkwn+4qjKoRviLXEomoGhOrgSntXvroKmujhq0Z9jDBimZupk83c9K3nlo+q5RsgL/A="

const val LIVE_EVENT_BASE_URL = "https://sportscore1.p.rapidapi.com/"

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

    single<ApiService> {

        val loggingInterceptor = HttpLoggingInterceptor()
        loggingInterceptor.setLevel(HttpLoggingInterceptor.Level.BODY)

        val httpClient = OkHttpClient.Builder().addInterceptor { chain ->
            val original: Request = chain.request()

            val newRequest = original.newBuilder()
                .header("X-RapidAPI-Host", "sportscore1.p.rapidapi.com")
                .header("X-RapidAPI-Key", BuildConfig.API_KEY)
                .build()

            chain.proceed(newRequest)
        }.addInterceptor(loggingInterceptor)
            .build()

        val retrofit = Retrofit.Builder()
            .client(httpClient)
            .baseUrl(LIVE_EVENT_BASE_URL)
            .addConverterFactory(GsonConverterFactory.create())
            .build()

        retrofit.create(ApiService::class.java)
    }

    single {
        Gson()
    }

    single {
        AppPreferences(androidContext())
    }
}
