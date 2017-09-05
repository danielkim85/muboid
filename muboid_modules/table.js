
var Player = require('./player.js');

//constructor
var Table = function () {
  //each table gets a deck
  this.deck = new Deck();
};

Table.prototype.acceptPlayer = function (name, money) {
  this.player = new Player(this,name,money);
  return this.player;
};

module.exports = Table;