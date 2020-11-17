const Service = require('egg').Service;
let num_last_words = 0
const max_num_last_words = 2//最多遗言数量

const GUARD_TIME = 15;
const WOLF_TIME = 20;
const WITCH_TIME = 15;
const WITCH_RESCUE_TIME = 15;
const WITCH_POISON_TIME = 15;
const PROPHET_TIME = 15;
const PROPHETCHECK_TIME = 5;
const LAST_WORDS_TIME = 20;
const DISCUSS_TIME = 20;
const VOTE_TIME = 20;
/*
 平民      1
 狼人      2
 预言家    3
 女巫      4
 守卫      5
 */
const civilian_role   =   1;
const wolf_role       =   2;
const prophet_role    =   3;
const witch_role      =   4;
const guard_role      =   5;

let rooms = [];
let roomService

function RoomObject(){
    let size = 0;
    let userIds=[];
    let speaking = [];
    let master = -1;
    let period = ''
    console.log('this1:',this)
    this.getSize = function(){return size;}
    this.getUserid = function () {return userIds}
    this.getMaster = function(){return master}
    this.getPeriod = function(){return period}

    //每轮被选中的人
    let target = {
        guardTarget:-1,
        wolfchoose:[],
        wolfTarget:-1,
        rescueChosen:false,
        rescueTarget:-1,
        poisonChosen:-1,
        poisonTarget:-1,
        prophetTarget:-1,
        votechoose:[],
        voteTarget:-1
    }
    this.target = target
    this.speaking = speaking

    let _this = this

     /**
     * 房间添加用户
     * @param userId
     */
    this.addUser = function(userId){
        userIds.push(userId);
        //游戏开始前每个人都可以说话
        _this.speaking.push(userId)
        if(size == 0){
            master = userId
        }
        size++
    }

    this._startGame = function(){
        //游戏开始后禁止说话
        _this.speaking.splice(0);
        console.log('speaking:',_this.speaking)
        this.getDark(true)
    }

    
    /**
     * 根据角色获取房间的用户Id
     * @param role
     *  @returns {Array}
     */
    this.getUseridByRole = function(role){
        const {user} = roomService.ctx.service
        let res = []
        for(let k in userIds){
            let userData = user.getUserData(userIds[k])
            if(userData.role == role && userData.isDead == false){
                res.push(userIds[k])
            }
        }
        return res
    }
        
    this.getDark = function(isDark){
        if(isDark){
            //天黑后进入守卫阶段
            this.startGuard(GUARD_TIME);
        }else{
            //天亮宣布死亡人数
            let deads = this.announceDeads()
            if(this.checkGameOver()) return
            //留遗言
            this.startLastWords(deads)
        }
    }
    /**
     * @param period
     * @param time
     * @param who:Array
     */
    this.sendPeriod = function(period, time, who){
        let data = {
            period:period,
            time:time
        }
        this.sendAll('announce_period_started',data,who)
    }
    /**
     * @param type
     * @param data
     * @param who:Array
     */
    this.sendAll = function(type,data,who){
        const {user} = roomService.ctx.service
        for(let k in userIds){
            if(who !== undefined){
                data.me = false
                if(who.length == 1){
                    if(userIds[k] === who[0]){
                        data.me = true
                    }
                }else{
                    data.ids = undefined;
                    for (let i in who){
                        if(userIds[k] == who[i]){
                            if(data.period == 'wolf') {
                                data.ids = who;
                            }
                            data.me = true
                        }
                    }
                }
            }
            let status = user.sendJson(userIds[k], type, data);
            if(!status){
                //如果发送失败，要做的处理
            }
        }
    }
        
    this.startGuard= function(waitTime){
        period = 'guard'
        let who = this.getUseridByRole(guard_role)
        console.log('guarder:',who,waitTime)
        this.sendPeriod('guard', waitTime, who);
        setTimeout(this.endGuard,waitTime*1000)
    }
        
    this.endGuard = function(){
        _this.startWolf(WOLF_TIME)
    }
        
    this.startWolf = function(waitTime){
        period = 'wolf'
        //如果狼人不杀人，默认杀第一个人
        _this.target.wolfTarget = userIds[0]
        let who = _this.getUseridByRole(wolf_role)
        _this.sendPeriod('wolf', waitTime, who);
        setTimeout(_this.endWolf,waitTime*1000)
    }

    this.endWolf = function(){
        const {user} = roomService.ctx.service;
        //先统计出被狼人杀死的user
        let vote = []
        console.log('target.wolfchoose:',_this.target.wolfchoose)
        for(let k in _this.target.wolfchoose){
            let targetid = _this.target.wolfchoose[k]
            if(vote[targetid] == undefined){
                vote[targetid] = 1  
            }else{
                vote[targetid] ++
            }
        }
        let max = 0;
        for(let k in vote){
            if(vote[k]>max){
            max = vote[k]
            _this.target.wolfTarget = Number(k)
            }
        }
        //向所有狼人发送被杀的人
        let who = _this.getUseridByRole(wolf_role)
        let data = {
            id:_this.target.wolfTarget
        }
        
        for(let k in who){
            let userData = user.getUserData(who[k])
            if(userData.role == 2 && userData.isDead == false){
                user.sendJson(who[k],'user_is_locked',data)
            }
        }
        _this.startWitchRescue(WITCH_TIME)
    }
    this.startWitchRescue = function(waitTime){
        period = 'witch_rescue'
        const {user} = roomService.ctx.service
        let who = _this.getUseridByRole(witch_role)
        console.log('witcher:',who)
        if(who.length){
            let uer = user.getUserData(who[0])
            if(uer.rescue == false){
                who = -1
            }
        }
        _this.sendPeriod('witch_rescue', waitTime, who);

        //给女巫发送要救的人的userid
        who = _this.getUseridByRole(witch_role)
        let data = {
            id:_this.target.wolfTarget
        }

        for(let k in who){
            let userData = user.getUserData(who[k])
            if(userData.role == 4 && userData.isDead == false){
                user.sendJson(who[k],'user_is_locked',data)
            }
        }
        
        setTimeout(_this.endWitchRescue,waitTime*1000)
    }
    this.endWitchRescue = function(){
        const {user} = roomService.ctx.service
        //确认最终女巫救的人
        if(_this.target.rescueChosen === true){
            _this.target.rescueTarget = _this.target.wolfTarget;
            //女巫不得再使用解药 
            for(let k in userIds){
                var userData = user.getUserData(userIds[k]);
                if(userData.role == 4) {
                    userData.rescue = false;
                }
            }
        }else{
            _this.target.rescueTarget = -1;
        }
        //进入女巫毒人阶段
        _this.startWitchPoison(WITCH_POISON_TIME)
    }
    this.startWitchPoison = function(waitTime){
        period = 'witch_poison'
        const {user} = roomService.ctx.service
        let who = _this.getUseridByRole(witch_role)
        console.log('witcher:',who)
        if(who.length){
            let uer = user.getUserData(who[0])
            if(uer.poison == false){
                who = -1
            }
        }
        _this.sendPeriod('witch_poison', waitTime, who);
        setTimeout(_this.endWitchPoison,waitTime*1000)
    }
    this.endWitchPoison = function(){
        //确认女巫最终毒的人
        if(_this.target.poisonChosen !==-1){
            _this.target.poisonTarget = _this.target.poisonChosen;
            //女巫不得再使用毒药 
            const {user} = roomService.ctx.service;
            for(let k in userIds){
                var userData = user.getUserData(userIds[k]);
                if(userData.role == 4) {
                    userData.poison = false;
                }
            }
        }else{
            _this.target.poisonTarget = -1;
        }
        _this.startProphet(PROPHET_TIME)
    }
    this.startProphet = function(waitTime){
        period = 'prophet'
        if(_this.target.prophetTarget == -1){
            _this.target.prophetTarget = userIds[0]; //如果预言家不选择，默认验第一个人
        }
        let who = _this.getUseridByRole(prophet_role)
        _this.sendPeriod('prophet',waitTime,who)
        setTimeout(_this.endProphet,waitTime*1000)
    }
    this.endProphet = function(){
        _this.startProphetCheck(PROPHETCHECK_TIME)
    }
    this.startProphetCheck = function(waitTime){
        period = 'prophet_check'
        let who = _this.getUseridByRole(prophet_role)
        _this.sendPeriod('prophet_check',waitTime,who)
        console.log('propheter:',who)
        //给预言家发送是否为好人
        const {user,room} = roomService.ctx.service;
        let targetData = user.getUserData(_this.target.prophetTarget);
        let isGoodman = true;
        if(targetData.role == 2){
            isGoodman = false
        }
        var data = {
            is_user_goodman: isGoodman
        };
        let userIds = room.getRoomUserId()
        for(let k in userIds){
            var userData = user.getUserData(userIds[k]);
            if(userData.role == 3 && userData.isDead == false) {
                user.sendJson(userIds[k],'is_user_goodman',data)
            }
        }
        setTimeout(_this.endProphetCheck,waitTime*1000)
    }
    this.endProphetCheck = function(){
        _this.getDark(false)
    }
    this.announceDeads = function(){
        //死者 = 狼人+女巫毒药
        let id1 = -1;
        let id2 = -1;
        //狼人杀人 == 守卫救人 ||狼人杀人 == 女巫救人
        if(_this.target.wolfTarget == _this.target.guardTarget || _this.target.wolfTarget == _this.target.rescueTarget){
            id1 = -1
        }else{
            id1 = _this.target.wolfTarget
        }
        if(_this.target.poisonTarget>=0){
            if(id1 == -1){
                id1 = _this.target.poisonTarget
            }else{
                id2 = _this.target.poisonTarget
            } 
        }
        const {user} = roomService.ctx.service;
        if(id1>=0){
            let userData = user.getUserData(id1)
            userData.isDead = true
        }
        if(id2>=0){
            let userData = user.getUserData(id2)
            userData.isDead = true
        }
        let data = {
            id1: id1,
            id2: id2
        };

        _this.sendAll('user_dead',data)
        
        // console.log('target.wolfTarget:',_this.target.wolfTarget)
        // console.log('target.guardTarget:',_this.target.guardTarget)
        // console.log('target.rescueTarget:',_this.target.rescueTarget)
        // console.log('target.poisonTarget:',_this.target.poisonTarget)
        return [id1, id2];
    }

    this.checkGameOver = function(){
        let bad = [], good = [];
        const {user} = roomService.ctx.service
        userIds.forEach((id)=>{
            let u = user.getUserData(id);
            if(!u.isDead){
                if(u.role == 2){
                    bad.push(id)
                }else {
                    good.push(id)  
                }
            }
        })

        let isOver = bad.length == 0 || good.length == 0
        if(isOver) {
            if(bad.length) {
                _this.sendAll('game_over',{'is_game_over':true,'id':bad})
            } else {
                _this.sendAll('game_over',{'is_game_over':true,'id':good})
            }
        }
        return isOver
    }

    this.startLastWords = function(deads){
        period = "last_words"
        //开始遗言
        let ids = [];
        let usersId = []
        deads.forEach((item)=>{
            if(item !== -1){
                usersId.push(item)
            }
        })
        console.log('deads:',deads)
        usersId.forEach(d => {
            if(d.id == -1) return
            if(num_last_words >= max_num_last_words) return 
            num_last_words++
            ids.push(d)
        })
        nextone()

        function announce(id){
            console.log('last_words:',id)
            _this.sendPeriod('last_words',LAST_WORDS_TIME,[id])
            _this.speaking.push(id);
            console.log(id,' can speak now, speaking list: ',_this.speaking)

            setTimeout(()=>{
                _this.speaking.splice(_this.speaking.indexOf(id),1);
                console.log(id,' cannot speak now, speaking list: ',_this.speaking)
                nextone()
            },LAST_WORDS_TIME*1000)
        }

        function nextone(){
            if(!ids.length){
                _this.endLastWords()
                return
            }
            let id = ids[0]
            ids.splice(0, 1);
            announce(id);
        }
    }

    this.endLastWords = function(){
        _this.startDiscuss()
    }

    this.startDiscuss = function(){
        period = "discuss"
        let announce = (id)=>{
            console.log('discuss:',id)
            _this.sendPeriod('discuss',DISCUSS_TIME,[id])
            _this.speaking.push(id);
            console.log(id,' can speak now, speaking list: ',_this.speaking)

            setTimeout(()=>{
                _this.speaking.splice(_this.speaking.indexOf(id), 1);
                console.log(id,' cannot speak now, speaking list: ',_this.speaking)

                nextone()
            },DISCUSS_TIME*1000)
        }

        let nextone = ()=>{
            if(!ids.length){
                _this.endDiscuss()
                return
            }
            let id = ids[0]
            ids.splice(0, 1);
            announce(id);
        }

        //开始讨论
        let ids =[]
        const {user} = roomService.ctx.service
        userIds.forEach(id=>{
            if(!user.getUserData(id).isDead){
            ids.push(id)
            }
        })
        nextone()
    }

    this.endDiscuss = function(){
        _this.startVote();
    }

    this.startVote = function(){
        period = "vote"
        const {user} = roomService.ctx.service
        let who =[]
        userIds.forEach(id => {
            if(!user.getUserData(id).isDead){
                who.push(id)
            }
        })
        _this.sendPeriod('vote',VOTE_TIME,who)

        setTimeout(()=>{_this.endVote()},VOTE_TIME*1000)
    }

    this.endVote = function(){
        //先统计出被投票杀死的user
        let vote = [],targetid;
        console.log('target.votechoose:',_this.target.votechoose)
        for(let k in _this.target.votechoose){
            console.log('target.votechoose[k]:',_this.target.votechoose[k])
            targetid = _this.target.votechoose[k]
            if(vote[targetid] == undefined){
                vote[targetid] = 1  
            }else{
                vote[targetid] ++
            }
        }
        let max = 0;
        for(let k in vote){
            if(vote[k]>max){
            max = vote[k]
            _this.target.voteTarget = k
            }
        }

        var data = {
            id: _this.target.voteTarget
        };
        console.log('voteTarget:',data)
        _this.sendAll('vote_out',data)
        
        if(_this.target.voteTarget!==-1){
            const {user} = roomService.ctx.service
            user.getUserData(_this.target.voteTarget).isDead = true
            if(_this.checkGameOver()) return
        }
        
        _this.getDark(true)
    }
}

