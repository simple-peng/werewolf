//响应 socket.io 的 event 事件
'use strict';

const Controller = require('egg').Controller;


class RoomController extends Controller {
  async index() {
    const {user,room,chooseTarget} = this.ctx.service;
    console.log('RoomController:',this.ctx.args[0])
    const message = JSON.parse(this.ctx.args[0])
    console.log('message:',message)
    let {type,data}= message
    switch(type){   
      case "start_game":
          let gameStart = data.game_started;
          if(gameStart){
            if(room.getRoomSize() != 9){
              return false
            }
            //发身份牌
            let roles = room.getRoles()
            let userIds = room.getRoomUserId()
            let index = 0
            for(let k in userIds){
              let data = {
                id_card_type:roles[index]
              }
              let status = user.sendJson(userIds[k], 'send_id_card', data);
              let userData = user.getUserData(userIds[k])
              userData.role = roles[index]
              userData.isDead = false
              switch (roles[index]) {
                case 4:
                    //女巫毒药解药信息
                    userData.rescue = true;
                    userData.poison = true;
                    break;
              }
              index++
            }
            room.startGame();
          }
          break;
      case "choose_target":
          console.log(data)
          chooseTarget.chooseTarget(data)
          break;
      case "text_message":
          console.log('text_message:',data)
          room.sendTextMsg(data.id,data.message)
          break;
    }
  }
   
}

module.exports = RoomController;