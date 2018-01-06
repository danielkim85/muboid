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
          socket.emit('create');
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
          var index = $scope.$parent.go || $scope.$parent.guest ? 2 : 0;
          $scope.$parent.playlist.splice(index,0,song);
          if($scope.$parent.go){
            $scope.$parent.uploadPlaylist();
          }
        };

        $scope.remove = function(index){
          $scope.$parent.playlist.splice(index,1);
          $scope.$parent.uploadPlaylist();
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

        socket.on('joined', function(response){
          if(!response.success){
            $scope.errMsg = response.msg;
            return;
          }
          $scope.errMsg = false;
          $scope.$parent.guest = true;
          $scope.$parent.playlist = response.msg;
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
    }
  });