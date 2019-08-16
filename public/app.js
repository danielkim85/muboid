
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
    window.location.reload();
  }

  function initClient() {
    gapi.client.init({
      discoveryDocs: DISCOVERY_DOCS,
      clientId: CLIENT_ID,
      //fetch_basic_profile:true
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
      var profile = gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile();
      $scope.name = profile.getName();
      $scope.username = profile.getId();
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
      else if($scope.action === 'join'){
        $scope.$broadcast('join');
      }
      else if($scope.action === 'myRooms'){
        $scope.$broadcast('myRooms');
      }
    } else {
      authorizeButton.style.display = 'block';
      signoutButton.style.display = 'none';
    }
    $scope.wait = false;
    $scope.$apply();
  }

  $scope.playlist = [];
  $scope.history = [];

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
      $scope.doSwitch();
    }
  });

  $window.onYouTubeIframeAPIReady = function() {
    $scope.youtubeReady = true;
  };

  var tag = document.createElement('script');
  tag.src = "https://www.youtube.com/iframe_api";
  var firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

  $scope.sortComplete = function(){
    var playlist = [];

    $('playlist #songContainer .song').each(function(){
      var videoId = $(this).find('.titleContainer').attr('videoId');
      var title = $(this).find('.title').text().trim();
      if(videoId){
        var songOwner = $(this).find('.titleContainer').attr('songOwner');
        var data = {
          id:videoId,
          title:title,
          owner:JSON.parse(songOwner),
          likes:[],
          hates:[]
        };
        playlist.push(data);
      }
    });
    $scope.playlist = playlist;
    $scope.$apply();
    $scope.sortPlaylist();
  };

  $scope.deregisterSort = function() {
    $("#songContainer").sortable('destroy');
  };

  $scope.registerSort = function(destroy){
    //if not admiin, and guest, and no sortSong
    if(!$scope.isAdmin && $scope.guest && !$scope.guestPerm.sortSong){
      return;
    }
    //if not admin and room is locked
    if(!$scope.isAdmin && $scope.isRoomLocked){
      return;
    }

    if(destroy) {
      $scope.deregisterSort();
    }

    $("#songContainer").sortable({
      items: "> div:not(.locked)",
      handle: '.handle',
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
  $scope.doSwitch = function(){
    if($scope.playlist.length <= 1){
      $scope.gameover = true;
      return;
    }

    //remove the first song
    $scope.socket.emit('removeSong',$scope.roomName, 0, $scope.user);
    $scope.history.push($scope.playlist[0]);
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

    if(END - START === 60){
      $scope.seconds = 0;
      $scope.minutes++;
    }
    $scope.registerSort(true);
  };

  //firestarter
  $scope.start = function(){
    $('body').chardinJs('stop');
    $scope.fire = true;
    $scope.fireStarted = true;
    $scope.socket.emit('startFire',$scope.roomName);
    $scope.videoId1 = $scope.playlist[0].id;
    $scope.playing1 = true;
    $scope.videoId2 = $scope.playlist[1].id;
    $scope.playing2 = false;

    $scope.registerSort();
  };

  $scope.initSocket = function(callback){
    //socket
    var protocol = "//";
    var host =  window.location.hostname;
    var port =  host === 'localhost' ? '3000' : '80';
    $scope.socket = io.connect(protocol + host + ':' + port,{
      'sync disconnect on unload': true,
      secure:true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax : 5000,
      reconnectionAttempts: Infinity
    });

    $scope.socket.on('connect', function(){
      if($scope.roomName && $scope.guest) {
        $scope.wait = true;
        $scope.socket.emit('join', $scope.roomName, {
          name: $scope.name,
          socketId: $scope.username
        });
      }
    });

    $scope.socket.on('disconnect', function(){
      if(!$scope.guest){
        window.location.reload();
      }
      else{
        $scope.wait = true;
        $scope.$apply();
      }
    });

    $scope.socket.on('fireStarted', function(){
      $scope.fireStarted = true;
      $scope.$apply();
    });

    $scope.socket.on('fastForward',function(){
      if($scope.fire){
        $scope.doSwitch();
      }
    });

    $scope.$broadcast('socketInit');
    if(callback){
      callback();
    }
  };

  window.onbeforeunload = function() {
    $scope.socket.on('connect', function(){
      //do nothing
    });
    $scope.socket.emit('leave',$scope.roomName.toString(),$scope.user,$scope.isAdmin);
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
