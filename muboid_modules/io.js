var Rooms = require('../muboid_modules/rooms.js');

function MyIO(server) {
  var io = require('socket.io')(server);
  var rooms = new Rooms();

  io.on('connection', function(socket){

    socket.on('disconnect', function () {
    });

    socket.on('create', function(roomConfig){
      var roomName = rooms.createRoom(roomConfig);
      if(roomName !== null){
        socket.join(roomName);
        socket.emit('created',roomName);
      }
    });

    socket.on('leave', function(roomName,user,isDelete){
      socket.leave(roomName);
      if(isDelete){
        socket.broadcast.to(roomName).emit('gameover');
        rooms.deleteRoom(roomName);
        return;
      }
      rooms.leaveRoom(roomName,user);
    });

    socket.on('removeSong', function(roomName,index,user){
      var ret = rooms.removeSong(roomName,index,user);
      if(!ret.success){
        return false;
      }
      socket.broadcast.to(roomName).emit('playlistUpdated',ret.data);
    });

    socket.on('addSong', function(roomName,index, song){
      var ret = rooms.addSong(roomName,index, song);
      if(!ret.success){
        return false;
      }
      socket.broadcast.to(roomName).emit('playlistUpdated',ret.data);
    });

    socket.on('uploadPlaylist', function(roomName,playlist,user){
      rooms.uploadPlaylist(roomName,playlist,user);
    });

    socket.on('sortPlaylist', function(roomName,playlist){
      var ret = rooms.sortPlaylist(roomName,playlist);
      if(!ret.success){
        return false;
      }
      socket.broadcast.to(roomName).emit('playlistUpdated',ret.data);
    });

    socket.on('join', function(roomName,user){
      var ret = rooms.joinRoom(roomName,user);

      if(ret){
        socket.join(roomName);
      }
      socket.emit('joined',ret);
    });

  });
}

module.exports = MyIO;