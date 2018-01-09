var Rooms = function (){
  var rooms = {};

  this.nameExists = function(roomName,myName){
    var ret = false;
    rooms[roomName].guests.forEach(function(guest){
      if(guest.name === myName){
        ret = true;
      }
    });
    return ret;
  };

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
    rooms[roomName] = {
      playlist:null,
      guests:[]
    };
    return roomName;
  };

  this.deleteRoom = function(roomName){
    delete rooms[roomName];

  };

  this.uploadPlaylist = function(roomName,playlist){
    if(!(roomName in rooms)){
      return {
        success:false,
        msg:'Room not found.'
      };
    }
    rooms[roomName].playlist = playlist;

  };

  this.leaveRoom = function(roomName,user){
    if(!(roomName in rooms)){
      return {
        success:false,
        msg:'Room not found.'
      };
    }

    var guests =  rooms[roomName].guests;
    for(var i = 0; i < guests.length; i++){
      if(guests[i].name === user.name && guests[i].socketId === user.socketId){
        guests.splice(i,1);
        break;
      }
    }
  };

  this.joinRoom = function(roomName,user){
    if(user.name.toLowerCase() === 'user'){
      return {
        success:false,
        msg:'Name is reserved.'
      };
    }

    if(!(roomName in rooms)){
      return {
        success:false,
        msg:'Room not found.'
      };
    }

    if(this.nameExists(roomName,user.name)){
      return {
        success:false,
        msg:'Name already exists.'
      };
    }

    var room = rooms[roomName];

    room.guests.push({
      name:user.name,
      socketId:user.socketId
    });

    return {
      success:true,
      data: {
        playlist:room.playlist,
        user:user,
        roomName:roomName
      }
    };
  };
};

module.exports = Rooms;