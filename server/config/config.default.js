/* eslint valid-jsdoc: "off" */

'use strict';

/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
  /**
   * built-in config
   * @type {Egg.EggAppConfig}
   **/
  const config = exports = {};

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1601879552243_8085';

  // add your middleware config here
  config.middleware = [];

  config.security = {//只要是post信息，eggjs默认有csrf的校验
      csrf:{
        enable:false
      }
  }

  config.io = {
    init: {},
    // init: { wsEngine: 'uws' },
    namespace: {
      '/': {
        connectionMiddleware: ['auth'],
        packetMiddleware: [],
      },
      // '/login': {
      //   connectionMiddleware: ['auth'],
      //   packetMiddleware: [],
      // }
    }
    // redis: {
    //   host: { redis server host },
    //   port: { redis server port },
    //   auth_pass: { redis server password },
    //   db: 0,
    // },
  }

 
  

  // add your user config here
  const userConfig = {
    // myAppName: 'egg',
  };

  return {
    ...config,
    ...userConfig
  };
};
