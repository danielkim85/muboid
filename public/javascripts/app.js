function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

(function() {
  var app = angular.module('MuBoidApp', ['youtube','clock']);
  app.controller('MuBoidCtrl', function ($scope, $timeout,$window,youtubeFactory) {

    var playlist = [];

    $scope.seconds = 0;
    $scope.minutes = 0;

    function doSwitch(){
      $scope.playing1 = !$scope.playing1;
      $scope.playing2 = !$scope.playing1;
      if($scope.playing1){
        $scope.videoId2 = playlist.pop().id;
      }
      else{
        $scope.videoId1 = playlist.pop().id;
      }
      $scope.$apply();
      $scope.minutes++;
    }

    $scope.$on('tikTok', function (event, data) {
      $scope.seconds = data;
    });

    $scope.$on('youtubePlayerStateChanged', function (event, data) {
      if(data.status === YT.PlayerState.ENDED){
        doSwitch();
      }
    });

    $window.onYouTubeIframeAPIReady = function() {
      $scope.$broadcast('youtubeReady');
    };

    youtubeFactory.populatePlaylist()
      .then(function (data) {
        console.info('playlist size ' + data.length);
        playlist = shuffle(data);
        $scope.videoId1 = playlist.pop().id;
        $scope.playing1 = true;
        $scope.videoId2 = playlist.pop().id;
        $scope.playing2 = false;
      });
  });
})();