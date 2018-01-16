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

    socket.on('lockRoom', function(data){
      var ret = rooms.lockRoom(data.roomName,data.user,data.unlock);
      if(ret){
        socket.broadcast.to(data.roomName).emit('locked',ret);
      }
    });

    socket.on('removeSong', function(roomName,index,user){
      var ret = rooms.removeSong(roomName,index,user);
      if(!ret.success){
        return false;
      }
      socket.broadcast.to(roomName).emit('playlistUpdated',ret.data);
    });

    socket.on('addSong', function(roomName,index, song,user){
      var ret = rooms.addSong(roomName,index, song,user);
      if(!ret.success){
        return false;
      }
      socket.broadcast.to(roomName).emit('playlistUpdated',ret.data);
    });

    socket.on('uploadPlaylist', function(roomName,playlist,user){
      rooms.uploadPlaylist(roomName,playlist,user);
    });

    socket.on('sortPlaylist', function(roomName,playlist,user){
      var ret = rooms.sortPlaylist(roomName,playlist,user);
      if(!ret.success){
        return false;
      }
      socket.broadcast.to(roomName).emit('playlistUpdated',ret.data);
    });

    socket.on('join', function(roomName,user,adminCode){
      var ret = rooms.joinRoom(roomName,user,adminCode);

      if(ret.success){
        socket.join(roomName);
      }
      socket.emit('joined',ret);
    });

  });
}

module.exports = MyIO;