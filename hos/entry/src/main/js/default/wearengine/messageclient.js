import {P2pClient, Builder, Message} from './wearengine_minified.js';

/**
 * precondition for wear engine to work
 *
 * 1. Android appID and applicationID must be registered in AGC and allowed to use wear engine
 * 2. SHA256 fingerprint must be from the keystore which is signed for the Android app
 * 3. SHA256 fingerprint must be registered in AGC
 */
const PEER_FINGER_PRINT = "CFCC7E8B7AF0C5B2B488190B17B897BB483541B26A7F15065602D716E586FEDA"
const PEER_PACKAGE_NAME = "com.minkiapps.android.livescore"
export var MessageClient = new P2pClient();
MessageClient.setPeerPkgName(PEER_PACKAGE_NAME)
MessageClient.setPeerFingerPrint(PEER_FINGER_PRINT)

export {
    P2pClient,
    Builder,
    Message
};