class RoomService extends Service{
    constructor(ctx){
        super(ctx);
        roomService = this
    }
     /**
     * 获取房间人数
     * @param roomId
     */
    getRoomSize(roomId = 0){
        return rooms[roomId].getSize(); 
        // return users.length
    }
    /**
     * 向房主发送可以开始游戏标识
     * @param roomId
     */
    prepareGame(roomId = 0){
        const {user} = roomService.ctx.service
        let masterId = rooms[roomId].getMaster()
        let data = {
            is_game_aviliable:true
        }
        var status = user.sendJson(masterId, 'game_aviliable', data);
        if(!status){
            //发送失败处理
            console.log('prepareGame failed')
        }
    }
    /**
     * 初始化房间
     * @param roomId
     */
    initRoom(roomId = 0){
        rooms[roomId] = new RoomObject()
    }
     /**
     * 添加房间用户
     * @param roomId
     * @param userId
     */
    userJoin(userId,roomId = 0){
        if(rooms[roomId] == undefined){
           this.initRoom(roomId) 
        }
        rooms[roomId].addUser(userId)
    }
    
    /**
     * 获取房间的用户id数组
     * @param roomId
     */
    getRoomUserId(roomId = 0){
        return rooms[roomId].getUserid()
    }

    getRoomPeriod(roomId = 0){
        return rooms[roomId].getPeriod();
    }

