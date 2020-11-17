
import styles from './room.less';
import React,{Component} from "react";
import { message, Button,Modal } from 'antd';
import 'antd/dist/antd.css'; 

let users = wolfman.userInfoModel.seat
let user = wolfman.userInfoModel
let timer;

export default class Room extends Component {
    constructor(props){
        super(props)
        this.state = {
            game:{
                ready:false,
                time:0,
                showGuard:false,
                showWolf:false,
                showWitchRescue:false,
                showWitchPoison:false,
                showProphet:false,
                showChat:false,
                showVote:false,
                showWait:false,
                periodInfo:'',
                seatLock:-1,
                showGoodman:false,
                showBadman:false,
                isGameOver:false
            }
        }
    }

    componentDidMount(){
        this.getSocketResp()
    }

    startPeriod({period,time,me,ids}){
        if(timer !== undefined){
            clearInterval(timer);
        }
        this.state.game.period = period
        this.state.game.time = time
        console.log('me:',me)
        console.log('ids:',ids)
        this.close()
        if(me){
            switch(period){
                case "guard":
                    this.state.game.showGuard = true;
                    break;
                case "wolf":
                    this.state.game.showWolf = true
                    break;
                case "witch_rescue":
                    this.state.game.showWitchRescue = true
                    break;
                case "witch_poison":
                    this.state.game.showWitchPoison = true
                    break;
                case "prophet":
                    this.state.game.showProphet = true
                    break;
                case "prophet_check":
                    this.state.game.showProphet = true
                    break;
                case "last_words":
                    this.state.game.periodInfo = '遗言'
                    this.state.game.showChat = true
                    break;
                case "discuss":
                    this.state.game.periodInfo = '讨论'
                    this.state.game.showChat = true
                    break;
                case "vote":
                    this.state.game.showVote = true
                    break;
            }
        }else{
            this.state.game.showWait = true
            console.log('not me:',this.state.game.showChat)
            switch(period){
                case "guard":
                    this.state.game.periodInfo = "守卫";
                    break;
                case "wolf":
                    this.state.game.periodInfo = "狼人";
                    break;
                case "witch_rescue":
                    this.state.game.periodInfo = "女巫救人";
                    break;
                case "witch_poison":
                    this.state.game.periodInfo = "女巫毒人";
                    break;
                case "prophet":
                    this.state.game.periodInfo = "预言家验人";
                    break;
                case "prophet_check":
                    this.state.game.periodInfo = "预言家确认";
                    break;
                case "last_words":
                    this.state.game.periodInfo = "遗言";
                    this.state.game.showChat = false
                    break;
                case "discuss":
                    this.state.game.periodInfo = "讨论";
                    this.state.game.showChat = false
                    break;
                case "vote":
                    this.state.game.periodInfo = "投票";
                    break;
            }
        }
        timer = setInterval(this.subTime,1000)
    }

    subTime = ()=>{
        if(this.state.game.time>0){
            this.state.game.time --
            this.setState({
                game:this.state.game
            },()=>{
                console.log(this.state.game.periodInfo,this.state.game.showWolf,this.state.game.showWitchRescue)
            })
        }
    }

    userInfo = ()=> {
        return {
            id: -1,
            name: '',
            isDead: false,
            isChat: false,
            message: '',
            isChoose: false
        }
    }

    getSeatId = (userId)=>{
        for(let seatId in users){
            if(users[seatId].id == userId){
                return seatId
            }
        }
    }


