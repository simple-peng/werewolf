
// import styles from './login.css';
import React,{Component} from "react";
import md5 from "md5"
import router from 'umi/router';

export default class Login extends Component {
  constructor(props){
    super(props)
    this.ref = React.createRef()
    socket.on('login', msg => {
      // {type:"login_succ",data:obj}
      console.log(msg)
      msg = JSON.parse(msg)
      console.log(msg)
      const {type,data} = msg
      console.log(type,data)
      switch(type){
        case "login_succ":
          wolfman.userInfoModel.id = data.id
          wolfman.userInfoModel.name = data.name
          router.push('/joinroom?user='+data.name)
          break;
        default:
      }
    });
  }

  login = (e) => {
    e.preventDefault();
    const data = {
      name:this.ref.current.user.value,
      password:md5(this.ref.current.pwd.value)
    }
    if(!data.name || !data.password) return;
    socket.emit('login', JSON.stringify({type:'login',data:data}));
 }
  render(){
    return <form ref={this.ref}>
        username:&nbsp;<input type="text" name="user"  id="uname"/><br/><br />
        password:&nbsp;<input type="password" name="pwd"  id="password"/><br/><br />
        &nbsp;&nbsp;&nbsp;&nbsp;<input type="submit" value="登录" onClick={this.login} />
        <input type="reset" value="重置" />
    </form>
  }
}
