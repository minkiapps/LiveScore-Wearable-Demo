/*
 * Copyright (c) 2021 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * Version: 5.0.2.300
 * Description: wearEngine SDK
 */

import wearengine from "@system.wearengine";

var WearEngineConst = {
  DELAY_FILEAPP_VALUE: "internal://app/", // 三方应用默认文件存储路径
  DEFAULT_EMPTY_VALUE: "", // 默认空字符串
};
var ErrorCode = {
  MSG_ERROR_PING_WATCH_APP_NOT_EXIST: 200, // 手表应用未安装。
  MSG_ERROR_PING_WATCH_APP_NOT_RUNNING: 201, // 手表应用已安装未启动。
  MSG_ERROR_PING_WATCH_APP_EXIST_RUNNING: 202, // 手表应用已安装已启动。
  MSG_ERROR_PING_OTHER: 203, // 其他错误。
  MSG_ERROR_PING_PHONE_APP_NOT_EXIST: 204, //手机应用未安装。
  MSG_ERROR_PING_PHONE_APP_NOT_RUNNING: 205, // 手机应用已安装。
  MSG_ERROR_SEND_FAIL: 206, // 发送消息失败。
  MSG_ERROR_SEND_SUCCESS: 207, // 发送消息成功。
  MSG_ERROR_CODE_VERSION_TOO_LOW: 208 // 手表wearEngine版本太低。
};
var MessageType = {
  MESSAGE_TYPE_DATA: 0, // 文本消息
  MESSAGE_TYPE_FILE: 1 // 文件消息
};

var WEARENGINE_SERVICE_VISION_302 = 302;
var WEARENGINE_SERVICE_VISION_303 = 303;
var WEARENGINE_SDK_VERSION = "3";
var FILE_PUNLIC_PATH_INTERCETPED = 15;
var DEFAULT_EMPTY_FINGERPRINT = " ";

