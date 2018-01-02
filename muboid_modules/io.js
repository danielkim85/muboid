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
        socket.emit('created',roomName);
      }
    });

    socket.on('leave', function(roomName,isDelete){
      socket.leave(roomName);
      if(isDelete){
        socket.broadcast.to(roomName).emit('gameover');
        rooms.deleteRoom(roomName);
      }
    });

    socket.on('uploadPlaylist', function(data){
      rooms.uploadPlaylist(data.roomName,data.playlist);
      socket.broadcast.to(data.roomName).emit('playlistUpdated',data.playlist);
    });

    socket.on('join', function(roomName){
      var ret = rooms.joinRoom(roomName);
      if(!ret){
        socket.emit('joined',{success:0,msg:'Room not found.'});
      }
      else{
        socket.join(roomName);
        socket.emit('joined',{success:1,msg:ret});
      }
    });

  });
}

module.exports = MyIO;