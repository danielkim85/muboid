var Rooms = require('../muboid_modules/rooms.js');

function MyIO(server) {
  var io = require('socket.io')(server);
  var rooms = new Rooms();

  io.on('connection', function(socket){

    socket.on('disconnect', function () {
    });

    socket.on('create', function(){
      //create
      var roomName = rooms.createRoom();
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

    socket.on('uploadPlaylist', function(data){
      rooms.uploadPlaylist(data.roomName,data.playlist);
      socket.broadcast.to(data.roomName).emit('playlistUpdated',data.playlist);
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