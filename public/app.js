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

(function() {
  var app = angular.module('MuBoidApp', ['youtube','clock','welcome','footer']);
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
      } else {
        authorizeButton.style.display = 'block';
        signoutButton.style.display = 'none';
      }
      $scope.wait = false;
    }

    $scope.playlist = [];

    $scope.seconds = 0;
    $scope.minutes = 0;

    var terminate = false;
    function doSwitch(){
      if(terminate){
        $scope.gameover = true;
        return;
      }
      if($scope.playlist.length <= 1){
        terminate = true;
      }
      $scope.playing1 = !$scope.playing1;
      $scope.playing2 = !$scope.playing1;
      if($scope.playing1){
        $scope.videoId2 = $scope.playlist.pop().id;
      }
      else{
        $scope.videoId1 = $scope.playlist.pop().id;
      }
      $scope.$apply();
      $scope.minutes++;
    }

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

    $scope.random = function(){
      //TODO error handling needed
      youtubeFactory.populatePlaylist()
        .then(function (data) {
          console.warn(data);
          console.info('playlist size ' + data.length);
          $scope.playlist = shuffle(data);
          $scope.start();
        });
    }

    //firestarter
    $scope.start = function(){
      $scope.wait = false;
      $scope.videoId1 = $scope.playlist.pop().id;
      $scope.playing1 = true;
      $scope.videoId2 = $scope.playlist.pop().id;
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
  });
})();