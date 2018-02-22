var Rooms = require('../muboid_modules/rooms.js');
var Users = require('../muboid_modules/users.js');

function MuBoid(server) {
  var io = require('socket.io')(server);
  var rooms = new Rooms();
  var users = new Users();
  io.on('connection', function(socket){

    socket.on('create', function(roomConfig){
      var roomName = rooms.createRoom(roomConfig);
      if(roomName !== null){
        users.createRoom(roomConfig.owner.socketId,roomName);
        socket.join(roomName);
        socket.emit('created',roomName);
      }
    });

    socket.on('leave', function(roomName,user,isDelete){
      socket.leave(roomName);
      if(isDelete){
        rooms.deleteRoom(roomName);
        socket.emit('roomDeleted',users.deleteRoom(user.socketId,roomName));
        socket.broadcast.to(roomName).emit('gameover');
        return;
      }
      rooms.leaveRoom(roomName,user);
    });

    socket.on('startFire', function(roomName){
      rooms.startFire(roomName);
      socket.broadcast.to(roomName).emit('fireStarted');
    });

    socket.on('fastForward', function(roomName){
      socket.broadcast.to(roomName).emit('fastForward');
    });

    socket.on('getMyRooms',function(socketId){
      socket.emit('getMyRooms', users.getMyRooms(socketId));
    });

    socket.on('lockRoom', function(data){
      var ret = rooms.lockRoom(data.roomName,data.user,data.unlock);
      if(ret){
        socket.broadcast.to(data.roomName).emit('locked',ret);
      }
    });

    socket.on('removeSong', function(roomName,index,user,hard){
      var ret = rooms.removeSong(roomName,index,user,hard);
      if(!ret.success){
        return false;
      }
      socket.broadcast.to(roomName).emit('playlistUpdated',ret.data);
    });

    socket.on('addSong', function(roomName,index,song,user){
      var ret = rooms.addSong(roomName,index, song,user);
      if(!ret.success){
        return false;
      }
      socket.broadcast.to(roomName).emit('playlistUpdated',ret.data);
    });

    socket.on('sortPlaylist', function(roomName,playlist,user){
      var ret = rooms.sortPlaylist(roomName,playlist,user);
      if(!ret.success){
        return false;
      }
      socket.broadcast.to(roomName).emit('playlistUpdated',ret.data);
    });

    socket.on('likeSong', function(roomName,user,expression){
      var ret = rooms.likeSong(roomName,user,expression);
      if(!ret.success){
        return false;
      }
      socket.broadcast.to(roomName).emit('songLiked',ret.data);
      socket.emit('songLiked',ret.data);
    });

    socket.on('uploadPlaylist', function(roomName,playlist,user){
      rooms.uploadPlaylist(roomName,playlist,user);
    });

    socket.on('join', function(roomName,user){
      var ret = rooms.joinRoom(roomName,user);
      if(ret.success){
        socket.join(roomName);
      }
      socket.emit('joined',ret);
    });

  });
}

module.exports = MuBoid;