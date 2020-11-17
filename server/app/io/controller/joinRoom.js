'use strict';

const Controller = require('egg').Controller;

let Users = []//所有用户

class JoinRoomController extends Controller {
  async index() {
    const {app, socket,logger, helper} = this.ctx;
    const {user,room} = this.service
    console.log('JoinRoomController:',this.ctx.args[0])
    const message = JSON.parse(this.ctx.args[0])
    console.log('message:',message)
    let {type,data}= message
    switch(type){
      // 加入房间
      case "join_room":
          let userId = data.id
          room.userJoin(userId);
          let userIds = room.getRoomUserId()
          let Users=[];
          for(let k in userIds){
            let name = user.getUserName(userIds[k])
            Users.push({id:userIds[k],name:name,seatId:Number(k)+1})
          }
          console.log('Users:',Users)
          const nsp = app.io.of('/');
          nsp.emit('room',JSON.stringify({type:'room_info',data:{users:Users}}));
          //通知房主开始游戏
          if(room.getRoomSize()>=9){
            room.prepareGame()
          }
          break;
    }
  }
   
}

module.exports = JoinRoomController;