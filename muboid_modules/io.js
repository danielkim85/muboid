var Blackjack = require('../muboid_modules/blackjack.js');
var Player = require('../muboid_modules/player.js');

function draw(socket,blackjack,betAmount){
  var msg = {};
  var hands;
  if (betAmount !== undefined){
    hands = blackjack.init(betAmount);
    msg.hands = hands.playerHands;
    msg.dealerHands = hands.dealerHands;
  }
  else{
    hands = blackjack.draw(1);
    msg.hands = hands.playerHands;
    msg.dealerHands = hands.dealerHands;
  }

  var count = blackjack.player.count();
  var dealerCount = blackjack.dealer.count();
  msg.count = count;
  msg.dealerCount = dealerCount;

  if(count === 21 && dealerCount === 21){
    //push
    blackjack.didPlayerWin();
    blackjack.reset();
  }
  else if(count === 21){
    //player blackjack
    blackjack.didPlayerWin();
    blackjack.reset();
  }
  else if(dealerCount === 21){
    //player blackjack
    blackjack.didPlayerWin();
    blackjack.reset();
  }
  else if(dealerCount > 21){
    //dealer bust
    blackjack.didPlayerWin();
    blackjack.reset();
  }
  else if(count > 21){
    //player bust
    blackjack.reset();
  }
  blackjack.didPlayerWin();
  socket.emit('draw',msg);
}
function MyIO(server) {
  var io = require('socket.io')(server);

  io.on('connection', function(socket){
    var player = new Player('player1',5000);
    var dealer =  new Player('dealer',0);
    var blackjack = new Blackjack(player,dealer);
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

      draw(socket,blackjack,betAmount);
      socket.emit('newGame');
      socket.emit('money',blackjack.player.money);
    });

    socket.on('draw', function(){
      draw(socket,blackjack);
    });

    //TODO : implement stand logic below
    socket.on('stand',function(){
      var result = blackjack.didPlayerWin();
      if(result){
        socket.emit('money',blackjack.player.money);
      }
      blackjack.reset();
      console.info('emitting result');
      socket.emit('result',result);
    });
  });
}

module.exports = MyIO;