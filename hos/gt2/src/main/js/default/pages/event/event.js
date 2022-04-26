import file from '@system.file';
import {MessageClient, Builder, Message} from '../../../../../../../wearengine/messageclient.js';
import router from '@system.router';

export default {
    data: {
        ui_status: 2, //0 loading, 1 error, 2 loaded
        sportType: 1,
        errorText: '',
        sportName: '',
        sportLogo: '',
        events: [],
        /**events: [
            {
                "away_score": {
                    "display": 1
                },
                "home_score": {
                    "display": 1
                },
                "name": "Kim C. – Shimizu Y.",
                "start_at": "05:55",
                "status_more": "3rd set"
            },
            {
                "away_score": {
                    "display": 0
                },
                "home_score": {
                    "display": 1
                },
                "name": "Ma Y. – Jundakate C.",
                "start_at": "07:10",
                "status_more": "2nd set"
            },
            {
                "away_score": {
                    "display": 0
                },
                "home_score": {
                    "display": 0
                },
                "name": "Momkoonthod T. – Jattavapornvanit P.",
                "start_at": "07:40",
                "status_more": "1st set"
            },
            {
                "away_score": {
                    "display": 0
                },
                "home_score": {
                    "display": 0
                },
                "name": "Navasirisomboon J / Saeoui S – Kunsuwan N / Timangkul A",
                "start_at": "07:00",
                "status_more": "1st set"
            },
            {
                "away_score": {
                    "display": 1
                },
                "home_score": {
                    "display": 1
                },
                "name": "Minin M. – Korolev V.",
                "start_at": "05:20",
                "status_more": "3rd set"
            },
            {
                "away_score": {
                    "display": 1
                },
                "home_score": {
                    "display": 1
                },
                "name": "Philippov E. – Gola A.",
                "start_at": "06:00",
                "status_more": "3rd set"
            }
        ]**/
    },

    onInit() {
        this.initHeader()
        this.registerReceiver()
        this.fetchLiveEvents()
    },

    initHeader() {
        switch (this.sportType) {
            case 1:
                this.sportName = this.$t('strings.football')
                this.sportLogo = '/common/football.png'
                break;
            case 2:
                this.sportName = this.$t('strings.tennis')
                this.sportLogo = '/common/tennis.png'
                break;
            case 3:
                this.sportName = this.$t('strings.basketball')
                this.sportLogo = '/common/basketball.png'
                break;
            case 4:
                this.sportName = this.$t('strings.hockey')
                this.sportLogo = '/common/hockey.png'
                break;
            case 5:
                this.sportName = this.$t('strings.volleyball')
                this.sportLogo = '/common/volleyball.png'
                break;
            case 6:
                this.sportName = this.$t('strings.handball')
                this.sportLogo = '/common/handball.png'
                break;
        }
    },

    onDestroy() {
        MessageClient.unregisterReceiver({
            onSuccess: function () {
                console.log("Event page unregister receiver successful")
            }
        })
    },

    fetchLiveEvents() {
        var flash = this
        flash.ui_status = 0

        var builderClient = new Builder();
        builderClient.setDescription(`{ "command" : "COMM_GET_LIVE_EVENTS", "model" : "gt2pro", "intParam1" : ${this.sportType} }`);
        var sendMessage = new Message();
        sendMessage.builder = builderClient;

        MessageClient.send(sendMessage, {
            onSuccess: function () {
                console.log("Event page: Message sent successfully")
            },
            onFailure: function () {
                console.log("Event page: Failed to send message")
            },
            onSendResult: function (resultCode) {
                console.log(`Event page: Send message result: ${resultCode.data} (${resultCode.code})`)
                if (resultCode.code == 206) {
                    flash.ui_status = 1
                    flash.errorText = flash.$t('strings.failed_connecting_to_phone')
                }
            },
            onSendProgress: function (count) {
                console.log(`Event page: Send message progress: ${count}`);
            },
        });
    },

    registerReceiver() {
        var flash = this
        var receiver = {
            onSuccess: function () {
                console.log('Event page: Receiver registration success');
            },
            onFailure: function () {
                console.log('Event page: Receiver registration failed');
            },
            onReceiveMessage: function (message) {
                console.log(`Event page: received message: ${message.name}`)

                if (message && message.isFileType) {
                    //need some time delay for GT2 Pro to work
                    setTimeout(() => {
                        flash.parseJSON(message)
                    }, 1000)
                }
            },
        }
        MessageClient.registerReceiver(receiver)
    },

    parseJSON(message) {
        console.log('Event page: Try to parse message');
        var flash = this
        file.readText({ //length max 4096 bytes
            uri: message.name,
            success: function (data) {
                console.log('Event page: Received JSON string length: ' + data.text.length)
                try {
                    var events = JSON.parse(data.text).data
                    flash.events = events

                    if(flash.events.length != 0) {
                        flash.ui_status = 2
                    } else {
                        flash.ui_status = 1
                        flash.errorText = flash.$t('strings.no_live_events')
                    }
                } catch (error) {
                    console.error(error);
                    flash.ui_status = 1
                    flash.errorText = flash.$t('strings.loading_data_failed')
                }
            },
            fail: function (data, code) {
                console.log('Event page: file.get failure, code: ' + code + ', data: ' + data);
                flash.ui_status = 1
                flash.errorText = flash.$t('strings.loading_data_failed')
            },
            complete: function () {
                console.log('Event page: read Text complete');
            },
        });
    },

    formatDisplayString: function(homeScore, awayScore) {
        return `${homeScore} - ${awayScore}`
    },

    onSwipe: function (event) {
        if (event.direction === 'right') {
            router.replace({
                uri: 'pages/index/index',
                params: {
                    ui_status: 2
                },
            });
        }
    },
}
