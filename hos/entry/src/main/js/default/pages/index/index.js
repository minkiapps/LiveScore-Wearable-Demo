import { Message, Builder} from '../../wearengine/wearengine.js';
import { MessageClient } from '../../wearengine/messageclient.js'

export default {

    data: {
        ui_status : 1, //0 loading, 1 error, 2 loaded
        sport_list : [],
        //loading ui
        loadingText : "",
        //error ui
        errorText : ""
    },

    onInit() {
        this.initSportList()
        this.registerReceiver()
        this.ping()
    },

    initSportList() {
        this.sport_list = [
            { type : 1, name : this.$t('strings.football'), logo : '/common/football.png'},
            { type : 2, name : this.$t('strings.tennis'), logo : '/common/tennis.png'},
            { type : 3, name : this.$t('strings.basketball'), logo : '/common/basketball.png'},
            { type : 4, name : this.$t('strings.hockey'), logo : '/common/hockey.png'},
            { type : 5, name : this.$t('strings.volleyball'), logo : '/common/volleyball.png'},
            { type : 6, name : this.$t('strings.handball'), logo : '/common/handball.png'}
        ]
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
            },
        }
        MessageClient.registerReceiver(receiver)
    },

    ping() {
        var flash = this
        flash.ui_status = 0
        flash.loadingText = flash.$t('strings.connecting_to_phone')
        MessageClient.ping({
            onSuccess: function () {
                console.log("ping phone success")
            },
            onFailure: function () {
                console.log("ping phone failed")
            },
            onPingResult: function (resultCode) {
                console.log(`ping result: ${resultCode.data} (${resultCode.code})`)
                if(resultCode.code == 205) {
                    console.log(`Try to send message`)
                    flash.check()
                } else {
                    flash.ui_status = 1
                    if(resultCode.code == 204) {
                        flash.errorText = flash.$t('strings.app_not_installed')
                    } else {
                        flash.errorText = flash.$t('strings.failed_connecting_to_phone')
                    }
                }
            },
        })
    },

    check() {
        var flash = this

        var builderClient = new Builder();
        builderClient.setDescription('{ "command" : "COMM_HEALTH_CHECK" }');
        var sendMessage = new Message();
        sendMessage.builder = builderClient;

        MessageClient.send(sendMessage, {
            onSuccess: function () {
                console.log("Message sent successfully")
            },
            onFailure: function () {
                console.log("Failed to send message")
            },
            onSendResult: function (resultCode) {
                console.log(`send message result: ${resultCode.data} (${resultCode.code})`)
                if(resultCode.code == 206) {
                    flash.ui_status = 1
                    flash.errorText = flash.$t('strings.failed_connecting_to_phone')
                } else {
                    flash.ui_status = 2
                }
            },
            onSendProgress: function (count) {
                console.log(`Send message progress: ${count}`);
            },
        });
    },

    onSwipe:function(event) {
        if (event.direction === 'right') {
            app.terminate();
        }
    }
}
