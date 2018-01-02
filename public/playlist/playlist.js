angular.module('playlist', [])
  .directive('playlist', function(){
    return{
      scope:{
        playlistId:'@'
      },
      templateUrl: 'playlist/playlist.tpl.html',
      link: function($scope,$element){

        var socket = $scope.$parent.socket;

        $scope.start = function(){
          socket.emit('create');
        };

        $scope.manage = function(){
          window.open('https://www.youtube.com/playlist?list=' + $scope.playlistId);
        };

        $scope.$on('songChanged', function (event, data) {
          //do something?
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
        });

        socket.on('gameover', function(){
          $scope.$parent.gameover = true;
        });
      }
    }
  });