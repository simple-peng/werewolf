const Service = require('egg').Service;

let users = []
let uid  = 0
let json = require('../utils/json');
class UserService extends Service{
    constructor(ctx){
        super(ctx);
    }
    /**
     * 添加用户
     * @param name
     * @param client
     * @returns {{id: number, client: *, name: *, room: number}}
     */
    addUser(name, client){
        let obj = {
            id:uid,
            name:name,
            client:client,
            online: true,
            data:{},//游戏数据
            // room:-1,//房间号
        }
        users[uid] = obj
        uid++
        return obj
    }

    /**
     * 获取用户昵称
     * @param id
     * @returns {*}
     */
    getUserName(id){
        return users[id].name;
    }

    /**
     * 返回用户游戏数据的对象引用
     * @param id
     */
    getUserData(id) {
        // console.log('getUserData:',id)
        // console.log('getUserData:',users[id].data)
        return users[id].data;
    }

    /**
     * 向用户id发送json信息
     * @param id
     * @param type
     * @param data
     */
    sendJson(id,type,data){
        let str = json.json_encode(type,data)
        let res = this.send(id,str)
        return res;
    }

    /**
     * 向用户发送数据
     * @param id
     * @param str
     */
    send(id,data){
        if(!users[id].online){
            //用户不在线
            return true
        }
        try{
            users[id].client.emit('room',data);
        }catch(e){
            //发送数据失败,用户已离线
            console.log('发送数据失败,用户已离线')
            this.deleteUser(id)
            return false
        }
        return true
    }
    
    deleteUser(id){
        users[id].online = false
    }
}
module.exports = UserService;