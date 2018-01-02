var Rooms = function (){
  var rooms = {};

  this.makeRoomName = function(){
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 5; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text.toUpperCase();
  };

  this.createRoom = function(){

    if(Object.keys(rooms).length >= 100){
      //TODO handle error better
      return null;
    }

    var roomName = this.makeRoomName();
    while(roomName in rooms > 0){
      roomName = this.makeRoomName();
    }
    rooms[roomName] = {playlist:null};
    return roomName;
  };

  this.deleteRoom = function(roomName){
    delete rooms[roomName];
    return;
  };

  this.uploadPlaylist = function(roomName,playlist){
    rooms[roomName].playlist = playlist;
    return;
  };

  this.joinRoom = function(roomName){
    if(!(roomName in rooms)){
      return false;
    }

    return rooms[roomName].playlist;
  };
};

module.exports = Rooms;