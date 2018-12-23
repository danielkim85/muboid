var Users = function (){

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

  var users = {};

  this.createRoom = function(username,roomName){
    if(!(username in users)){
      users[username] = [];
    }
    users[username].push(roomName);
  };

  this.deleteRoom = function(username,roomName){
    if(!(username in users)){
      return [];
    }
    users[username].remove(roomName);
    return users[username];
  };

  this.getMyRooms = function(username){
    if(!(username in users)){
      return [];
    }
    return users[username];
  };
};
module.exports = Users;