var Deck = require('./deck.js');

//constructor
//create blackjack game for single player
var Blackjack = function (player) {
  this.player = player;
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

Blackjack.prototype.draw = function (numberOfCards) {
  if(this.deck.cards.length < numberOfCards) {
    this.deck = new Deck();
    this.deck.shuffle();
  }
  this.player.hands = this.player.hands.concat(this.deck.draw(numberOfCards));
  return this.player.hands;
};

module.exports = Blackjack;