var P2pClient = (function() {
  var peerPkgName;
  var peerFingerPrint;
  var version;

  function P2pClient() {
    try {
      var jsSdk = this;
      var getVersionCallBack = function(data) {
        if (data) {
          var versionArray = data.split(".");
          jsSdk.version = versionArray[versionArray.length - 1];
          console.info("service sdk version is: " + data);
        } else {
          jsSdk.version = 0;
          console.info("get service sdk version failed");
        }
      };
      wearengine.getWearEngineVersion({
        complete: getVersionCallBack,
        sdkVersion: WEARENGINE_SDK_VERSION
      });
    } catch (error) {
      jsSdk.version = 0;
      console.info("service sdk version is too low" + error.message);
    }
  }
  /**
   * 设置手机应用的packageName
   * peerPkgName: string
   */
  P2pClient.prototype.setPeerPkgName = function(peerPkgName) {
    var successCallBack = function() {
      console.info("setPeerPkgName success.");
    };
    var failCallBack = function() {
      console.info("setPeerPkgName fail.");
    };
    this.peerPkgName = peerPkgName;
    if (this.version < WEARENGINE_SERVICE_VISION_303) {
      console.info("ERROR_CODE_VERSION_TOO_LOW setPackageName is invalid");
      return;
    }
    wearengine.setPackageName({
      appName: peerPkgName,
      complete: successCallBack,
      fail: failCallBack
    });
  };
  /**
   * 设置手机侧指纹信息
   * fingerPrint: string
   */
  P2pClient.prototype.setPeerFingerPrint = function(fingerPrint) {
    if (this.version < WEARENGINE_SERVICE_VISION_302) {
      console.info("setPeerFingerPrint interface invalid");
      var obj = {
        data: "ERROR_CODE_VERSION_TOO_LOW",
        code: ErrorCode.MSG_ERROR_CODE_VERSION_TOO_LOW
      };
      return obj;
    }
    if (isEmpty(fingerPrint)) {
      fingerPrint = DEFAULT_EMPTY_FINGERPRINT;
    }
    this.peerFingerPrint = fingerPrint;
    var successCallBack = function() {
      console.info("setPeerFingerPrint success.");
    };
    var failCallBack = function() {
      console.error("setPeerFingerPrint failed.");
    };
    wearengine.setFingerprint({
      appName: this.peerPkgName,
      appCert: fingerPrint,
      complete: successCallBack,
      fail: failCallBack
    });
  };
  /**
   * 检测对端设备侧是否已经安装指定应用
   * pingCallback: object:onSuccess(),onFailure(),onPingResult(resultCode)
   */
  P2pClient.prototype.ping = function(pingCallback) {
    var successCode = {
      data: " ERROR_CODE_P2P_PHONE_APP_EXIST",
      code: ErrorCode.MSG_ERROR_PING_PHONE_APP_NOT_RUNNING
    };
    var successCallBack = function() {
      pingCallback.onSuccess();
      pingCallback.onPingResult(successCode);
      console.info("ping success.");
    };
    var notInstallCode = {
      data: "ERROR_CODE_P2P_PHONE_APP_NOT_EXIST",
      code: ErrorCode.MSG_ERROR_PING_PHONE_APP_NOT_EXIST
    };
    var failCode = {
      data: "ERROR_CODE_P2P_OTHER_ERROR",
      code: ErrorCode.MSG_ERROR_PING_OTHER
    };
    if (isEmpty(this.peerPkgName)) {
      pingCallback.onFailure();
      pingCallback.onPingResult(notInstallCode);
      return;
    }
    var failCallBack = function(data, code) {
      if (!data && !code) {
        pingCallback.onFailure();
        pingCallback.onPingResult(notInstallCode);
      } else {
        pingCallback.onFailure();
        pingCallback.onPingResult(failCode);
      }
      console.error("ping failed.");
    };
    FeatureAbility.detect({
      bundleName: this.peerPkgName,
      success: successCallBack,
      fail: failCallBack
    });
  };
  /**
   * 注册消息监听接口
   * receiver：object:onSuccess(),onFailure(),onReceiveMessage(message)
   */
  P2pClient.prototype.registerReceiver = function(receiver) {
    if (!receiver) {
      return;
    }
    if (this.version > WEARENGINE_SERVICE_VISION_302) {
      if (isEmpty(this.peerPkgName)) {
        console.error("peerPkgName cannot be empty");
        receiver.onFailure();
        return;
      }
      var setPeerPkgNameSuccessCallBack = function() {
        console.info("registerReceiver setPeerPkgName success.");
      };
      var setPeerPkgNameFailCallBack = function() {
        console.info("registerReceiver setPeerPkgName fail.");
        return;
      };
      wearengine.setPackageName({
        appName: this.peerPkgName,
        complete: setPeerPkgNameSuccessCallBack,
        fail: setPeerPkgNameFailCallBack
      });
    }
    if (isEmpty(this.peerFingerPrint)) {
      console.error("peerFingerPrint cannot be empty");
      receiver.onFailure();
      return;
    }
    var successCallBack = function(data) {
      if (data) {
        if (data.isRegister) {
          receiver.onSuccess();
        } else if (data.isFileType){
          var fileObj = {
            isFileType: true,
            name: data.file,
            mode: "",
            mode2: ""
          };
          receiver.onReceiveMessage(fileObj);
          console.info("receive file name:" + fileObj.name);
        } else {
          receiver.onReceiveMessage(data.message);
          console.info("receive message:" + data.message);
        }
      } else {
        receiver.onSuccess();
      }
    };

    FeatureAbility.subscribeMsg({
      success: successCallBack,
      fail: receiver.onFailure
    });
  };
  /**
   * 发送消息接口
   * message: Message
   * sendCallback: object:onSuccess(),onFailure(),onSendResult(resultCode),onSendProgress(count)
   * resultCode: SUCCESS 207, FAILURE 206
   */
  P2pClient.prototype.send = function(message, sendCallback) {
    if (!message || !sendCallback) {
      return;
    }

    var failCode = {
        data: "peerPkgName or peerFingerPrint empty",
        code: ErrorCode.MSG_ERROR_SEND_FAIL
    };
    if (isEmpty(this.peerPkgName) || isEmpty(this.peerFingerPrint)) {
        console.error("peerPkgName or peerFingerPrint cannot be empty");
        sendCallback.onFailure();
        sendCallback.onSendResult(failCode);
        return;
    }

    if (message.getType() == MessageType.MESSAGE_TYPE_DATA) {
      var successCallBack = function() {
        var successCode = {
          data: "ERROR_CODE_COMM_SUCCESS",
          code: ErrorCode.MSG_ERROR_SEND_SUCCESS
        };
        sendCallback.onSuccess();
        sendCallback.onSendResult(successCode);
        sendCallback.onSendProgress(100 + "%");
        console.info("send message success.");
      };

      var failCallBack = function(errorMessage, code) {
        var failCode = {
          data: errorMessage,
          code: ErrorCode.MSG_ERROR_SEND_FAIL
        };
        sendCallback.onFailure();
        sendCallback.onSendResult(failCode);
        sendCallback.onSendProgress(0 + "%");
        console.error("send message failed.");
      };
      FeatureAbility.sendMsg({
        deviceId: "remote",
        bundleName: this.peerPkgName,
        abilityName: "",
        message: message.getData(),
        success: successCallBack,
        fail: failCallBack
      });
    } else {
      if (this.version < WEARENGINE_SERVICE_VISION_302) {
        console.info("not support send file");
        var obj = {
          data: "ERROR_CODE_VERSION_TOO_LOW",
          code: ErrorCode.MSG_ERROR_CODE_VERSION_TOO_LOW
        };
        sendCallback.onFailure();
        sendCallback.onSendResult(obj);
        return;
      }

      var fileName = message.getFile().name;
      // service 版本 303以下不支持 "internal://app/" 路径
      if (this.version < WEARENGINE_SERVICE_VISION_303) {
        var TempPath = fileName.substring(0, FILE_PUNLIC_PATH_INTERCETPED);
        if (TempPath == WearEngineConst.DELAY_FILEAPP_VALUE) {
          var obj = {
            data: "ERROR_CODE_VERSION_TOO_LOW",
            code: ErrorCode.MSG_ERROR_CODE_VERSION_TOO_LOW
          };
          sendCallback.onFailure();
          sendCallback.onSendResult(obj);
          console.info("wearEngine service version too low, file path not support");
          return;
        }
      }
      var successCallBack = function() {
        var successCode = {
          data: "ERROR_CODE_COMM_SUCCESS",
          code: ErrorCode.MSG_ERROR_SEND_SUCCESS
        };
        sendCallback.onSuccess();
        sendCallback.onSendResult(successCode);
      };

      var failCallBack = function(errorMessage, code) {
        var failCode = {
          data: errorMessage,
          code: ErrorCode.MSG_ERROR_SEND_FAIL
        };
        sendCallback.onFailure();
        sendCallback.onSendResult(failCode);
      };
      var progressCallBack = function(data) {
        sendCallback.onSendProgress(data.progressNum + "%");
        console.info("progress of sending file: " + data.progressNum + "%");
      };

      wearengine.uploadFile({
        fileName: fileName,
        filePath: this.peerPkgName,
        peerPackageName: this.peerPkgName,
        success: successCallBack,
        fail: failCallBack,
        progress: progressCallBack
      });
    }
  };
  /**
   * 注销监听接口
   * receiver: onSuccess()
   */
  P2pClient.prototype.unregisterReceiver = function(receiver) {
    FeatureAbility.unsubscribeMsg();
    receiver.onSuccess();
  };
  /**
   * 判断参数是否为空
   * parameter: string
   */
  function isEmpty(parameter) {
    return parameter == "undefined" || parameter == null || parameter == "" || parameter == " ";
  }
  return P2pClient;
})();

