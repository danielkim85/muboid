var Rooms = function (){
  var _ = require('lodash');

  var rooms = {};

  //helper
  function nameExists(roomName,myName){
    var ret = false;
    //TODOD inefficient
    rooms[roomName].guests.forEach(function(guest){
      if(guest.name === myName){
        ret = true;
      }
    });
    return ret;
  }

  this.makeRoomName = function(){
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 5; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text.toUpperCase();
  };

  this.createRoom = function(user){

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
      guests:[],
      admins:[],
      owner:user,
      adminPwd:null
    };
    return roomName;
  };

  this.deleteRoom = function(roomName){
    delete rooms[roomName];

  };

  this.sortPlaylist = function(roomName,playlist){
    if(!(roomName in rooms)){
      return {
        success:false,
        msg:'Room not found.'
      };
    }

    //ac
    var origPlaylist = _.sortBy(rooms[roomName].playlist,'id');
    var targetPlaylist = _.sortBy(playlist,'id');
    var diff = _(targetPlaylist)
      .differenceBy(origPlaylist, 'id', 'owner.socketId')
      .map(_.partial(_.pick, _, 'id', 'owner'))
      .value();

    if(diff.legnth > 0){
      return {
        success:false,
        msg:'Unauthorized'
      };
    }

    rooms[roomName].playlist = playlist;

  };

  this.removeSong = function(roomName,index, user){
    if(!(roomName in rooms)){
      return {
        success:false,
        msg:'Room not found.'
      };
    }

    var room = rooms[roomName];
    var playlist = rooms[roomName].playlist;

    if(playlist[index].owner.socketId !== user.socketId && room.owner.socketId !== user.socketId){
      return {
        success:false,
        msg:'Unathorized'
      };
    }

    playlist.splice(index,1);
    return {
      success:true,
      data:playlist
    };
  };

  this.addSong = function(roomName,index,song){
    if(!(roomName in rooms)){
      return {
        success:false,
        msg:'Room not found.'
      };
    }
    var playlist = rooms[roomName].playlist;
    playlist.splice(index,0,song);
    return {
      success:true,
      data:playlist
    };;
  };

  this.uploadPlaylist = function(roomName,playlist,user){
    if(!(roomName in rooms)){
      return {
        success:false,
        msg:'Room not found.'
      };
    }

    var room = rooms[roomName];
    if(room.owner.socketId !== user.socketId){
      return {
        success:false,
        msg:'Unauthorized'
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

    if(nameExists(roomName,user.name)){
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