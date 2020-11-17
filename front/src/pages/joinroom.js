
import styles from './joinroom.css';
import React,{Component} from "react";
import router from 'umi/router';

export default class Room extends Component {
  constructor(props){
    super(props)
    this.state = {
      user:'',
      url:""
    }
  }

  componentDidMount(){
    let user = this.showValue();
    this.setState({
      user:user,
      url:"/room?user=" + user
    })
  }

  showValue = ()=>{
    var Ohref = window.location.href;
    var arrhref = Ohref.split("?user=");
    var arrhref1 = arrhref[1].split("&");
    return arrhref1[0];
  }

  joinroom = ()=>{
    let user = {
      id:wolfman.userInfoModel.id,
      name:wolfman.userInfoModel.name
    }
    socket.emit('joinRoom',JSON.stringify({type:"join_room",data:user}))
    router.push('/room?user='+this.state.user)
  }
  
  render(){
    const {user,url} = this.state;
    return (
      <form>
          <p>
              <strong id="user">
                {user}
              </strong>
              &nbsp;你好！<br/>
          </p>

          <ul>
              <li><a href="#">创建房间</a></li>
              <li><a href="javascript:void(0);" onClick={this.joinroom}>加入房间</a></li>
          </ul>
      </form>
    );
  }
}
