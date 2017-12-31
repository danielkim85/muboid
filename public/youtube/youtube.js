angular.module('youtube', [])
  .directive('youtubePlayer', function($timeout,$q,$window){
    return{
      scope:{
        id:'@',
        videoId:'@',
        playing:'@'
      },
      templateUrl: 'youtube/youtubePlayer.tpl.html',
      link: function($scope,$element){

        //consts
        const START = 30;
        const END = 90;

        var player;
        var playerReady = false;
        var isBuffering = true;
        var timer;

        var playerOptions = {
          'startSeconds': START,
          'endSeconds': END
        };

        var containerOptions = {
          height: '360',
          width: '640',
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
          //TODO call $parent scope function directly
          $scope.$emit('tikTok',elapsed);
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
            player.seekTo(30);
          },2000);
        }

        function queueVideo(videoId){
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

        $scope.$on('youtubeReady', function (event, data) {
          player = new YT.Player($element.children()[0], containerOptions);
        });
      }
    }
  }).factory('youtubeFactory', function($http,$q,$window){

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

    const APIURL = 'https://www.googleapis.com/youtube/v3/';
    const APIKEY = 'AIzaSyAE_DMpfeQMKpKANohlNJMcgcwVpsummxo';


    const TARGET_LENGTH = 65;

    const MAGIC_WORD = 'vevo';

    var factory = {};
    var data = [];

    var playlistsUrl = APIURL + 'playlists&key=' + APIKEY;
    var searchUrl = APIURL + 'videos?part=snippet&chart=mostPopular&maxResults=50&regionCode=US&videoCategoryId=10&key=' + APIKEY;

    function doPopulatePlaylist(def,searchUrl_){
      searchUrl_ = searchUrl_ === undefined ? searchUrl : searchUrl_;
      $http.get(searchUrl_)
        .then(function(response){

          //do some processing below
          response.data.items.forEach(function(item){
            if(shouldAddtoPlaylist(item)){
              data.push(item);
            }
          });

          if(data.length >= TARGET_LENGTH){
            def.resolve(data);
          }
          else{
            searchUrl_ = searchUrl + '&pageToken=' + response.data.nextPageToken;
            doPopulatePlaylist(def,searchUrl_);
          }
        },function(response){
          console.error(response);
        });
    }
    factory.populatePlaylist = function(searchUrl_){
      data = [];
      const def = $q.defer();
      doPopulatePlaylist(def);
      return def.promise;
    };

    factory.getPlaylists = function($scope){
      const def = $q.defer();
      if(!$scope.signedIn){
        gapi.auth2.getAuthInstance().signIn();
        $scope.$parent.action = 'playlists';
      }
      else {
        gapi.client.youtube.playlists.list({
          'part': 'snippet',
          'mine': true
        }).then(function (response) {
          def.resolve(response.result.items);
        });
      }
      return def.promise;
    };
    function doGetPlaylist(def,playlistId,nextPageToken){
      var params = {
        'part': 'id,snippet',
        'maxResults' : 50,
        'playlistId': playlistId
      };
      if(nextPageToken !== undefined){
        params.pageToken = nextPageToken;
      }
      gapi.client.youtube.playlistItems.list(params)
        .then(function (response) {
          response.result.items.forEach(function(item){
            item.id = item.snippet.resourceId.videoId;
            data.push(item)
          });
          if(response.result.nextPageToken === undefined){
            def.resolve(response.result.items);
          }
          else{
            doGetPlaylist(def,playlistId,response.result.nextPageToken);
          }
      });
    }

    factory.getPlaylist = function($scope,playlistId){
      data = [];
      const def = $q.defer();
      if(!$scope.signedIn){
        gapi.auth2.getAuthInstance().signIn();
        $scope.$parent.action = 'playlist';
      }
      else {
        doGetPlaylist(def,playlistId);
      }
      return def.promise;
    };

    return factory;
  });