/**
 * 文件格式类型
 * name: file name with path
 * mode: 'text' or 'binary'
 * mode2: 'R', 'W', 'RW'
 */
var File = (function() {
  var name;
  var mode;
  var mode2;

  function File() {}

  return File;
})();

var Builder = (function() {
  var messageInfo;

  function Builder() {}

  Builder.prototype.setDescription = function(description) {
      this.messageInfo = description;
      this.messageType = MessageType.MESSAGE_TYPE_DATA;
  };
  /**
   * 设置messge信息（两种格式任选其一）
   * data: ArrayBuffer
   * data: File（暂时不支持）
   */
  Builder.prototype.setPayload = function(data) {
      if (!data) {
          return;
      }
      if (typeof data == "object" && data.name) {
          this.messageType = MessageType.MESSAGE_TYPE_FILE;
          return this.setFilePlayload(data);
      } else {
          this.messageType = MessageType.MESSAGE_TYPE_DATA;
          return this.setBufferPlayload(data);
      }
  };
  Builder.prototype.setBufferPlayload = function(data) {
      this.messageInfo = String.fromCharCode.apply(null, new Uint16Array(data));
  };
  Builder.prototype.setFilePlayload = function(data) {
      this.messageInfo = JSON.stringify(data);
  };
  return Builder;
})();

var Message = (function() {
  var builder = new Builder();

  function Message() {}

  Message.prototype.describeContents = function() {
    return this.builder.messageInfo;
  };
  /**
   * 获取传送时的信息
   */
  Message.prototype.getData = function() {
    return this.builder.messageInfo;
  };
  Message.prototype.getDescription = function() {
    return this.builder.messageInfo;
  };
  /**
   * 获取文件信息
   */
  Message.prototype.getFile = function() {
    if (this.builder.messageType == MessageType.MESSAGE_TYPE_FILE) {
        return JSON.parse(this.builder.messageInfo);
    }
    return null;
  };
  /**
   * 获取传输数据类型
   * 0 string
   * 1 File
   */
  Message.prototype.getType = function() {
      return this.builder.messageType;
  };
  return Message;
})();

export { P2pClient, Message, Builder };
