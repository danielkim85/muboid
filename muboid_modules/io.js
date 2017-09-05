var Blackjack = require('../muboid_modules/blackjack.js');
var Player = require('../muboid_modules/player.js');

function draw(socket,blackjack,drawCount){
  var count = blackjack.player.count();
  var msg = {
    hands: blackjack.draw(drawCount),
    count : count
  };

  //hands busted, destroy hand cards,
  if(count > 21){
    blackjack.player.hands = [];
  }
  else if(count == 21){
    //TODO : blackjack logic goes here.
  }

  socket.emit('draw',msg);
}
function MyIO(server) {
  var io = require('socket.io')(server);

  io.on('connection', function(socket){
    var player = new Player('player1',5000);
    var blackjack = new Blackjack(player);
    socket.emit('money',blackjack.player.money);

    socket.on('disconnect', function () {
      blackjack = null;
    });

    socket.on('init', function (betAmount) {
      if(betAmount < 100){
        return;
      }

      if(betAmount > blackjack.player.money){
        socket.emit('fail','You don\'t have enough money.');
        return;
      }

      draw(socket,blackjack,2);
      socket.emit('newGame');
      socket.emit('money',blackjack.player.money);
    });

    socket.on('draw', function(){
      draw(socket,blackjack,1);
    });

    //TODO : implement stand logic below
    socket.on('stand',function(){

    });
  });
}

module.exports = MyIO;