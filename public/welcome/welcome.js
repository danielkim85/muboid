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
  .directive('welcome', function(youtubeFactory){
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
          angular.element($event.currentTarget).addClass('active');
          myPlaylistId = playlistId;
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

          socket.emit('join',joinRoomName,{
            name:$scope.username,
            socketId:socket.id
          });
        };

        //server tells me i have joined a room
        socket.on('joined', function(response){
          if(!response.success){
            $scope.errMsg = response.msg;
            $scope.$apply();
            return;
          }
          $scope.$parent.user = response.data.user;
          $scope.$apply();
          $scope.errMsg = false;
          $scope.$parent.guest = true;
          $scope.$parent.playlist = response.data.playlist;
          $scope.$parent.roomName = response.data.roomName;
          $scope.$parent.guestPerm  = response.data.guestPerm;
          $scope.$apply();
          $scope.$parent.registerSort();
        });

        $scope.back = function(){
          $scope.joinDetail = false;
          $scope.createDetail = false;
        };

        //default slider value
        var duration_ = 60;
        //slider control
        $scope.changeDuration = function(duration){
          if(duration === DEFAULT_MAX){
            $('#duration').bootstrapSlider('setValue', DEFAULT_MAX);
          }
          duration_ = duration;
          var display = duration === DEFAULT_MAX ? 'Max' : duration + ' seconds';
          $scope.duration = display;
          START = duration === DEFAULT_MAX ? 0 : START;
          END = duration === DEFAULT_MAX ? 0 : START + duration;
        };

        $('#duration').bootstrapSlider({
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

        //set the slider default
        $scope.changeDuration(duration_);
      }
    };
  });