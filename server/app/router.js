'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller,io } = app;
  io.of('/').route('login', io.controller.login.index);
  io.of('/').route('joinRoom', io.controller.joinRoom.index);
  io.of('/').route('room', io.controller.room.index);
};
