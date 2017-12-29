var Rooms = function (){
  var rooms = [];

  this.makeRoomName = function(){
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 5; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text.toUpperCase();
  };

  this.createRoom = function(){

    if(rooms.length >= 100){
      //TODO handle error better
      return null;
    }

    var roomName = this.makeRoomName();
    while(rooms.indexOf(roomName) > 0){
      console.info('regen');
      roomName = this.makeRoomName();
    }
    rooms.push(roomName);
    return roomName;
  }
};

module.exports = Rooms;