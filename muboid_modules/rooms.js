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

  function makeRoomName(){
    var text = "";
    var possible = "0123456789";

    for (var i = 0; i < 5; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
  }
  //end of helper

  this.createRoom = function(roomConfig){
    if(Object.keys(rooms).length >= 100){
      //TODO handle error better
      return null;
    }

    var roomName = makeRoomName();
    while(roomName in rooms > 0){
      roomName = makeRoomName();
    }

    //initial room configuration
    rooms[roomName] = {
      playlist:null,
      locked:false,
      guests:[],
      admins:[roomConfig.owner.socketId],
      owner:roomConfig.owner,
      adminCode:roomConfig.adminCode,
      guestPerm:roomConfig.guestPerm,
      adminPwd:null
    };
    return roomName;
  };

  this.deleteRoom = function(roomName){
    delete rooms[roomName];
  };

  this.lockRoom = function(roomName,user,unlock){
    if(!(roomName in rooms)){
      return {
        success:false,
        msg:'Room not found'
      };
    }

    var room = rooms[roomName];
    if(room.owner.socketId !== user.socketId){
      return {
        success:false,
        msg:'Unauthorized'
      };
    }
    room.locked = !unlock;
    return {
      success:true,
      data:room.locked
    };
  };

  this.sortPlaylist = function(roomName,playlist,user){
    if(!(roomName in rooms)){
      return {
        success:false,
        msg:'Room not found'
      };
    }

    var room = rooms[roomName];
    if(room.locked && room.owner.socketId !== user.socketId && room.admins.indexOf(user.socketId) === -1){
      return {
        success:false,
        msg:'Room locked'
      };
    }

    if(!room.guestPerm.sortSong && room.admins.indexOf(user.socketId) === -1){
      return {
        success:false,
        msg:'Unauthorized'
      };
    }

    //enhance this to take orig index to dest index
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
    return {
      success:true,
      data:playlist
    };
  };

  this.removeSong = function(roomName,index, user){
    if(!(roomName in rooms)){
      return {
        success:false,
        msg:'Room not found'
      };
    }

    var room = rooms[roomName];
    if(room.locked && room.owner.socketId !== user.socketId && room.admins.indexOf(user.socketId) === -1){
      return {
        success:false,
        msg:'Room locked'
      };
    }

    var playlist = rooms[roomName].playlist;
    if(playlist[index].owner.socketId !== user.socketId &&
      room.owner.socketId !== user.socketId &&
      room.admins.indexOf(user.socketId) === -1){
      return {
        success:false,
        msg:'Unauthorized'
      };
    }

    playlist.splice(index,1);
    return {
      success:true,
      data:playlist
    };
  };

  this.addSong = function(roomName,index,song,user){
    if(!(roomName in rooms)){
      return {
        success:false,
        msg:'Room not found'
      };
    }
    var room = rooms[roomName];
    if(room.locked && room.owner.socketId !== user.socketId && room.admins.indexOf(user.socketId) === -1){
      return {
        success:false,
        msg:'Room locked'
      };
    }

    if(!room.guestPerm.addSong && room.admins.indexOf(user.socketId) === -1){
      return {
        success:false,
        msg:'Unauthorized'
      };
    }

    var playlist = rooms[roomName].playlist;
    playlist.splice(index,0,song);
    return {
      success:true,
      data:playlist
    };
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

  this.joinRoom = function(roomName,user,adminCode){
    if(!user.name){
      return {
        success:false,
        msg:'Name cannot be empty'
      };
    }

    if(user.name.toLowerCase() === 'owner'){
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

    var isAdmin = false;
    var room = rooms[roomName];
    if(adminCode && room.adminCode){
      if(adminCode !== room.adminCode){
        return {
          success:false,
          msg:'Unauthorized'
        };
      }
      isAdmin = true;
      room.admins.push(user.socketId);
    }

    room.guests.push({
      name:user.name,
      socketId:user.socketId
    });


    return {
      success:true,
      data: {
        playlist:room.playlist,
        user:user,
        roomName:roomName,
        isAdmin : isAdmin,
        guestPerm:room.guestPerm,
        locked:room.locked
      }
    };
  };
};

module.exports = Rooms;