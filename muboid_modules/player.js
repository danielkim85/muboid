//constructor
//create player
var Player = function (name,money) {
  this.hands = [];
  this.name = name;
  this.money = money
};

//returns the total count of all cards.
//TODO : what to do about blackjack ace?
Player.prototype.count = function () {
  var count = 0;
  var aceCount = 0;
  this.hands.forEach(function(hand) {
    var handNumber = parseInt(hand.substr(1));
    if (handNumber === 1) {
      //do ace count last
      aceCount++;
    } else if(handNumber > 10){
      count += 10;
    }else{
      count += handNumber;
    }
  });
  for(var i = 0; i < aceCount; i++){
    //if 11 busts, go with 1
    count +=  (count + 11) > 21 ? 1 : 11;
  }
  return count;
};

module.exports = Player;