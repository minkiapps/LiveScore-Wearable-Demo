import {P2pClient, Builder, Message} from './wearengine.js'
import {PEER_FINGER_PRINT, PEER_PACKAGE_NAME} from './../constants.js'

export var MessageClient = new P2pClient();
MessageClient.setPeerPkgName(PEER_PACKAGE_NAME)
MessageClient.setPeerFingerPrint(PEER_FINGER_PRINT)

export {
    P2pClient,
    Builder,
    Message
};