var Deck = require('./deck.js');

//constructor
//create blackjack game for single player
var Blackjack = function (player,dealer) {
  this.player = player;
  this.dealer = dealer;
  this.deck = new Deck();
  this.deck.shuffle();
  this.betAmount = 0;
};

//player places bet, two cards drawn to player
Blackjack.prototype.init = function (betAmount) {
  this.betAmount = betAmount;
  this.player.money -= betAmount;
  return this.draw(2);
};

Blackjack.prototype.reset = function () {
  this.dealer.hands = [];
  this.player.hands =  [];
};

Blackjack.prototype.draw = function (numberOfCards) {
  if(this.deck.cards.length < numberOfCards) {
    this.deck = new Deck();
    this.deck.shuffle();
  }
  this.player.hands = this.player.hands.concat(this.deck.draw(numberOfCards));

  //dealer logic
  if(this.dealer.hands.length === 0 || this.dealer.count() < 17){
    this.dealer.hands = this.dealer.hands.concat(this.deck.draw(numberOfCards));
  }
  console.info('dealer count ' + this.dealer.count());
  console.info('player count ' + this.player.count());

  return {playerHands:this.player.hands,dealerHands:this.dealer.hands};
};

Blackjack.prototype.didPlayerWin = function () {
  if(this.dealer.count() > 21 || this.player.count() > this.dealer.count()){
    this.player.money += (this.betAmount*2);
    return true;
  }
  return false;
};

module.exports = Blackjack;