    startGame (roomId = 0) {
        rooms[roomId]._startGame();
    }

    setGuardTarget(targetId,roomId = 0) {
        rooms[roomId].target.guardTarget = targetId;
    }

    setWolfTarget(userId,targetId,roomId = 0) {
        rooms[roomId].target.wolfchoose.push(targetId);
    }
    
    getWolfTarget(roomId = 0) {
        return rooms[roomId].target.wolfchoose;
    }

    setWitchRescueChosen(isSave,roomId = 0) {
        rooms[roomId].target.rescueChosen = isSave;
    }

    setWitchPoisonChosen(targetId,roomId = 0) {
        console.log('poisonChosen:',targetId)
        rooms[roomId].target.poisonChosen = targetId;
    }

    setProphetTarget(targetId,roomId = 0) {
        rooms[roomId].target.prophetTarget = targetId;
    }

    setVoteChosen(userId,targetId,roomId = 0) {
        const {user} = roomService.ctx.service
        if(user.getUserData(targetId).isDead) return;
        rooms[roomId].target.votechoose.push(targetId);
    }
    

    /*
        分配角色
    */
   getRoles() {
        /*
        平民      1
        狼人      2
        预言家    3
        女巫      4
        守卫      5
        */
        let roles = [1, 1, 1, 2, 2, 2, 3, 4, 5];
            //如果每次调用getRole方法每个用户都随机抽取，可能所有用户都是同一个角色，或其中两个，……
            //所以，每次调用getRole方法返回roles数组，只不过数组内容每次顺序不同
        return this.randomSwap(roles);
    }
    /*
        随机调换roles数组元素100次
    */
    randomSwap(roles){
        let steps = 100;
        let length = roles.length;
        while(steps --){
            let i = Math.floor(Math.random()*length);
            let j = Math.floor(Math.random()*length);
            let temp = roles[i];
            roles[i] = roles[j];
            roles[j] = temp;
        }
        console.log('roles:',roles)
        return roles
    }

    /**
     * 发送消息到房间的所有用户
     * @param id
     * @param message
     * @param roomId
     */
    sendTextMsg(id,message="",roomId = 0){
        console.log('sendTextMsg:',id)
        console.log('sendTextMsg:',rooms[roomId].speaking)
        if(rooms[roomId].speaking.indexOf(id)!==-1){
            // can speak now
            let data = {
                id:id,
                message:message
            }
            rooms[roomId].sendAll('text_message',data,[id])
        }
    }
}
module.exports = RoomService;