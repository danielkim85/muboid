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

angular.module('welcome', ['youtube'])
  .directive('welcome', function(youtubeFactory){
    return{
      scope:{
      },
      templateUrl: 'welcome/welcome.tpl.html',
      link: function($scope){

        var socket = $scope.$parent.socket;

        $scope.create = function(){
          socket.emit('create');
        };

        socket.on('created', function(roomName){
          $scope.$parent.roomName = roomName;
          $scope.$parent.wait = true;
          $scope.$parent.start();
        });

        $scope.getPlaylist = function(playlistId){
          $scope.$parent.wait = true;
          $scope.$parent.playlistReview = true;
          youtubeFactory.getPlaylist($scope.$parent, playlistId)
            .then(function (songs) {
              $scope.$parent.playlistId = playlistId;
              $scope.$parent.playlist = songs;
              $scope.$parent.wait = false;
            });
        };

        $scope.$on('getPlaylist', function () {
          $scope.getPlaylist();
        });

        $scope.random = function(){
          $scope.$parent.wait = true;
          $scope.$parent.playlistReview = true;
          youtubeFactory.populatePlaylist($scope.$parent)
            .then(function (data) {
              console.info('playlist size ' + data.length);
              $scope.$parent.playlist = shuffle(data);
              $scope.$parent.wait = false;
            });
        };

        $scope.$on('random', function () {
          $scope.random();
        });

        $scope.getPlaylists = function(){
          youtubeFactory.getPlaylists($scope.$parent)
            .then(function (data) {
              $scope.playlists = data;
            });
        };

        $scope.$on('getPlaylists', function () {
          $scope.getPlaylists();
        });

        $scope.join = function(joinRoomName){
          socket.emit('join',joinRoomName);
          $scope.$parent.roomName = joinRoomName;
        };

        socket.on('joined', function(response){
          if(!response.success){
            $scope.errMsg = response.msg;
            return;
          }
          $scope.errMsg = false;
          $scope.$parent.guest = true;
          $scope.$parent.playlist = response.msg;
          $scope.$apply();
        });

        var duration_ = 60;
        $scope.changeDuration = function(duration){
          if(duration === DEFAULT_MAX){
            $('#duration').slider('setValue', DEFAULT_MAX);
          }
          duration_ = duration;
          var display = duration === DEFAULT_MAX ? 'Max' : duration + ' seconds';
          $scope.duration = display;
          START = duration === DEFAULT_MAX ? 0 : START;
          END = duration === DEFAULT_MAX ? 0 : START + duration;
        };

        $('#duration').slider({
          formatter: function(value) {
            return value === DEFAULT_MAX ? 'Max' : value + ' seconds';
          }
        });

        $('#duration').on("slide", function(slideEvt) {
          if(duration_ !== slideEvt.value){
            $scope.changeDuration(slideEvt.value);
            $scope.$apply();
          }
        });
        $scope.changeDuration(duration_);
      }
    }
  });