# Live Score Demo for Huawei Wearables

This demo project shows how to implement a Huawei wearable app to show current live scores of various sport matches. The project consists of an Android 
and HarmonyOS app (Wearable app). 

### Android
The Android app is responsible to make the API call and transfer the result via Huawei Wearengine to wearable app. The project is written in Kotlin and
Jetpack Compose. The main mechanic is to start a Foreground Service which maintains the Wearengine connection between phone and watch, whenever the watch app is requesting data, the Foreground Service fetches the data through API and transfer a JSON to watch.

#### Demo

![ezgif com-gif-maker (3)](https://user-images.githubusercontent.com/52449229/168605967-4c39647f-9159-4681-ae03-f54b323827b8.gif)

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

#### Demo

| GT2Pro        | GT3          | GT3Pro | Fit2 |
| ------------- | -------------| -------| -----|
| ![ezgif com-gif-maker (1)](https://user-images.githubusercontent.com/52449229/168597232-6acfc494-c04e-470d-a1ca-28b4ee0f0d01.gif) | ![gt3](https://user-images.githubusercontent.com/52449229/168593261-954bc01c-3cec-4e20-8ca1-5aa4bb6bc201.gif) | ![gt3pro](https://user-images.githubusercontent.com/52449229/169787432-ffbdf13c-9ba8-4ca7-8257-a827a1b31fa4.gif) | ![yoda_new](https://user-images.githubusercontent.com/52449229/168595501-99a2c9d4-20e7-4abe-bf28-6f4c1cce1c5f.gif) |

| Watch3 |
| ------ |
| ![ezgif com-gif-maker](https://user-images.githubusercontent.com/52449229/169837078-22f32889-47d0-4a89-805c-790285d656ac.gif) |

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

Be aware I created a convenient [script](https://github.com/minkiapps/LiveScore-Wearable-Demo/blob/main/hos/build_push_litewearable_haps) for fast deployment of different litewearable modules at same time.

<br></br>
<br></br>
<br></br>
Icons in the app are taken from [flaticon](https://www.flaticon.com).
