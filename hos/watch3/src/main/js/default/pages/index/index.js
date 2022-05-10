import router from '@system.router';
import { MessageClient, Message, Builder } from '../../../../../../../wearengine/messageclient.js'

export default {

    data: {
        ui_status : 1, //-1 initial, 0 loading, 1 error, 2 loaded
        sport_list : [],
        //loading ui
        loadingText : "",
        //error ui
        errorText : ""
    },

    onInit() {
        console.log(`Wearengine version: ${MessageClient.version}`)
        this.initSportList()

        if(this.ui_status == -1) {
            this.ping()
        }
    },

    onDestroy() {
        MessageClient.unregisterReceiver({
            onSuccess: function () {
                console.log("Index page: unregister receiver successful")
            }
        })
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

    ping() {
        var flash = this
        flash.ui_status = 0
        flash.loadingText = flash.$t('strings.connecting_to_phone')
        MessageClient.ping({
            onSuccess: function () {
                console.log("Index page: ping phone success")
            },
            onFailure: function () {
                console.log("Index page: ping phone failed")
            },
            onPingResult: function (resultCode) {
                console.log(`Index page: Ping result: ${resultCode.data} (${resultCode.code})`)
                if(resultCode.code == 205) {
                    console.log(`Index page: Try to send message`)
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
                console.log("Index page: Message sent successfully")
            },
            onFailure: function () {
                console.log("Index page: Failed to send message")
            },
            onSendResult: function (resultCode) {
                console.log(`Index page: Send message result: ${resultCode.data} (${resultCode.code})`)
                if(resultCode.code == 206) {
                    flash.ui_status = 1
                    flash.errorText = flash.$t('strings.failed_connecting_to_phone')
                } else {
                    flash.ui_status = 2
                    flash.$refs.listRef.rotation({ focus : true})
                }
            },
            onSendProgress: function (count) {
                console.log(`Index page: Send message progress: ${count}`);
            },
        });
    },

    gotoLiveEvents(sportType) {
        router.replace({
            uri: 'pages/event/event',
            params: {
                sportType: sportType
            },
        });
    },

    onSwipe:function(event) {
        if (event.direction === 'right') {
            app.terminate();
        }
    }
}
