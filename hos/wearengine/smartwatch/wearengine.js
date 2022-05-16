/*
 * Wear Engine Library For wearable device v5.0.2.306
 *
 * Copyright (c) Huawei Technologies Co., Ltd. 2020-2021. All rights reserved.
 *
 * Date: 2021-04-08
 */
import file from '@system.file';

const injectRef = Object.getPrototypeOf(global) || global;

injectRef.regeneratorRuntime = require('@babel/runtime/regenerator');

var FeatureAbilityOption = {
  BUNDLE_NAME: 'com.huawei.watch.kit.hiwearability',
  ABILITY_NAME: 'com.huawei.watch.kit.hiwearability.HiWearServiceAbility',
  ABILITY_TYPE: 0,
  SYNCOPTION_TYPE: 0
};
var RequestCode = {
  INIT_CODEVALUE: 1000,
  REGISTER_RECEIVER_CODEVALUE: 1001,
  UNREGISTER_RECEIVER_CODEVALUE: 1002,
  PING_CODEVALUE: 1003,
  SENDMESSAGE_CODEVALUE: 1004,
  SENDFILE_CODEVALUE: 1005,
  SUBSCRIBE_ABILITY_CODEVALUE: 1006,
  UNSUBSCRIBE_ABILITY_CODEVALUE: 1007,
  GET_PEER_DEVICE_CODEVALUE: 2001
};
var WearEngineConst = {
  DELAY_TIME_VALUE: 1000,
  DELAY_FILEAPP_VALUE: 'internal://app/',
  DEFAULT_EMPTY_VALUE: '',
  MAX_TRANSFER_SIZE: 1024 * 50,
  MAX_FILE_TRANSFER_SIZE: 1024 * 500,
  FILE_TO_BE_CONTINUED: 1,
  END_FLAG: 1,
  FILE_TRANSMITTING: 1,
  FILE_NOT_EXIST: -1,
  FILE_STATUS: 'status',
  FILE_TRANSFER_FLAG: 'fileTransferFlag',
  FILE_DELAY_TIME_VALUE: 3000
};
var ErrorCode = {
  MSG_ERROR_PING_WATCH_APP_NOT_EXIST: 200,
  MSG_ERROR_PING_WATCH_APP_NOT_RUNNING: 201,
  MSG_ERROR_PING_WATCH_APP_EXIST_RUNNING: 202,
  MSG_ERROR_PING_OTHER: 203,
  MSG_ERROR_PING_PHONE_APP_NOT_EXIST: 204,
  MSG_ERROR_PING_PHONE_APP_NOT_RUNNING: 205,
  MSG_ERROR_SEND_FAIL: 206,
  MSG_ERROR_SEND_SUCCESS: 207,
  MSG_ERROR_CODE_VERSION_TOO_LOW: 208,
  WATCH_VERSION_IS_TOO_LOW: 13
};
var MessageType = {
  MESSAGE_TYPE_DATA: 0,
  MESSAGE_TYPE_FILE: 1
};
var isFunction = obj => {
  return typeof obj === 'function' && typeof obj.nodeType !== 'number';
};
var P2pClient = (function () {
  var peerPkgName;

  var peerFingerPrint;

  var messageCallbackMap = {};

  var messageCallbackMap2 = {};

  var progressCallbackMap = {};

  var transferStatusOfFiles = {};

  var callbackDataIndex = 0;

  var callBackDataListener = null;

  var isTransferring = false;

  function P2pClient() {
    this.subscribeAbilityEvent();
  }

  P2pClient.prototype.subscribeAbilityEvent = async function() {
    var action = this.getRequestHeader(RequestCode.SUBSCRIBE_ABILITY_CODEVALUE);
    var that = this;

    await FeatureAbility.subscribeAbilityEvent(action, function (callbackData) {
      var callbackJson = JSON.parse(callbackData);
      var receivedMessage = JSON.parse(JSON.stringify(callbackJson.data));

      if (receivedMessage.messageType != 'progress') {
        var msgOrFileObj = handleReceivedMessage(receivedMessage, that);

        if (!msgOrFileObj) {
          return;
        }

        if (messageCallbackMap[receivedMessage.peerPackageName]) {
          console.info(
            'receive message or file name: ' + (typeof msgOrFileObj == 'object' ? msgOrFileObj.name : msgOrFileObj)
          );
          var messageCallback = messageCallbackMap[receivedMessage.peerPackageName];
          messageCallback(msgOrFileObj);
        }

        if (messageCallbackMap2[receivedMessage.peerPackageName]) {
          var dataOrFileName = typeof msgOrFileObj == 'object' ? msgOrFileObj.name : msgOrFileObj;
          var messageType =
              typeof msgOrFileObj == 'object' ? MessageType.MESSAGE_TYPE_FILE : MessageType.MESSAGE_TYPE_DATA;

          console.info('receive2 message or file name: ' + dataOrFileName);

          var receivedMessageObj = new Message();
          var receivedMessageObjBuilder = new Builder();
          receivedMessageObjBuilder.setReceivedInfo(messageType, dataOrFileName);
          receivedMessageObj.builder = receivedMessageObjBuilder;

          var messageCallback = messageCallbackMap2[receivedMessage.peerPackageName];
          messageCallback(receivedMessageObj);
        }
      } else {
        console.info('progress of sending file: ' + JSON.stringify(receivedMessage.abilityResult) + '%');

        if (progressCallbackMap[receivedMessage.peerPackageName]) {
          var progressCallback = progressCallbackMap[receivedMessage.peerPackageName];
          progressCallback(JSON.stringify(receivedMessage.abilityResult));
        }
      }
    });
  };

  /**
   * It is used to set an app package name on the peer device.
   *
   * @param peerPkgName App package name on the peer device, which is case sensitive.
   */
  P2pClient.prototype.setPeerPkgName = async function(peerPkgName) {
    this.peerPkgName = peerPkgName;
  };

  /**
   * It is used to set the fingerprint information on the peer device.
   *
   * @param fingerPrint Fingerprint information on the peer device.
   */
  P2pClient.prototype.setPeerFingerPrint = async function(fingerPrint) {
    this.peerFingerPrint = fingerPrint;

    var actionData = {
      dstPackageName: this.peerPkgName,
      dstFingerPrint: fingerPrint
    };

    var action = this.getRequestHeader(RequestCode.INIT_CODEVALUE, actionData);

    FeatureAbility.callAbility(action).then(
      resultStr => {
        var resultObj = JSON.parse(resultStr);
        if (resultObj.abilityResult == 1) {
          console.info('setPeerFingerPrint success.');
        } else {
          console.error('setPeerFingerPrint failed.');
        }
      },
      () => {
        console.error('setPeerFingerPrint failed.');
      }
    );
  };

  /**
   * It is used to check whether the specified app has been installed on the peer device.
   * If the app has not been installed on the peer device, result code 204 is returned.
   * If the app has been installed on the peer device, result code 205 is returned.
   *
   * @param pingCallback Callback of the ping message. onSuccess: Callback function for API call success.
   * onFailure: Callback function for failed API calls. onPingResult: Callback function for API call result.
   */
  P2pClient.prototype.ping = async function(pingCallback) {
    var successCode = {
      data: 'ERROR_CODE_P2P_PHONE_APP_EXIST',
      code: ErrorCode.MSG_ERROR_PING_PHONE_APP_NOT_RUNNING
    };

    var notInstallCode = {
      data: 'ERROR_CODE_P2P_PHONE_APP_NOT_EXIST',
      code: ErrorCode.MSG_ERROR_PING_PHONE_APP_NOT_EXIST
    };

    var failCode = {
      data: 'ERROR_CODE_P2P_OTHER_ERROR',
      code: ErrorCode.MSG_ERROR_PING_OTHER
    };

    var successCallBack = function () {
      isFunction(pingCallback.onSuccess) && pingCallback.onSuccess();
      isFunction(pingCallback.onPingResult) && pingCallback.onPingResult(successCode);
    };

    var failCallBack = function (code) {
      if (code == ErrorCode.MSG_ERROR_PING_PHONE_APP_NOT_EXIST) {
        isFunction(pingCallback.onFailure) && pingCallback.onFailure();
        isFunction(pingCallback.onPingResult) && pingCallback.onPingResult(notInstallCode);
      } else {
        isFunction(pingCallback.onFailure) && pingCallback.onFailure();
        isFunction(pingCallback.onPingResult) && pingCallback.onPingResult(failCode);
      }
    };
    var actionData = {
      dstPackageName: this.peerPkgName,
      dstFingerPrint: this.peerFingerPrint
    };
    var action = this.getRequestHeader(RequestCode.PING_CODEVALUE, actionData);
    var resultStr = await FeatureAbility.callAbility(action);
    var resultObj = JSON.parse(resultStr);

    if (resultObj.abilityResult == ErrorCode.MSG_ERROR_PING_PHONE_APP_NOT_RUNNING) {
      successCallBack();
      console.info('ping success.');
    } else {
      failCallBack(resultObj.abilityResult);
      console.error('ping failed.');
    }
  };

  /**
   * It is used to register and listen for the messages and files sent from the peer device.
   * The received files are stored in the private directory of the app 'internal://app/'.
   *
   * @param receiver Callback of registering for receiving messages.
   * onSuccess: Callback function called when the registration is successful.
   * onFailure: Callback function called when the registration fails.
   * onReceiveMessage: Callback function returned when the registration is successful.
   */
  P2pClient.prototype.registerReceiver = async function(receiver) {
    if (!receiver) {
      return;
    }

    var successCallBack = function () {
      isFunction(receiver.onSuccess) && receiver.onSuccess();
    };

    var failCallBack = function () {
      isFunction(receiver.onFailure) && receiver.onFailure();
    };

    var messageCallBack = function (data) {
      isFunction(receiver.onReceiveMessage) && receiver.onReceiveMessage(data);
    };

    messageCallbackMap[this.peerPkgName] = messageCallBack;

    var action = this.getRequestHeader(RequestCode.REGISTER_RECEIVER_CODEVALUE);

    var resultStr = await FeatureAbility.callAbility(action);
    var resultObj = JSON.parse(resultStr);

    if (resultObj.abilityResult == 1) {
      successCallBack();
      console.info('registerReceiver success.');
    } else {
      failCallBack();
      console.error('registerReceiver failed.');
    }
  };

  /**
   * It is used to register and listen for the messages and files sent from the peer device.
   * The received files are stored in the private directory of the app 'internal://app/'.
   *
   * @param receiver Callback of registering for receiving messages.
   * onSuccess: Callback function called when the registration is successful.
   * onFailure: Callback function called when the registration fails.
   * onReceiveMessage: Callback function returned when the registration is successful.
   */
  P2pClient.prototype.registerReceiver2 = async function(receiver) {
    if (!receiver) {
      return;
    }

    var successCallBack = function () {
      isFunction(receiver.onSuccess) && receiver.onSuccess();
    };

    var failCallBack = function () {
      isFunction(receiver.onFailure) && receiver.onFailure();
    };

    var messageCallBack = function (data) {
      isFunction(receiver.onReceiveMessage) && receiver.onReceiveMessage(data);
    };

    messageCallbackMap2[this.peerPkgName] = messageCallBack;

    var action = this.getRequestHeader(RequestCode.REGISTER_RECEIVER_CODEVALUE);

    var resultStr = await FeatureAbility.callAbility(action);
    var resultObj = JSON.parse(resultStr);

    if (resultObj.abilityResult == 1) {
      successCallBack();
      console.info('registerReceiver2 success.');
    } else {
      failCallBack();
      console.error('registerReceiver2 failed.');
    }
  };

  function handleReceivedMessage(message, that) {
    if (!message) {
      return;
    }

    if (message.messageType == 'text') {
      return message.abilityResult;
    }

    if (message.messageType == 'file') {
      var fileName = message.fileName;
      var isExist = Object.keys(transferStatusOfFiles).indexOf(fileName) != WearEngineConst.FILE_NOT_EXIST;

      if (!isExist) {
        transferStatusOfFiles[fileName] = {};
        transferStatusOfFiles[fileName][WearEngineConst.FILE_STATUS] = WearEngineConst.FILE_TRANSMITTING;
        transferStatusOfFiles[fileName][WearEngineConst.FILE_TRANSFER_FLAG] = message.dataPacketFlag;
        callbackDataIndex = 0;
        callBackDataListener = setDataListener(that, fileName);
        deleteExitFile(fileName);

      } else {
        globalThis.clearInterval(callBackDataListener);
        callBackDataListener = setDataListener(that, fileName);
        var theFileIsTransmitting =
          transferStatusOfFiles[fileName][WearEngineConst.FILE_TRANSFER_FLAG] == message.dataPacketFlag;

        if (!theFileIsTransmitting) {
          return;
        }
      }

      if (transferStatusOfFiles[fileName][WearEngineConst.FILE_STATUS] == WearEngineConst.FILE_TRANSMITTING) {
        callbackDataIndex += message.abilityResult.length;
        writeFile(fileName, message.abilityResult, callbackDataIndex);
      }

      if (message.end != WearEngineConst.END_FLAG) {
        return;
      } else {
        console.info('End of transmission.');
        globalThis.clearInterval(callBackDataListener);
        delete transferStatusOfFiles[fileName];
        callbackDataIndex = 0;
      }
      var fileObj = {
        isFileType: true,
        name: WearEngineConst.DELAY_FILEAPP_VALUE + fileName,
        mode: '',
        mode2: ''
      };
      return fileObj;
    }
  }

  /**
  * If the file is not in the sending queue, check whether there is a file with the same name locally.
  * If a file with the same name exists on the local PC, delete the file with the same name.
  *
  * @param fileName file name.
  */
  function deleteExitFile(fileName) {
    file.delete({
      uri: WearEngineConst.DELAY_FILEAPP_VALUE + fileName,
      success: function () {
        console.info('File deleted successfully.');
      },
      fail: function (data, code) {
        console.info('Failed to delete the file.');
      }
    });
  }

  function writeFile(fileName, fileContent, callbackDataIndex) {
    file.writeArrayBuffer({
      uri: WearEngineConst.DELAY_FILEAPP_VALUE + fileName,
      buffer: fileContent,
      append: false,
      position: callbackDataIndex - fileContent.length,
      success: function () {
        console.info('write Text to file success.');
      },
      fail: function (data, code) {
        console.error('write Text to file failed. code: ' + code + ', data: ' + data);
      }
    });
  }

  function setDataListener(that, fileName) {
    return globalThis.setInterval(() => {
      callbackDataIndex = 0;
      delete transferStatusOfFiles[fileName];
      console.info('Transmission Termination.');
      globalThis.clearInterval(callBackDataListener);
    }, WearEngineConst.FILE_DELAY_TIME_VALUE);
  }

  /**
   * It is used to send messages or files to the peer device.
   *
   * @param message Messages sent.
   * @param sendCallback Callback for sending messages. onSuccess: Callback function for API call success.
   * onFailure: Callback function for failed API calls. onSendResult: Callback function called after a message is sent.
   * onSendProgress: Callback function called when the message is being sent.
   */
  P2pClient.prototype.send = async function(message, sendCallback) {
    if (!message || !sendCallback) {
      return;
    }

    var successCallBack = function () {
      var successCode = {
        data: 'ERROR_CODE_COMM_SUCCESS',
        code: ErrorCode.MSG_ERROR_SEND_SUCCESS
      };

      isFunction(sendCallback.onSuccess) && sendCallback.onSuccess();
      isFunction(sendCallback.onSendResult) && sendCallback.onSendResult(successCode);
      isFunction(sendCallback.onSendProgress) && sendCallback.onSendProgress('100%');
    };

    var failCallBack = function () {
      var failCode = {
        data: 'ERROR_CODE_COMM_FAILED',
        code: ErrorCode.MSG_ERROR_SEND_FAIL
      };

      isFunction(sendCallback.onFailure) && sendCallback.onFailure();
      isFunction(sendCallback.onSendResult) && sendCallback.onSendResult(failCode);
      isFunction(sendCallback.onSendProgress) && sendCallback.onSendProgress('0%');
    };

    var progressCallBack = function (data) {
      isFunction(sendCallback.onSendProgress) && sendCallback.onSendProgress(data + '%');
    };

    if (message.getType() == MessageType.MESSAGE_TYPE_DATA) {
      var actionData = {
        messageContent: message.getData()
      };

      var action = this.getRequestHeader(RequestCode.SENDMESSAGE_CODEVALUE, actionData);
      var resultStr = await FeatureAbility.callAbility(action);
      var resultObj = JSON.parse(resultStr);

      if (resultObj.abilityResult == ErrorCode.MSG_ERROR_SEND_SUCCESS) {
        successCallBack();
        console.info('send message success.');
      } else {
        failCallBack();
        console.error('send message failed.');
      }
    } else {
      if (isTransferring) {
        console.error('send file failed,there is already a file being sent.');
        failCallBack();
        return;
      }
      isTransferring = true;

      var that = this;
      if (!message.getFile() || !message.getFile().fileName) {
        callbackResponse(false, 'send file failed.', successCallBack, failCallBack);
        return;
      }

      var fileContent = message.getFile().fileContent;
      var fileUri = fileContent.name;
      var fileName = message.getFile().fileName;

      file.get({
        uri: fileUri,
        success: function (data) {
          console.info('File obtained successfully.');
          readFileBuffer(
            data,
            fileName,
            successCallBack,
            failCallBack,
            progressCallBack,
            that
          );
        },
        fail: function (data, code) {
          callbackResponse(false, 'Failed to obtain the local file.', successCallBack, failCallBack);
        }
      });
    }
  };

  function sendFilePart(index, fileContent, fileName, successCallBack, failCallBack, hasSent, transferSize, that) {
    var actionData = {
      messageContent: fileContent.substring(hasSent, Math.min(hasSent + transferSize, fileContent.length)),
      seqId: hasSent,
      fileName,
      cnt: fileContent.length
    };

    var action = that.getRequestHeader(RequestCode.SENDFILE_CODEVALUE, actionData);
    FeatureAbility.callAbility(action).then(
      resultStr => {
        var resultObj = JSON.parse(resultStr);
        if (resultObj.abilityResult == WearEngineConst.FILE_TO_BE_CONTINUED) {
          var newTransferSize = Math.min(WearEngineConst.MAX_TRANSFER_SIZE, transferSize * 2);
          sendFilePart(
            index + 1,
            fileContent,
            fileName,
            successCallBack,
            failCallBack,
            Math.min(hasSent + transferSize, fileContent.length),
            newTransferSize,
            that
          );
        } else if (resultObj.abilityResult != ErrorCode.MSG_ERROR_SEND_SUCCESS) {
          console.error('error:' + resultStr);
          if (resultObj.code == 2) {
            sendFilePart(
              index,
              fileContent,
              fileName,
              successCallBack,
              failCallBack,
              hasSent,
              Math.floor(transferSize / 2),
              that
            );
          } else {
            callbackResponse(false, 'send file failed.', successCallBack, failCallBack);
          }
        } else if (hasSent == fileContent.length) {
          callbackResponse(true, 'send file success.', successCallBack, failCallBack);
        }
      },
      () => {
        callbackResponse(false, 'send file failed.', successCallBack, failCallBack);
      }
    );
  }

  function callbackResponse(isSuccess, info, successCallBack, failCallBack) {
    isTransferring = false;
    if (isSuccess) {
      console.info(info);
      successCallBack();
      return;
    }
    console.error(info);
    failCallBack();
  }

  /**
   * It is used to read File in blocks.
   *
   * @param fileInfo Obtain information from file.
   * @param fileName It is the name of the file.
   * @param successCallBack Callback function called when the readFileBuffer success. Facilitate subsequent invocation.
   * @param failCallBack Callback function called when the readFileBuffer fails. Facilitate subsequent invocation.
   * @param progressCallBack Callback for progress bar. Facilitate subsequent invocation.
   * @param that this form context.
   */
  async function readFileBuffer (fileInfo, fileName, successCallBack, failCallBack, progressCallBack, that) {
    var fileSize = fileInfo.length;
    var fileUri = fileInfo.uri;
    var readIndex = 0;
    var newTransferSize;
    var fileContentStorage = '';
    while (readIndex < fileSize) {
      newTransferSize = Math.min(WearEngineConst.MAX_FILE_TRANSFER_SIZE, fileSize - readIndex);
      console.info('The readIndex is ' + readIndex + '. The newTransferSize is ' + newTransferSize);
      await file.readArrayBuffer({
        uri: fileUri,
        position: readIndex,
        length: newTransferSize,
        success: function (data) {
          console.info('This section is read successfully.');
          fileContentStorage += data.buffer;
          if (fileContentStorage.length == fileSize) {
            try {
              sendFilePart(
                0,
                fileContentStorage,
                fileName,
                successCallBack,
                failCallBack,
                0,
                WearEngineConst.MAX_TRANSFER_SIZE,
                that
              );
              progressCallbackMap[that.peerPkgName] = progressCallBack;
            } catch (err) {
              console.info('SendFilePart Failed. Error is ' + err);
            }
          }
        },
        fail: function (data, code) {
          callbackResponse(false, 'Failed to read the file.', successCallBack, failCallBack);
        }
      });
      readIndex += newTransferSize;
    }
  }

  /**
   * It is used to deregister the function of receiving messages or files from the peer device.
   * You are advised to use this call during or before the onDestroy life cycle of an app to release server resources.
   *
   * @param receiver Callback for stopping receiving messages.
   * onSuccess: Callback function called when a message is successfully received.
   */
  P2pClient.prototype.unregisterReceiver = async function(receiver) {
    var action = this.getRequestHeader(RequestCode.UNREGISTER_RECEIVER_CODEVALUE);
    var resultStr = await FeatureAbility.callAbility(action);
    var resultObj = JSON.parse(resultStr);

    if (resultObj.abilityResult == 1) {
      isFunction(receiver.onSuccess) && receiver.onSuccess();
      console.info('unregisterReceiver success.');
    } else {
      isFunction(receiver.onFailure) && receiver.onFailure();
      console.error('unregisterReceiver failed.');
    }
  };

  P2pClient.prototype.getRequestHeader = function (code, actionData) {
    var destInfo = {
      dstPackageName: this.peerPkgName,
      dstFingerPrint: this.peerFingerPrint
    };

    return {
      bundleName: FeatureAbilityOption.BUNDLE_NAME,
      abilityName: FeatureAbilityOption.ABILITY_NAME,
      abilityType: FeatureAbilityOption.ABILITY_TYPE,
      syncOption: FeatureAbilityOption.SYNCOPTION_TYPE,
      messageCode: code,
      data: Object.assign({}, destInfo, actionData)
    };
  };
  return P2pClient;
})();
var Builder = (function () {
  var messageInfo;

  function Builder() {
  }

  Builder.prototype.setDescription = function (description) {
    this.messageInfo = description;
    this.messageType = MessageType.MESSAGE_TYPE_DATA;
  };

  Builder.prototype.setPayload = function (data) {
    if (!data) {
      return;
    }
    if (typeof data == 'object' && data.name) {
      this.messageType = MessageType.MESSAGE_TYPE_FILE;
      return this.setFilePlayload(data);
    } else {
      this.messageType = MessageType.MESSAGE_TYPE_DATA;
      return this.setBufferPlayload(data);
    }
  };

  Builder.prototype.setBufferPlayload = function (data) {
    this.messageInfo = String.fromCharCode.apply(null, new Uint16Array(data));
  };

  Builder.prototype.setFilePlayload = function (data) {
    var that = this;
    if (isEmpty(data)) {
      return;
    }

    var fileInfoArray = data.name.split('/');
    var fileName = fileInfoArray[fileInfoArray.length - 1];
    if (isEmpty(fileName)) {
      return;
    }

    var fileInfo = {
      fileContent: data,
      fileName: fileName
    };
    that.messageInfo = fileInfo;
  };

  Builder.prototype.setReceivedInfo = function (type, data) {
    this.messageType = type;
    this.messageInfo = data;
  };

  function isEmpty(obj) {
    return typeof obj == 'undefined' || obj == null || obj == '' || obj == ' ';
  }

  return Builder;
})();
var File = (function () {
  var name;
  var mode;
  var mode2;

  function File() {
  }

  return File;
})();
var Message = (function () {
  var builder = new Builder();

  function Message() {
  }

  Message.prototype.describeContents = function () {
    return this.builder.messageInfo;
  };

  Message.prototype.getData = function () {
    return this.builder.messageInfo;
  };
  Message.prototype.getDescription = function () {
    return this.builder.messageInfo;
  };

  Message.prototype.getFile = function () {
    if (this.builder.messageType == MessageType.MESSAGE_TYPE_FILE) {
      return this.builder.messageInfo;
    }
    return null;
  };

  Message.prototype.getType = function () {
    return this.builder.messageType;
  };
  return Message;
})();

