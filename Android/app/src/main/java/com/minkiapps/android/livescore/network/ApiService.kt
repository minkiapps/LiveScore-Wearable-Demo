package com.minkiapps.android.livescore.network

import com.minkiapps.android.livescore.network.model.Wrapper
import retrofit2.http.GET
import retrofit2.http.Path

interface ApiService {

    @GET("/sports/{id}/events/live")
    suspend fun fetchLiveEvents(@Path("id") sportId : Int) : Wrapper
}