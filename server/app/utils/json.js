let json_encode = function(type,data,msg){
    // {type:"login_succ",data:obj}
    msg = msg ||''
    let res = {
        type:type,
        data:data,
        msg:msg
    }
    return JSON.stringify(res);
}

let json_decode = function(str){
    try{
        return JSON.parse(str);
    }catch(e){
        return false
    }
}

module.exports={
    json_encode,
    json_decode
}