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

          if($scope.$parent.playlist.length === 0){
            $scope.$parent.random();
            return;
          }
          $scope.$parent.start();
        });

        $scope.join = function(){
          socket.emit('join','roomName')
        };

        socket.on('joined', function(roomName){
          console.info(roomName);
        });

        $scope.getPlaylist = function(playlistId){
          $scope.$parent.$wait = true;
          youtubeFactory.getPlaylist($scope.$parent, playlistId)
            .then(function (songs) {
              $scope.$parent.playlist = songs;
              $scope.create();
            });
        };

        $scope.$on('getPlaylist', function (event, data) {
          $scope.getPlaylist();
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
      }
    }
  });