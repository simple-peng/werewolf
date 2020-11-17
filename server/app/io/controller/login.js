//响应 socket.io 的 event 事件
'use strict';

const Controller = require('egg').Controller;
const json = require('../../utils/json');

class LoginController extends Controller {
  async index() {
    const {socket} = this.ctx;
    const {user} = this.service;
    console.log('LoginController:',this.ctx.args[0])
    const message = JSON.parse(this.ctx.args[0])
    console.log('message:',message)
    let {type,data}= message
    //登录
    switch(type){
      case "login":
        //添加用户
        let res = user.addUser(data.name, socket);
        let obj = {
          id:res.id,
          name:res.name
        }
        let status = socket.emit('login',JSON.stringify({type:"login_succ",data:obj}))
        if(!status){
          //用户发送失败,用户已离线
          console.log('用户发送失败')
        }
    }
  }
}

module.exports = LoginController;