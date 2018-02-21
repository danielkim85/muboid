//helper function to shuffle array
function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;
  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
  return array;
}

angular.module('welcome', ['youtube'])
  .directive('welcome', function($timeout,youtubeFactory){
    return{
      scope:{
      },
      templateUrl: 'welcome/welcome.tpl.html',
      link: function($scope){

        var socket = $scope.$parent.socket;

        //server tells me room has been created
        socket.on('created', function(roomName){
          $scope.$parent.roomName = roomName;
          $scope.$parent.wait = true;
          $scope.$parent.start();
          $scope.$apply();
        });

        $scope.$parent.guestPerm.addSong = true;
        $scope.$parent.guestPerm.sortSong = true;
        var myPlaylistId;
        var isRandom = true;
        $scope.start = function(){
          $scope.$parent.registerSort();
          if(!$scope.createDetail) {
            $scope.createDetail = true;
            $scope.getPlaylists();
            return;
          }

          if(isRandom){
            $scope.random();
            return;
          }

          $scope.getPlaylist();
        };

        //get songs for single playlist
        $scope.getPlaylistId = function(playlistId,$event,random){
          isRandom = random;
          $('welcome .list-group-item').removeClass('active');
          if(random){
            $('welcome .list-group-item:first').addClass('active');
          }
          else {
            $('welcome .list-group-item[playlistId="' + playlistId + '"]').addClass('active');
          }
          myPlaylistId = playlistId;
        };

        $scope.searchedPlaylistClicked = function(playlist){
          var playlistId = playlist.id.playlistId;
          playlist.id = playlistId;
          $scope.playlists.push(playlist);
          $scope.searchedPlaylist = [];
          $scope.qPlaylist = '';
          $timeout(function(){
            $scope.getPlaylistId(playlistId);
          });
        };
        $scope.getPlaylist = function(){
          $scope.$parent.user = {socketId:socket.id};
          $scope.$parent.wait = true;
          $scope.$parent.playlistReview = true;
          youtubeFactory.getPlaylist($scope.$parent, myPlaylistId)
            .then(function (songs) {
              $scope.$parent.playlistId = myPlaylistId;
              $scope.$parent.playlist = songs;
              $scope.$parent.wait = false;
            });
        };

        $scope.$on('getPlaylist', function () {
          $scope.getPlaylist();
        });

        //create random songs from youtube
        $scope.random = function(){
          $scope.$parent.user = {socketId:socket.id};
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

        //get user's list of playlists
        $scope.getPlaylists = function(){
          $scope.$parent.wait = true;
          youtubeFactory.getPlaylists($scope.$parent)
            .then(function (data) {
              $scope.$parent.wait = false;
              $scope.playlists = data;
            });
        };

        $scope.$on('getPlaylists', function () {
          $scope.getPlaylists();
        });

        $scope.join = function(joinRoomName){
          if(!joinRoomName){
            $scope.joinDetail = true;
            return;
          }
          if(!$scope.$parent.signedIn){
            gapi.auth2.getAuthInstance().signIn().then(
              function(success) {
                $scope.$parent.action = 'join';
              },
              function(error) {
                window.location.reload();
              }
            );
          }
          else {
            $scope.$parent.wait = true;
            socket.emit('join',joinRoomName,{
              name:$scope.$parent.name,
              socketId:$scope.$parent.username
            },$scope.adminCode);
          }

        };

        $scope.$on('join', function () {
          $scope.join($scope.joinRoomName);
        });

        //server tells me i have joined a room
        socket.on('joined', function(response){
          console.warn(response);
          if(!response.success){
            $scope.errMsg = response.msg;
            $scope.$apply();
            return;
          }

          $scope.$parent.isRoomLocked = response.data.locked;
          $scope.$parent.isAdmin = response.data.isAdmin;
          $scope.$parent.user = response.data.user;

          $scope.errMsg = false;
          $scope.$parent.guest = true;
          $scope.$parent.playlist = response.data.playlist;
          $scope.$parent.roomName = response.data.roomName;
          $scope.$parent.guestPerm  = response.data.guestPerm;
          $scope.$parent.history = response.data.history;

          $scope.$parent.wait = false;
          $scope.$apply();
          $scope.$parent.registerSort();

          var elem = $('.history:last').length > 0 ? $('.history:last')[0] :$('.song:first')[0];
          elem.scrollIntoView();
        });

        $scope.manage = function(username){
          window.open('https://www.youtube.com/user/' + username + '/playlists');
        };


        $scope.back = function(){
          $scope.joinDetail = false;
          $scope.createDetail = false;
        };

        $scope.$watch('qPlaylist',function(newValue){
          if(newValue && newValue.length > 2){
            youtubeFactory.searchPlaylist($scope.$parent,newValue)
              .then(function(response){
               $scope.searchedPlaylist = response;
              });
          }
          else{
            $scope.searchedPlaylist = [];
          }
        });

        //slider control
        var duration_ = [30,90];
        $scope.changeDuration = function(duration){
          duration_ = duration;
          if(duration[0] === 0 && duration[1] === DEFAULT_MAX){
            $('#duration').bootstrapSlider('setValue', [0,DEFAULT_MAX]);
          }
          var display = duration[0] + 's - ' + (duration[1] === 135 ? 'MAX' : duration[1] + 's');
          $scope.duration = display;
          START = duration[0];
          END = duration[1] === DEFAULT_MAX ? 0 : duration[1];
        };

        $('#duration').bootstrapSlider({
          formatter: function(value) {
            return value;
          }
        });

        $('#duration').on("slide", function(slideEvt) {
          if(duration_[0] !== slideEvt.value[0] || duration_[1] !== slideEvt.value[1]){
            $scope.changeDuration(slideEvt.value);
            $scope.$apply();
          }
        });

        $scope.changeDuration(duration_);
      }
    };
  });