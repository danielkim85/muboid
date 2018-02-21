angular.module('playlist', [])
  .directive('playlist', function(youtubeFactory){
    return{
      scope:{
        playlistId:'@'
      },
      templateUrl: 'playlist/playlist.tpl.html',
      link: function($scope){

        var socket;
        $scope.$on('socketInit', function () {
          socket = $scope.$parent.socket;

          socket.on('songLiked', function(response){
            if(response.id === $scope.$parent.playlist[0].id){
              $scope.$parent.playlist[0].likes = response.likes;
              $scope.$parent.playlist[0].hates = response.hates;
              $scope.$apply();
            }
          });

          socket.on('locked', function(response){
            $scope.$parent.isRoomLocked = response.data;
            $scope.$parent.$apply();

            if($scope.$parent.isAdmin || !$scope.$parent.guest) {
              //if admin or not a guest do nothing
              return;
            }
            if($scope.$parent.isRoomLocked){
              //disable sort/remove/add/search
              $scope.$parent.deregisterSort();
              $scope.searchResult = [];
            }
            else{
              //enable sort/remove/add/search
              $scope.$parent.registerSort(false);
            }
          });

          socket.on('playlistUpdated', function(response){
            $scope.$parent.playlist = response.playlist;
            $scope.$parent.history = response.history;
            $scope.$parent.$apply();
          });

          socket.on('gameover', function(){
            $scope.$parent.gameover = true;
            $scope.$parent.$apply();
          });

        });

        $scope.start = function(){
          $scope.$parent.wait = true;
          $scope.$parent.user = {
            name:'owner',
            socketId:$scope.$parent.username
          };
          var roomConfig = {
            owner : $scope.$parent.user,
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
          var songCopy = $.extend(true,{},song);
          $scope.searchTerm = '';
          var insertPosition = $scope.$parent.playlist.length >= 10 ? 10 : 0;
          var index = $scope.$parent.roomName || $scope.$parent.guest ? 5 : insertPosition;

          if(!songCopy.owner.name){
            songCopy.owner.name = 'host';
          }
          socket.emit('addSong',$scope.$parent.roomName, index, songCopy, $scope.$parent.user);
          $scope.$parent.playlist.splice(index,0,songCopy);
        };

        $scope.remove = function(index){
          socket.emit('removeSong',$scope.$parent.roomName, index, $scope.$parent.user,true);
          $scope.$parent.playlist.splice(index,1);
        };

        $scope.expression = {
          liked : null,
          songId : null
        };

        $scope.likeSong = function($event,like){
          if(!angular.element($event.currentTarget).hasClass('inactive')){
            $scope.expression.songId = $scope.$parent.playlist[0].id;
            $scope.expression.liked = like;
            socket.emit('likeSong',$scope.$parent.roomName, $scope.$parent.user, $scope.expression);
          }
        };

        $scope.lock = function(unlock){
          socket.emit('lockRoom',{
            roomName : $scope.$parent.roomName,
            user : $scope.$parent.user,
            unlock: unlock});
          $scope.$parent.isRoomLocked = !unlock;
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


        $scope.$watchGroup(['$parentgameover', '$parent.playlist'], function(newValues) {
          return;
          //experiment modal dialog
          if(!newValues[0] && newValues[1].length > 0){
            $( "playlist" ).dialog({
              height: 600,
              width:600,
              title:'Playlist'
            });
          }
          else{
            //hide
          }
        });
      }
    };
  });