var cardConvertMap = {
  face:{
    h:'hearts',
    c:'clubs',
    d:'diamonds',
    s:'spades'
  },
  num:{
    1:'ace',
    11:'jack',
    12:'queen',
    13:'king'
  }
};

var PLACEBET = "Place your bet.";
var BUSTED = "BUSTED";
var HIT = "Hit or Stand?";

function convertCardPath(cardId){
  var face = cardId[0];
  var num = cardId.substring(1,cardId.length);
  face = cardConvertMap.face[face];
  num = cardConvertMap.num[num] === undefined ? num : cardConvertMap.num[num];
  return num + '_of_' + face + '.png';
}

var app = angular.module('MuBoidApp', []);
app.controller('MuBoidCtrl', function($scope) {
  $scope.msg = PLACEBET;
  $scope.cards = [];
  $scope.betAmount = '200';

  var socket = io.connect('http://localhost:3000',{
    'sync disconnect on unload': true
  });

  $scope.draw = function() {
    socket.emit('draw', {});
  };

  $scope.setBet = function(number) {
    $scope.betAmount = number;
  };

  $scope.init = function() {
    socket.emit('init', $scope.betAmount);
  };

  socket.on('fail', function(msg){
    $scope.msg = msg;
    $scope.$apply();
  });

  socket.on('newGame', function(){
    $scope.betPlaced = true;
    $scope.msg = HIT;
  });

  socket.on('draw', function(msg) {
    $scope.cards = [];
    msg.hands.forEach(function(hand){
      $scope.cards.push(convertCardPath((hand)));
    });
    if(msg.count > 21){
      $scope.msg = BUSTED;
      $scope.betPlaced = false;
    }
    $scope.$apply();
  });

  socket.on('money', function(data) {
    // Respond with a message including this clients' id sent from the server
    $scope.money = data;
    $scope.$apply();
  });

  socket.on('connect', function(){});
  socket.on('event', function(data){});
  socket.on('disconnect', function(){});
});