
var app = angular.module('MuBoidApp', ['youtube','clock','welcome','footer','playlist']);
app.controller('MuBoidCtrl', function ($scope, $timeout,$window,youtubeFactory) {

  $scope.wait = true;

  //youtube api functions
  const CLIENT_ID = '586555634098-j5ul1cm0c5bj7vo87d8u5volijrneh40.apps.googleusercontent.com';
  const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest"];
  const SCOPES = 'https://www.googleapis.com/auth/youtube.readonly';
  $scope.signedIn = false;

  var authorizeButton = document.getElementById('authorize-button');
  var signoutButton = document.getElementById('signout-button');

  function handleAuthClick(event) {
    gapi.auth2.getAuthInstance().signIn();
  }

  function handleSignoutClick(event) {
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
  }

  $scope.playlist = [];

  $scope.seconds = 0;
  $scope.minutes = 0;

  $scope.$on('tikTok', function (event, data) {
    $scope.seconds = data;
  });

  $scope.$on('youtubePlayerStateChanged', function (event, data) {
    if(data.status === YT.PlayerState.ENDED){
      doSwitch();
    }
  });

  $window.onYouTubeIframeAPIReady = function() {
    $scope.$broadcast('youtubeReady');
  };

  function doSwitch(){
    if($scope.playlist.length <= 1){
      $scope.gameover = true;
      return;
    }

    $scope.playlist.shift();
    $scope.socket.emit('uploadPlaylist',{roomName:$scope.roomName, playlist:$scope.playlist});

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
    //$scope.$broadcast('songChanged', nowVideoId);
    $scope.$apply();
    $scope.minutes++;
  }

  //firestarter
  $scope.start = function(){
    $scope.socket.emit('uploadPlaylist',{roomName:$scope.roomName, playlist:$scope.playlist});
    $scope.wait = false;
    //$scope.$broadcast('songChanged', $scope.playlist[0].id);
    $scope.videoId1 = $scope.playlist[0].id;
    $scope.playing1 = true;
    $scope.videoId2 = $scope.playlist[1].id;
    $scope.playing2 = false;
    $scope.go = true;
  };

  //socket
  var protocol = "http://";
  var host =  window.location.hostname;
  var port =  host === 'localhost' ? '3000' : '80';
  $scope.socket = io.connect(protocol + host + ':' + port,{
    'sync disconnect on unload': true
  });


  window.onbeforeunload = function() {
    $scope.socket.emit('leave',$scope.roomName,!$scope.guest);
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
