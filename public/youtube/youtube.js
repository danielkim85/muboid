function htmlDecode(value) {
  return $("<textarea/>").html(value).text();
}

angular.module('youtube', [])
  .directive('youtubePlayer', function($timeout){
    return{
      scope:{
        id:'@',
        videoId:'@',
        playing:'@'
      },
      templateUrl: 'youtube/youtubePlayer.tpl.html',
      link: function($scope,$element){

        var player;
        var playerReady = false;
        var isBuffering = true;
        var timer;

        var containerOptions = {
          height: PLAYER_HEIGHT,
          width: PLAYER_WIDTH,
          playerVars: { 'autoplay': 0, 'controls': 0, 'rel': 0, 'showinfo': 0 },
          events: {
            'onReady': onReady,
            'onStateChange': onPlayerStateChange
            //TODO handle onError scenario
          }
        };

        function onPlayerStateChange(event){
          if((event.data === YT.PlayerState.PLAYING || event.data === YT.PlayerState.ENDED) && !isBuffering){
            //TODO call $parent scope function directly
            $scope.$emit('youtubePlayerStateChanged',{
              playerId: $scope.id,
              status: event.data
            });
          }
        }

        function onReady(){
          playerReady = true;
          if($scope.videoId === ''){
            return;
          }
          queueVideo($scope.videoId);
          if($scope.playing === 'false'){
            buffer();
          }
          else{
            play();
          }
        }

        function tikTok(){
          $timeout.cancel( timer );
          var elapsed = Math.ceil(player.getCurrentTime()) - START;
          $scope.$parent.updateClock(elapsed);
          timer = $timeout(tikTok,1000);
        }

        function play(){
          player.setVolume(100);
          isBuffering = false;
          $('#' + $scope.id).css('z-index',1);
          player.playVideo();
          timer = $timeout(tikTok,1000);
        }

        function buffer(){
          isBuffering = true;
          $('#' + $scope.id).css('z-index',0);
          player.setVolume(0);
          player.playVideo();
          $timeout(function(){
            player.pauseVideo();
            $timeout.cancel( timer );
            player.seekTo(START);
          },2000);
        }

        function queueVideo(videoId){

          var playerOptions = {
            'startSeconds': START
          };
          if(END >= 0){
            playerOptions.endSeconds = END;
          }

          playerOptions.videoId = videoId;
          player.cueVideoById(playerOptions);
        }

        $scope.$watch('videoId',function(newValue){
          if(playerReady) {
            queueVideo(newValue);
          }
        });

        $scope.$watch('playing',function(newValue){
          var playing = newValue === 'true';
          if(playing && playerReady){
            play();
          }
          else if(!playing && playerReady){
            buffer();
          }
        });

        var MAX_TRY = 10;
        var tried = 0;
        function checkYouTubeReady(){
          tried++;
          if($scope.$parent.youtubeReady){
            player = new YT.Player($element.children()[0], containerOptions);
          } else{
            if(tried <= MAX_TRY){
              $timeout(checkYouTubeReady,1000);
            }

          }
        }
        $timeout(checkYouTubeReady,1000);
      }
    };
  }).factory('youtubeFactory', function($http,$q){

    var factory = {};
    var data = [];

    //helper functions
    function matchTags(tags){
      if(tags === undefined){
        return false;
      }
      tags.forEach(function(tag){
        if(tag.toLowerCase().indexOf(MAGIC_WORD) > 0){
          return true;
        }
      });
      return false;
    }

    function shouldAddtoPlaylist(item){
      var channelTitle = item.snippet.channelTitle.toLowerCase();
      var description = item.snippet.description.toLowerCase();
      return (channelTitle.indexOf(MAGIC_WORD) > 0 ||
              description.indexOf(MAGIC_WORD) > 0 ||
              matchTags(item.snippet.tags)
      );
    }

    function doPopulatePlaylist($scope,def,nextPageToken){

      let params = {
        'part': 'snippet',
        'maxResults' : 50,
        'chart' : 'mostPopular',
        'regionCode' : 'US',
        'videoCategoryId' : 10
      };

      if(nextPageToken !== undefined){
        params.pageToken = nextPageToken;
      }

      //begin http workaround
      params.key = YOUTUBE_API_KEY;
      $http({
        method: 'GET',
        url: 'https://www.googleapis.com/youtube/v3/videos',
        params: params
      }).then(function successCallback(response) {
        response.data.items.forEach(function(item){
          if(shouldAddtoPlaylist(item)){
            data.push({
              id:item.id,
              owner:$scope.user,
              title:item.snippet.title,
              likes : [],
              hates : []
            });
          }
        });
        if(data.length >= TARGET_LENGTH){
          def.resolve(data);
        }
        else{
          doPopulatePlaylist($scope,def,response.data.nextPageToken);
        }
      }, function errorCallback(response) {
        console.error(response);
      });

      /* disabling gapi until verification

      gapi.client.youtube.videos.list(params).then(function (response) {
        //do some processing below
        response.result.items.forEach(function(item){
          if(shouldAddtoPlaylist(item)){
            data.push({
              id:item.id,
              owner:$scope.user,
              title:item.snippet.title,
              likes : [],
              hates : []
            });
          }
        });

        if(data.length >= TARGET_LENGTH){
          def.resolve(data);
        }
        else{
          doPopulatePlaylist($scope,def,response.result.nextPageToken);
        }
      });
      */
    }

    factory.populatePlaylist = function($scope){
      data = [];
      var def = $q.defer();
      if(!$scope.signedIn){
        gapi.auth2.getAuthInstance().signIn().then(
          function(success) {
            $scope.$parent.action = 'random';
          },
          function(error) {
            window.location.reload();
          }
        );
      }
      else{
        doPopulatePlaylist($scope,def);
      }
      return def.promise;
    };

    factory.getPlaylists = function($scope){
      var def = $q.defer();
      if(!$scope.signedIn){
        gapi.auth2.getAuthInstance().signIn().then(
          function(success) {
            $scope.$parent.action = 'playlists';
          },
          function(error) {
            window.location.reload();
          }
        );
      }
      else {
        gapi.client.youtube.playlists.list({
          'part': 'snippet',
          'mine': true
        }).then(function (response) {
          def.resolve(response.result.items);
        }, function(error){
          def.resolve([]);
        });
      }
      return def.promise;
    };

    function doGetPlaylist($scope,def,playlistId,nextPageToken){
      var params = {
        'part': 'snippet',
        'maxResults' : 50,
        'playlistId': playlistId
      };
      if(nextPageToken !== undefined){
        params.pageToken = nextPageToken;
      }
      gapi.client.youtube.playlistItems.list(params)
        .then(function (response) {
          response.result.items.forEach(function(item){
            data.push({
              id:item.snippet.resourceId.videoId,
              owner:$scope.user,
              title:item.snippet.title,
              likes : [],
              hates : []
            });
          });
          if(response.result.nextPageToken === undefined){
            def.resolve(data);
          }
          else{
            doGetPlaylist($scope,def,playlistId,response.result.nextPageToken);
          }
      });
    }

    factory.getPlaylist = function($scope,playlistId){
      data = [];
      var def = $q.defer();
      if(!$scope.signedIn){
        gapi.auth2.getAuthInstance().signIn().then(
          function(success) {
            $scope.$parent.action = 'playlist';
          },
          function(error) {
            window.location.reload();
          }
        );
      }
      else {
        doGetPlaylist($scope,def,playlistId);
      }
      return def.promise;
    };

    var maxResults = 10;
    factory.searchPlaylist = function($scope,q){
      data = [];
      var def = $q.defer();
      gapi.client.youtube.search.list({
        part: 'snippet',
        q: q,
        type: 'playlist',
        maxResults : maxResults
      })
        .then(function (response) {
          //for whatever reasons, it spills beyond the max results. so force return.
          for(var i = 0; i < maxResults; i++){
            data.push(response.result.items[i]);
          }
          def.resolve(data);
        });
      return def.promise;
    };

    factory.search = function($scope,q){
      data = [];
      const def = $q.defer();

      let params = {
        part: 'snippet',
        q: q,
        videoDuration: 'medium',
        videoCategoryId: 10,
        type: 'video',
        maxResults : maxResults
      };

      //begin http workaround
      params.key = YOUTUBE_API_KEY;
      $http({
        method: 'GET',
        url: 'https://www.googleapis.com/youtube/v3/search',
        params: params
      }).then(function successCallback(response) {
        response.data.items.forEach(function(item){
          data.push({
            id:item.id.videoId,
            title:htmlDecode(item.snippet.title),
            owner:$scope.user,
            likes : [],
            hates : []
          });
        });
        def.resolve(data);
      }, function errorCallback(response) {
        console.error(response);
      });

      /* disabling gapi until verification

      gapi.client.youtube.search.list({
        part: 'snippet',
        q: q,
        videoDuration: 'medium',
        videoCategoryId: 10,
        type: 'video',
        maxResults : maxResults
      })
        .then(function (response) {
          response.result.items.forEach(function(item){
            data.push({
              id:item.id.videoId,
              title:item.snippet.title,
              owner:$scope.user,
              likes : [],
              hates : []
            });
          });
          def.resolve(data);
        });
       */
      return def.promise;
    };

    return factory;
  });