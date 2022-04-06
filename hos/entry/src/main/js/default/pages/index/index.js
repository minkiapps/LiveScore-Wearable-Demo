import { P2pClient , Builder, Message} from '../../wearengine/wearengine.js';

/**
 * precondition for wear engine to work
 *
 * 1. Android appID and applicationID must be registered in AGC and allowed to use wear engine
 * 2. SHA256 fingerprint must be from the keystore which is signed for the Android app
 * 3. SHA256 fingerprint must be registered in AGC
 */

const PEER_FINGER_PRINT = "CFCC7E8B7AF0C5B2B488190B17B897BB483541B26A7F15065602D716E586FEDA"
const PEER_PACKAGE_NAME = "com.minkiapps.android.livescore"

var messageClient = new P2pClient();

export default {

    data: {
        stdout: 'IDLE',
        receivedMsg: 'Received message here'
    },

    onInit() {
        messageClient.setPeerPkgName(PEER_PACKAGE_NAME)
        messageClient.setPeerFingerPrint(PEER_FINGER_PRINT)

        this.registerReceiver()
        this.ping()
    },

    registerReceiver() {
        var flash = this
        var receiver = {
            onSuccess: function() {
                console.log('p2pClient : Registration success');
            },
            onFailure :function() {
                console.log('p2pClient : Registration failed');
            },
            onReceiveMessage :function(message) {
                console.log(message)
                flash.receivedMsg = message
            },
        }
        messageClient.registerReceiver(receiver)
    },

    ping() {
        var flash = this
        flash.stdout = 'pinging phone'
        messageClient.ping({
            onSuccess: function () {
                console.info("ping phone success")
                flash.stdout = 'ping phone success'
            },
            onFailure: function () {
                console.info("ping phone failed")
                flash.stdout = 'ping phone failed'
            },
            onPingResult: function (resultCode) {
                console.info(`ping result: ${resultCode.data} (${resultCode.code})`)
                flash.stdout = `ping result: ${resultCode.data} (${resultCode.code})`
                if(resultCode.code == 205) {
                    console.info(`Try to send message`)
                    flash.askForScores()
                }
            },
        })
    },

    askForScores() {
        var flash = this

        var builderClient = new Builder();
        builderClient.setDescription('Hello from GT3');
        var sendMessage = new Message();
        sendMessage.builder = builderClient;

        messageClient.send(sendMessage, {
            onSuccess: function () {
                console.log("Message sent successfully")
            },
            onFailure: function () {
                console.log("Failed to send message")
            },
            onSendResult: function (resultCode) {
                console.log(`send message result: ${resultCode.data} (${resultCode.code})`)
                flash.receivedMsg = `send message result: ${resultCode.data} (${resultCode.code})`
            },
            onSendProgress: function (count) {
                console.log(`Send message progress: ${count}`);
            },
        });
    }
}