    getSocketResp = ()=>{
        socket.on('room', msg => {
            console.log(socket.id,msg)
            msg = JSON.parse(msg)
            const {type,data} = msg
            console.log(type,data)
            // console.log('isChat:',type,isChat)
            if(!type || !data) return
            let userId,seatId;
            switch(type){
                case "room_info":
                    data.users.forEach(user => {
                        //user:{id:number,name:string,seatId:number}
                        seatId = user.seatId;
                        users[seatId] = this.userInfo()
                        users[seatId].id = user.id
                        users[seatId].name = user.name
                    })
                    console.log(data.users)
                    break;
                case "game_aviliable":
                    console.log(data)
                    this.state.game.ready = data.is_game_aviliable
                    break;
                case "send_id_card":
                    user.role = data.id_card_type
                    break;
                case "announce_period_started":
                    console.log(data)
                    this.startPeriod(data)
                    break;
                case "user_is_chosen"://被选择的人
                    let ids = data.id;
                    break
                case "user_is_locked"://狼人最终决定杀的人 或 女巫要救的人
                    seatId = this.getSeatId(data.id);
                    this.state.game.seatLock = seatId;
                    break;
                case "is_user_goodman":
                    let {isGoodman} = data;
                    if(isGoodman){
                        this.state.game.showGoodman = true
                    }else{
                        this.state.game.showBadman = true
                    }
                    break;
                case "user_dead":
                    let id1 = data.id1
                    let id2 = data.id2
                    if(id1>=0){
                        seatId = this.getSeatId(id1)
                        users[seatId].isDead = true
                    }
                    if(id2>=0){
                        seatId = this.getSeatId(id2)
                        users[seatId].isDead = true
                    }
                    break;
                case "game_over":
                    let {is_game_over,id} = data;
                    this.state.game.isGameOver = is_game_over
                    break;
                case "vote_out":
                    userId = data.id;
                    if(userId>=0){
                        seatId = this.getSeatId(userId)
                        users[seatId].isDead = true
                    }
                    break;
                case "text_message":
                    users.forEach(userInfo=>{
                        userInfo.isChat = false
                    })
                    userId = data.id
                    seatId = this.getSeatId(userId)
                    users[seatId].message = data.message
                    users[seatId].isChat = true
                    break
            }
            this.setState({
                game:this.state.game
            })
        });
    }


    getUserId = (seatId)=>{
        return users[seatId].id
    }

    chooseTarget =  (event,seatId)=>{
        if(!seatId) return
        let userId = this.getUserId(seatId);
        //玩家没死 
        if(!users[seatId].isChoose && !users[seatId].isDead){
            if(this.state.game.period == 'witch_poison'){
                this.chooseSave({},true)
            }
            let id = user.id
            socket.emit('room',JSON.stringify({type:'choose_target',data:{target_id: userId,id:id}}))
            users.forEach(function (user) {
                user.isChoose = false;
            });
            users[seatId].isChoose = true;
        }else{
            alert('重复点击')
        }
    }

    chooseSave = (event,issave)=>{
        //除去第一个参数
        // Array.prototype.slice.call(arguments, 1)
        let id = user.id
        socket.emit('room',JSON.stringify({type:'choose_target',data:{is_save: issave,id:id}}))
    }
    /**
     * 关闭所有弹框
     * @param id
     * @param message
     * @param roomId
     */
    close = ()=>{
        this.state.game.showGuard = false
        this.state.game.showWolf = false
        this.state.game.showWitchRescue = false
        this.state.game.showWitchPoison = false
        this.state.game.showProphet = false
        this.state.game.showVote = false
        this.state.game.showWait = false
        this.setState({
            game:this.state.game
        })
    }

    sendMsg = (e)=>{
        e.preventDefault();
        let message= document.querySelector('#input').value
        document.querySelector('#input').value = ''
        console.log('message:',message)
        if(message){
            let id = user.id
            socket.emit('room',JSON.stringify({'type':`text_message`,data:{id:id,message:message}}))       
        }
    }

    startGame = ()=>{
        socket.emit('room',JSON.stringify({type:'start_game',data:{game_started:true}}))
    }

    confirm = ()=> {
        message.success('点击了确定');
      }
      
