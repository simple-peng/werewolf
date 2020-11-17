//中间件负责 socket 连接的处理(响应connect)
// const room = "default_room";
module.exports = app => {
  return async (ctx, next) => {
    // const { app, socket, logger, helper } = ctx;
    // socket.on('connect',()=>{
    //   socket.emit('res', `connected!`);
    // })
    ctx.socket.emit('res', 'connected!');

    // socket.join(room)
    
    // nsp.to(room).emit('online', socket.id+ "上线了");
    await next();

    // execute when disconnect.
    // console.log('disconnection!');
  };
};