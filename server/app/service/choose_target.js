const Service = require('egg').Service;

class ChooseTargetService extends Service{
    constructor(ctx){
        super(ctx);
    }
    /**
     * 添加用户
     * @param name
     * @param client
     * @returns {{id: number, client: *, name: *, room: number}}
     */
    chooseTarget(data){
        const {user,room} = this.ctx.service
        let period = room.getRoomPeriod()
        let userData;
          switch(period){
            case "guard":
                room.setGuardTarget(data.target_id)
              break;
            case "wolf":
                room.setWolfTarget(data.id,data.target_id)
                //给所有狼人发送谁被选择了
                let tarArr = room.getWolfTarget();
                let id = [];
                for(let k in tarArr) {
                    id.push(tarArr[k]);
                }
                let senddata = {
                  id: id
                };
                let userIds = room.getRoomUserId();
                for(let k in userIds) {
                    userData = user.getUserData(userIds[k]);
                    if(userData.role == 2 && userData.isDead == false) {
                        user.sendJson(userIds[k], 'user_is_chosen', senddata);
                    }
                }
              break;
            case "witch_rescue":
                let userId = data.id
                userData = user.getUserData(userId);
                if(userData.rescue){
                  room.setWitchRescueChosen(data.is_save)
                }
              break;
            case "witch_poison":
                userData = user.getUserData(data.id);
                if(userData.poison){
                  room.setWitchPoisonChosen(data.target_id)
                }
              break;
            case "prophet":
                room.setProphetTarget(data.target_id)
              break;
            case "vote":
                room.setVoteChosen(data.target_id)
              break;
          }
    }
  
}
module.exports = ChooseTargetService;