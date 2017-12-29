var Rooms = require('../muboid_modules/rooms.js');

function MyIO(server) {
  var io = require('socket.io')(server);
  var rooms = new Rooms();

  io.on('connection', function(socket){

    socket.on('disconnect', function () {
      //clean up
    });

    socket.on('create', function(){
      //create
      var roomName = rooms.createRoom();
      socket.emit('created',roomName);
    });

    socket.on('join', function(roomName){
      socket.emit('joined',roomName);
    });

  });
}

module.exports = MyIO;