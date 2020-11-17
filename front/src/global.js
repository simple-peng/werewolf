    window.socket = require('socket.io-client')('http://127.0.0.1:7001');
    //连接服务端
    window.socket.on('connect', () => {
        console.log('connect!',socket.id);
    });

    window.wolfman ={
        userInfoModel:{
            id: -1,
            name: '',
            seat:[],//存储房间里每一个位置的信息
            role:-1,
            // roomId:-1,
        }
        //前端userInfo
        //     // var token = '';
        //     // var name = '';
        //     // var id = '';
        //     // var seat = [];  //存储房间里每一个位置的信息
        //     // var role = -1;
        //     // var roomnumber = '';
        //     // var mode = 0;   //用户选择的游戏模式
    
        //     //后端
        //     // token: randomString(16),
        //     // name: name,
        //     // id: u_id,
        //     // client: client,
        //     // data: {}, //游戏数据
        //     // online:
        //     // room: -1,
    }