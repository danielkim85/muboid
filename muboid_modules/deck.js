//constructor
//create deck with all cards;
var Deck = function () {
  var faces = ['h','d','s','c'];
  this.cards = [];
  var that = this;
  faces.forEach(function(face){
    for(var i = 1; i < 14; i++){
      that.cards.push(face+i);
    }
  });
};

Deck.prototype.shuffle = function () {
  var i = this.cards.length, j, temp;
  if ( i === 0 ) return;
  while ( --i ) {
    j = Math.floor( Math.random() * ( i + 1 ) );
    temp = this.cards[i];
    this.cards[i] = this.cards[j];
    this.cards[j] = temp;
  }
};

Deck.prototype.draw = function (numberOfCards) {
  return this.cards.splice(0,numberOfCards);
};

module.exports = Deck;