# Live Score Demo for Huawei Wearables

This demo project shows how to implement a Huawei wearable app to show current live scores of various sport matches. The project consists of an Android 
and HarmonyOS app (Wearable app). 

### Android
The Android app is responsible to make the API call and transfer the result via Huawei Wearengine to wearable app. The project is written in Kotlin and
Jetpack Compose. The main mechanic is to start a Foreground Service which maintains the Wearengine connection between phone and watch, whenever the watch app 
is requesting data, the Foreground Service fetches the data through API and transfer a JSON to watch.

### HarmonyOS (hos)
The HarmonyOS app is responsible of displaying the live score data which is received from the Android app in a list UI element. 
Various wearable device models are supported in the project, each device model code is encapsulated in a own Gradle module. All code are 
written in Javascript, HML and CSS. 

- Huawei Sportwatch (Litewearable)
  - Watch GT2 Pro
  - Watch GT3 and GT3 Pro
  - Watch Fit2 (Codename Yoda)
- Huawei Smartwatch (Smartwearable)
  - Watch3

## Installation and Setup

### Android
Get the latest [Android Studio](https://developer.android.com/studio) version to build the Android project.
RapidAPI (Basic is free) is used for live score data, register [here](https://rapidapi.com/tipsters/api/sportscore1/) to obtain an API key and configure it in 
`local.properties` with `API_KEY=xxxxxx`.

### HarmonyOS
Get the latest [DevEco Studio](https://developer.harmonyos.com/en/develop/deveco-studio) version to build the HarmonyOS project.
Apply for wearengine in Huawei Developer Console, configure signing and bundle name of HarmonyOS project. 
Refer to [official documentation](https://developer.huawei.com/consumer/en/doc/development/connectivity-Guides/service-introduction-0000000000018585)
for details how to do it. 

Icons in the app are taken from [Flaticons](https://www.flaticon.com/).