var PeerDeviceClient = (function () {
  function PeerDeviceClient() {
  }

  // Obtain the peer device object.
  PeerDeviceClient.prototype.getPeerDevice = async function (receiver) {
    var successCallBack = function (data) {
      isFunction(receiver.onSuccess) && receiver.onSuccess(data);
      console.info('getPeerDevice success.');
    };
    var failCallBack = function (data) {
      isFunction(receiver.onFailure) && receiver.onFailure(data);
      console.info('getPeerDevice fail.');
    };
    var action = {
      bundleName: FeatureAbilityOption.BUNDLE_NAME,
      abilityName: FeatureAbilityOption.ABILITY_NAME,
      abilityType: FeatureAbilityOption.ABILITY_TYPE,
      syncOption: FeatureAbilityOption.SYNCOPTION_TYPE,
      messageCode: RequestCode.GET_PEER_DEVICE_CODEVALUE,
      data: {}
    };
    var resultStr = await FeatureAbility.callAbility(action);
    var resultObj = JSON.parse(resultStr);

    if(!Object.prototype.hasOwnProperty.call(resultObj,'errorCode')){
      failCallBack(ErrorCode.WATCH_VERSION_IS_TOO_LOW);
      console.error('The watch version is too low.');
      return;
    }

    if (resultObj.errorCode == 0) {
      successCallBack(resultObj);
      console.info('getPeerDevice success.');
    } else {
      failCallBack(resultObj.errorCode);
      console.error('getPeerDevice failed.');
    }
  };
  return PeerDeviceClient;
})();
export {P2pClient, PeerDeviceClient, Message, Builder};
