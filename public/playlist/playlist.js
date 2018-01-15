angular.module('playlist', [])
  .directive('playlist', function(youtubeFactory){
    return{
      scope:{
        playlistId:'@'
      },
      templateUrl: 'playlist/playlist.tpl.html',
      link: function($scope){

        var socket = $scope.$parent.socket;

        $scope.start = function(){
          $scope.$parent.wait = true;
          $scope.$parent.user = {
            name:'owner',
            socketId:socket.id
          };
          var roomConfig = {
            owner : $scope.$parent.user,
            adminCode : $scope.$parent.adminCode,
            guestPerm : $scope.$parent.guestPerm
          };
          socket.emit('create',roomConfig);
        };

        $scope.manage = function(){
          window.open('https://www.youtube.com/playlist?list=' + $scope.playlistId);
        };

        $scope.refresh = function(playlistId){
          $scope.$parent.$wait = true;
          youtubeFactory.getPlaylist($scope.$parent, playlistId)
            .then(function (songs) {
              $scope.$parent.playlistId = playlistId;
              $scope.$parent.playlist = songs;
              $scope.$parent.$wait = false;
            });
        };

        $scope.queue = function(song){
          $scope.searchTerm = '';
          var index = $scope.$parent.roomName || $scope.$parent.guest ? 2 : 0;
          socket.emit('addSong',$scope.$parent.roomName, index, song, $scope.$parent.user);
          $scope.$parent.playlist.splice(index,0,song);
        };

        $scope.remove = function(index){
          socket.emit('removeSong',$scope.$parent.roomName, index, $scope.$parent.user);
          $scope.$parent.playlist.splice(index,1);
        };

        $scope.$watch('searchTerm',function(newValue){
          if(newValue && newValue.length > 2){
            youtubeFactory.search($scope.$parent,newValue)
              .then(function(response){
                $scope.searchResult = response;
              });
          }
          else{
            $scope.searchResult = [];
          }
        });

        $(document).keyup(function(e) {
          if (e.keyCode == 27) {
            $scope.searchTerm = '';
          }
        });


        socket.on('playlistUpdated', function(response){
          $scope.$parent.playlist = response;
          $scope.$parent.$apply();
        });

        socket.on('gameover', function(){
          $scope.$parent.gameover = true;
          $scope.$parent.$apply();
        });

      }
    };
  });