    cancel = ()=> {
        message.error('点击了取消');
      }
    render(){   
      const {ready,periodInfo,seatLock,showGoodman,showBadman,isGameOver,showChat} = this.state.game
    return <>
    <table className={styles.frame}>
    <tr>
     <td colSpan="3" className={styles.main}>
       <div className={styles.site}>
            {/* 用户名 */}
            {users[1] && users[1].name}
           <div className={styles.identity0}>
               {/* 角色 */}
                {user.id == 0 && user.role == 1?<span>村民</span>:''}
                {user.id == 0 && user.role == 2?<span>狼人</span>:''}
                {user.id == 0 && user.role == 3?<span>预言家</span>:''}
                {user.id == 0 && user.role == 4?<span>女巫</span>:''}
                {user.id == 0 && user.role == 5?<span>守护者</span>:''}
           </div>
            {/* 文字信息 */}
            {users[1] && users[1].isChat && 
            <div >
                <div className={styles.triLeft}></div>
                <textarea
                className={styles.message}
                value={users[1].message} 
                disabled="disabled"></textarea>
            </div>
            }
       </div>
       <div className={styles.site}>
            {users[2] && users[2].name}
           <div className={styles.identity0}>
                {user.id == 1 && user.role == 1?<span>村民</span>:''}
                {user.id == 1 && user.role == 2?<span>狼人</span>:''}
                {user.id == 1 && user.role == 3?<span>预言家</span>:''}
                {user.id == 1 && user.role == 4?<span>女巫</span>:''}
                {user.id == 1 && user.role == 5?<span>守护者</span>:''}
           </div>

           {users[2] && users[2].isChat && 
            <div >
                <div className={styles.triLeft}></div>
                <textarea
                className={styles.message}
                value={users[2].message} 
                disabled="disabled"></textarea>
            </div>
            }
       </div>
       <div className={styles.site}>
            {users[3] && users[3].name}
           <div className={styles.identity0}>
            {user.id == 2 && user.role == 1?<span>村民</span>:''}
            {user.id == 2 && user.role == 2?<span>狼人</span>:''}
            {user.id == 2 && user.role == 3?<span>预言家</span>:''}
            {user.id == 2 && user.role == 4?<span>女巫</span>:''}
            {user.id == 2 && user.role == 5?<span>守护者</span>:''}
           </div>
           {users[3] && users[3].isChat && 
            <div >
                <div className={styles.triLeft}></div>
                <textarea
                className={styles.message}
                value={users[3].message} 
                disabled="disabled"></textarea>
            </div>
            }
       </div>
       <div className={styles.site}>
            {users[4] && users[4].name}
           <div className={styles.identity0}>
            {user.id == 3 && user.role == 1?<span>村民</span>:''}
            {user.id == 3 && user.role == 2?<span>狼人</span>:''}
            {user.id == 3 && user.role == 3?<span>预言家</span>:''}
            {user.id == 3 && user.role == 4?<span>女巫</span>:''}
            {user.id == 3 && user.role == 5?<span>守护者</span>:''}
           </div>
           {users[4] && users[4].isChat && 
            <div >
                <div className={styles.triLeft}></div>
                <textarea
                className={styles.message}
                value={users[4].message} 
                disabled="disabled"></textarea>
            </div>
            }
       </div>
       <div className={styles.site}>
            {users[5] && users[5].name}
           <div className={styles.identity0}>
            {user.id == 4 && user.role == 1?<span>村民</span>:''}
            {user.id == 4 && user.role == 2?<span>狼人</span>:''}
            {user.id == 4 && user.role == 3?<span>预言家</span>:''}
            {user.id == 4 && user.role == 4?<span>女巫</span>:''}
            {user.id == 4 && user.role == 5?<span>守护者</span>:''}
           </div>
           {users[5] && users[5].isChat && 
            <div >
                <div className={styles.triLeft}></div>
                <textarea
                className={styles.message}
                value={users[5].message} 
                disabled="disabled"></textarea>
            </div>
            }
       </div>
       <div className={styles.site}>
            {users[6] && users[6].name}
           <div className={styles.identity0}>
            {user.id == 5 && user.role == 1?<span>村民</span>:''}
            {user.id == 5 && user.role == 2?<span>狼人</span>:''}
            {user.id == 5 && user.role == 3?<span>预言家</span>:''}
            {user.id == 5 && user.role == 4?<span>女巫</span>:''}
            {user.id == 5 && user.role == 5?<span>守护者</span>:''}
           </div>
           {users[6] && users[6].isChat && 
            <div >
                <div className={styles.triLeft}></div>
                <textarea
                className={styles.message}
                value={users[6].message} 
                disabled="disabled"></textarea>
            </div>
            }
       </div>
       <div className={styles.site}>
            {users[7] && users[7].name}
           <div className={styles.identity0}>
            {user.id == 6 && user.role == 1?<span>村民</span>:''}
            {user.id == 6 && user.role == 2?<span>狼人</span>:''}
            {user.id == 6 && user.role == 3?<span>预言家</span>:''}
            {user.id == 6 && user.role == 4?<span>女巫</span>:''}
            {user.id == 6 && user.role == 5?<span>守护者</span>:''}
           </div>
           {users[7] && users[7].isChat && 
            <div >
                <div className={styles.triLeft}></div>
                <textarea
                className={styles.message}
                value={users[7].message} 
                disabled="disabled"></textarea>
            </div>
            }
       </div>
       <div className={styles.site}>
            {users[8] && users[8].name}
           <div className={styles.identity0}>
            {user.id == 7 && user.role == 1?<span>村民</span>:''}
            {user.id == 7 && user.role == 2?<span>狼人</span>:''}
            {user.id == 7 && user.role == 3?<span>预言家</span>:''}
            {user.id == 7 && user.role == 4?<span>女巫</span>:''}
            {user.id == 7 && user.role == 5?<span>守护者</span>:''}
           </div>
           {users[8] && users[8].isChat && 
            <div >
                <div className={styles.triLeft}></div>
                <textarea
                className={styles.message}
                value={users[8].message} 
                disabled="disabled"></textarea>
            </div>
            }
       </div>
       <div className={styles.site}>
            {users[9] && users[9].name}
           <div className={styles.identity0}>
            {user.id == 8 && user.role == 1?<span>村民</span>:''}
            {user.id == 8 && user.role == 2?<span>狼人</span>:''}
            {user.id == 8 && user.role == 3?<span>预言家</span>:''}
            {user.id == 8 && user.role == 4?<span>女巫</span>:''}
            {user.id == 8 && user.role == 5?<span>守护者</span>:''}
           </div>
           {users[9] && users[9].isChat && 
            <div >
                <div className={styles.triLeft}></div>
                <textarea
                className={styles.message}
                value={users[9].message} 
                disabled="disabled"></textarea>
            </div>
            }
       </div>
   </td>
</tr>

<tr>
  
   {showChat && <td className={styles.speakTxt}>
        <input id="input" className={styles.inTxt} type="text" />
        <button onClick={this.sendMsg}>提交</button>
   </td>}
  
   <td className={styles.menu}>
        {ready && <input className={styles.start} type="button" value="开始游戏" onClick={this.startGame}/>}
       
       {/* <input className={styles.leave} type="button" value="离开房间" onclick="window.history.back(-1)"/> */}
   </td>
  
</tr>

</table>
            {/* 宣布游戏结束 */}
            {isGameOver && message.info({
                content:`游戏结束了`,
                onClose:()=>{
                    this.state.game.isGameOver=false
                }
            },10)}
          
            {/* 守护者弹框 */}
            <Modal
            title={`现在是守护者时间`}
            visible={this.state.game.showGuard}
            onOk={this.close}
            onCancel={this.close}
            >
            <p>倒计时:{this.state.game.time}</p>
            <div className={styles.dialog}>
                {users.map((userInfo,i)=>{
                    if(userInfo){
                        const seatId = this.getSeatId(userInfo.id)
                        return <><a style={{color:userInfo.isDead?'red':''}} onClick={(e)=>this.chooseTarget(e,seatId)}>{seatId}</a>&nbsp;&nbsp;&nbsp;&nbsp;</>
                    }
                })}
            </div>
            <p>*标红的为死者</p>
            </Modal>
            {/* 狼人弹框 */}
            <Modal
            title={`现在是狼人时间`}
            visible={this.state.game.showWolf}
            onOk={this.close}
            onCancel={this.close}
            >
            <p>倒计时:{this.state.game.time}</p>
            <div className={styles.dialog}>
                {users.map((userInfo,i)=>{
                    if(userInfo){
                        const seatId = this.getSeatId(userInfo.id)
                        return <><a style={{color:userInfo.isDead?'red':''}} onClick={(e)=>this.chooseTarget(e,seatId)}>{seatId}</a>&nbsp;&nbsp;&nbsp;&nbsp;</>
                    }
                })}
            </div>
            <p>*标红的为死者</p>
            </Modal>
            {/* 女巫救人弹框 */}
            <Modal
            title={`现在是女巫救人时间`}
            visible={this.state.game.showWitchRescue}
            onOk={this.close}
            onCancel={this.close}
            >
                <p>倒计时:{this.state.game.time}</p>
                <p>女巫，今晚{seatLock}遇刺，是否使用解药？</p>
                <Button onClick={(e)=>this.chooseSave(e,true)}>使用</Button>
                <Button onClick={(e)=>this.chooseSave(e,false)}>不使用</Button>
            </Modal>
             {/* 女巫毒人弹框 */}
             <Modal
            title={`现在是女巫毒人时间`}
            visible={this.state.game.showWitchPoison}
            onOk={this.close}
            onCancel={this.close}
            >
                <p>倒计时:{this.state.game.time}</p>
                <p>女巫，今晚你要毒死谁？</p>
                <div className={styles.dialog}>
                {wolfman.userInfoModel.seat.map((userInfo,i)=>{
                    if(userInfo){
                        const seatId = this.getSeatId(userInfo.id)
                        return <><a style={{color:userInfo.isDead?'red':''}} onClick={(e)=>this.chooseTarget(e,seatId)}>{seatId}</a>&nbsp;&nbsp;&nbsp;&nbsp;</>
                    }
                })}
                </div>
                <p>*标红的为死者</p>
            </Modal>
            {/* 预言家弹框 */}
            <Modal
            title={`现在是预言家时间`}
            visible={this.state.game.showProphet}
            onOk={this.close}
            onCancel={this.close}
            >
                <p>倒计时:{this.state.game.time}</p>
                <p>预言家，今晚你要查验谁的身份？</p>
                <div className={styles.dialog}>
                {wolfman.userInfoModel.seat.map((userInfo,i)=>{
                    if(userInfo){
                        const seatId = this.getSeatId(userInfo.id)
                        return <><a style={{color:userInfo.isDead?'red':''}} onClick={(e)=>this.chooseTarget(e,seatId)}>{seatId}</a>&nbsp;&nbsp;&nbsp;&nbsp;</>
                    }
                })}
                </div>
                <p>*标红的为死者,默认验第一个人</p>
                {showGoodman && <p>查验结果:好人</p>}
                {showBadman && <p>查验结果:坏人</p>}
            </Modal>
            {/* 其他人弹框 */}
            <Modal
            title={`现在是${periodInfo}时间`}
            visible={this.state.game.showWait}
            onOk={this.close}
            onCancel={this.close}
            footer={null}
            >
                <p>倒计时:{this.state.game.time}</p>
            </Modal>
            {/* 投票弹框 */}
            <Modal
            title={`现在是投票时间`}
            visible={this.state.game.showVote}
            onOk={this.close}
            onCancel={this.close}
            >   <p>倒计时:{this.state.game.voteTime}</p>
                <p>今天，你要投票处决哪位玩家？</p>
                <div className={styles.dialog}>
                {wolfman.userInfoModel.seat.map((userInfo,i)=>{
                    if(userInfo){
                        const seatId = this.getSeatId(userInfo.id)
                        return <><a style={{color:userInfo.isDead?'red':''}} onClick={(e)=>this.chooseTarget(e,seatId)}>{seatId}</a>&nbsp;&nbsp;&nbsp;&nbsp;</>
                    }
                })}
                </div>
                <p>*标红的为死者</p>
            </Modal>
        </>
  }
}
