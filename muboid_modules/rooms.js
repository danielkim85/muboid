var Rooms = function (){
  var _ = require('lodash');

  var rooms = {};

  //helper

  Array.prototype.remove = function() {
    var what, a = arguments, L = a.length, ax;
    while (L && this.length) {
      what = a[--L];
      while ((ax = this.indexOf(what)) !== -1) {
        this.splice(ax, 1);
      }
    }
    return this;
  };

  function usernameExists(roomName,myUsername){
    var ret = false;
    //TODOD inefficient
    rooms[roomName].guests.forEach(function(guest){
      if(guest.username === myUsername){
        ret = true;
      }
    });
    return ret;
  }

  function makeRoomName(){
    var text = "";
    var possible = "123456789";

    for (var i = 0; i < 4; i++)
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
      history:[],
      locked:false,
      guests:[],
      fireStarted : false,
      admins:[roomConfig.owner.socketId],
      owner:roomConfig.owner,
      guestPerm:roomConfig.guestPerm,
      adminPwd:null
    };
    return roomName;
  };

  this.startFire = function(roomName){
    if(!(roomName in rooms)){
      return {
        success:false,
        msg:'Room not found'
      };
    }
    rooms[roomName].fireStarted = true;
    return;
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

  //sort, return current and past
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
    var history = rooms[roomName].history;
    return {
      success:true,
      data:{
        playlist:playlist,
        history:history
      }
    };
  };

  //remove, return current and past
  this.removeSong = function(roomName,index,user,hard){
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
    var history = rooms[roomName].history;
    if(playlist[index].owner.socketId !== user.socketId &&
      room.owner.socketId !== user.socketId &&
      room.admins.indexOf(user.socketId) === -1){
      return {
        success:false,
        msg:'Unauthorized'
      };
    }
    if(!hard){
      history.push(playlist[index]);
    }

    playlist.splice(index,1);
    return {
      success:true,
      data:{
        playlist:playlist,
        history:history
      }
    };
  };

  //add, return current and past
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
    var history = rooms[roomName].history;
    playlist.splice(index,0,song);
    return {
      success:true,
      data:{
        playlist:playlist,
        history:history
      }
    };
  };

  this.likeSong = function(roomName,user,expression){
    if(!(roomName in rooms)){
      return {
        success:false,
        msg:'Room not found'
      };
    }

    var playlist = rooms[roomName].playlist;
    if(playlist.length === 0){
      return {
        success:false,
        msg:'No songs in playlist'
      };
    }

    var targetSong = playlist[0];
    if(targetSong.id !== expression.songId){
      return {
        success:false,
        msg:'Song id does not match'
      };
    }

    if(expression.liked){
      if(targetSong.likes.indexOf(user.socketId) === -1) {
        targetSong.hates.remove(user.socketId);
        targetSong.likes.push(user.socketId);
      }
    }
    else{
      if(targetSong.hates.indexOf(user.socketId) === -1) {
        targetSong.likes.remove(user.socketId);
        targetSong.hates.push(user.socketId);
      }
    }
    return {
      success:true,
      data:targetSong
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

  this.joinRoom = function(roomName,user){
    if(!user.name){
      return {
        success:false,
        msg:'Name cannot be empty'
      };
    }

    if(!(roomName in rooms)){
      return {
        success:false,
        msg:'Room not found.'
      };
    }

    var room = rooms[roomName];
    var isAdmin = room.admins.indexOf(user.socketId) !== -1;

    if(usernameExists(roomName,user.username)) {
      room.guests.push({
        name: user.name,
        socketId: user.socketId
      });
    }
    return {
      success:true,
      data: {
        playlist:room.playlist,
        history:room.history,
        user:user,
        roomName:roomName,
        isAdmin : isAdmin,
        guestPerm:room.guestPerm,
        locked:room.locked,
        fireStarted:room.fireStarted
      }
    };
  };
};

module.exports = Rooms;