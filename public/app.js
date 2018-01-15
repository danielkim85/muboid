
var app = angular.module('MuBoidApp', ['youtube','clock','welcome','footer','playlist']);
app.controller('MuBoidCtrl', function ($scope, $timeout,$window) {
  $scope.wait = true;

  //youtube api functions
  $scope.signedIn = false;

  var authorizeButton = document.getElementById('authorize-button');
  var signoutButton = document.getElementById('signout-button');

  function handleAuthClick() {
    gapi.auth2.getAuthInstance().signIn();
  }

  function handleSignoutClick() {
    gapi.auth2.getAuthInstance().signOut();
  }

  function initClient() {
    gapi.client.init({
      discoveryDocs: DISCOVERY_DOCS,
      clientId: CLIENT_ID,
      scope: SCOPES
    }).then(function () {
      // Listen for sign-in state changes.
      gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
      // Handle the initial sign-in state.
      updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
      authorizeButton.onclick = handleAuthClick;
      signoutButton.onclick = handleSignoutClick;
    });
  }

  $window.handleClientLoad = function() {
    gapi.load('client:auth2', initClient);
  };

  function updateSigninStatus(isSignedIn) {
    $scope.signedIn = isSignedIn;
    $scope.$apply();
    if (isSignedIn) {
      authorizeButton.style.display = 'none';
      signoutButton.style.display = 'block';
      if($scope.action === 'playlists'){
        $scope.$broadcast('getPlaylists');
      }
      else if($scope.action === 'playlist'){
        $scope.$broadcast('getPlaylist');
      }
      else if($scope.action === 'random'){
        $scope.$broadcast('random');
      }
    } else {
      authorizeButton.style.display = 'block';
      signoutButton.style.display = 'none';
    }
    $scope.wait = false;
    $scope.$apply();
  }

  $scope.playlist = [];

  $scope.seconds = 0;
  $scope.minutes = 0;

  $scope.updateClock = function(elapsed) {
    if(END === 0){
      $scope.minutes = Math.floor(elapsed/60);
      $scope.seconds = elapsed%60;
    }
    else{
      $scope.seconds = elapsed;
    }
  };

  $scope.$on('youtubePlayerStateChanged', function (event, data) {
    if(data.status === YT.PlayerState.ENDED){
      doSwitch();
    }
  });

  $window.onYouTubeIframeAPIReady = function() {
    $scope.$broadcast('youtubeReady');
  };

  $scope.sortComplete = function(){
    var playlist = [];
    $('playlist #songContainer div').each(function(){
      var videoId = $(this).find('.titleContainer').attr('videoId');
      var title = $(this).find('.title').text().trim();
      if(videoId){
        var songOwner = $(this).find('.titleContainer').attr('songOwner');
        var data = {
          id:videoId,
          title:title,
          owner:JSON.parse(songOwner)
        };
        playlist.push(data);
      }
    });
    $scope.playlist = playlist;
    $scope.$apply();
    $scope.sortPlaylist();
  };

  $scope.registerSort = function(destroy){

    if(!$scope.isAdmin && $scope.guest && !$scope.guestPerm.sortSong){
      return;
    }

    if(destroy) {
      $("#songContainer").sortable('destroy');
    }
    $("#songContainer").sortable({
      items: "> div:not(.locked)",
      tolerance: 'pointer',
      revert: 'invalid',
      placeholder: 'span2 well placeholder tile',
      forceHelperSize: true,
      update: function(event,ui){
        $scope.sortComplete();
      }
    });
  };

  $scope.sortPlaylist = function(){
    if($scope.roomName){
      $scope.socket.emit('sortPlaylist',$scope.roomName, $scope.playlist, $scope.user);
    }
  };

  //song changes from player 1 to player 2
  function doSwitch(){
    if($scope.playlist.length <= 1){
      $scope.gameover = true;
      return;
    }

    //remove the first song
    $scope.socket.emit('removeSong',$scope.roomName, 0, $scope.user);
    $scope.playlist.shift();

    $scope.playing1 = !$scope.playing1;
    $scope.playing2 = !$scope.playing1;
    //do not buffer on last song
    if($scope.playlist.length >= 2) {
      if ($scope.playing1) {
        $scope.videoId2 = $scope.playlist[1].id;
      }
      else {
        $scope.videoId1 = $scope.playlist[1].id;
      }
    }

    $scope.$apply();
    if(END - START === 60){
      $scope.minutes++;
    }
    $scope.registerSort(true);
  }

  //firestarter
  $scope.start = function(){
    $scope.socket.emit('uploadPlaylist',$scope.roomName, $scope.playlist,$scope.user);
    $scope.wait = false;
    $scope.videoId1 = $scope.playlist[0].id;
    $scope.playing1 = true;
    $scope.videoId2 = $scope.playlist[1].id;
    $scope.playing2 = false;

    $scope.$apply();
    $scope.registerSort();
  };

  //socket
  var protocol = "http://";
  var host =  window.location.hostname;
  var port =  host === 'localhost' ? '3000' : '80';
  $scope.socket = io.connect(protocol + host + ':' + port,{
    'sync disconnect on unload': true
  });

  window.onbeforeunload = function() {
    $scope.socket.emit('leave',$scope.roomName,$scope.user,!$scope.guest);
    return undefined;
  };

  //yt script injection
  var script = document.createElement("script");
  script.setAttribute("type", "text/javascript");
  script.setAttribute('src','https://apis.google.com/js/api.js');
  script.setAttribute('onload','this.onload=function(){};handleClientLoad()');
  script.setAttribute('onreadystatechange',"if (this.readyState === 'complete') this.onload()");
  document.body.appendChild(script);
});
