/**
 * precondition for wear engine to work
 *
 * 1. Android appID and applicationID must be registered in AGC and allowed to use wear engine
 * 2. SHA256 fingerprint must be from the keystore which is signed for the Android app
 * 3. SHA256 fingerprint must be registered in AGC
 */

export const PEER_FINGER_PRINT = "CFCC7E8B7AF0C5B2B488190B17B897BB483541B26A7F15065602D716E586FEDA"
export const PEER_PACKAGE_NAME = "com.minkiapps.android.livescore"