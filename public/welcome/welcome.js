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
      link: function($scope,$element){

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
          $scope.$parent.$wait = true;
          youtubeFactory.getPlaylist($scope.$parent, playlistId)
            .then(function (songs) {
              random = false;
              $scope.$parent.playlistId = playlistId;
              $scope.$parent.playlist = songs;
              //$scope.create();
            });
        };

        $scope.$on('getPlaylist', function (event, data) {
          $scope.getPlaylist();
        });

        $scope.random = function(){
          youtubeFactory.populatePlaylist($scope.$parent)
            .then(function (data) {
              console.info('playlist size ' + data.length);
              $scope.$parent.playlist = shuffle(data);
              $scope.create();
            });
        };

        $scope.$on('random', function (event, data) {
          $scope.random();
        });

        $scope.getPlaylists = function(){
          youtubeFactory.getPlaylists($scope.$parent)
            .then(function (data) {
              $scope.playlists = data;
            });
        };

        $scope.$on('getPlaylists', function (event, data) {
          $scope.getPlaylists();
        });

        $scope.join = function(joinRoomName){
          socket.emit('join',joinRoomName);
        };

        socket.on('joined', function(response){
          if(!response.success){
            $scope.errMsg = response.msg;
            return;
          }
          $scope.errMsg = false;
          $scope.$parent.guest = true;
          $scope.$parent.playlist = response.msg;
        });

      }
    }
  });