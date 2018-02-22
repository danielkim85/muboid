angular.module('footer', [])
  .directive('footer', function($timeout){
    return{
      scope:{
      },
      templateUrl: 'footer/footer.tpl.html',
      link: function($scope){

        function isFullscreen(){
          return document.fullScreen ||
                 document.mozFullScreen ||
                 document.webkitIsFullScreen ||
                 document.msIsFullScreen;
        }

        //holy fuck this is ugly
        if (document.addEventListener){
          document.addEventListener('webkitfullscreenchange', fsChanged, false);
          document.addEventListener('mozfullscreenchange', fsChanged, false);
          document.addEventListener('fullscreenchange', fsChanged, false);
          document.addEventListener('MSFullscreenChange', fsChanged, false);
        }

        function fsChanged(){
          var fullscreen = isFullscreen();

          $('.action#fullscreen span').html(fullscreen ? 'EXIT FULLSCREEN' : 'FULLSCREEN');

          if(fullscreen){
            //adjust screen
            $('#main').css('width','100%');
            $('#main').css('padding','0px');

            $('#header').css('position','absolute');
            $('#header').css('z-index','100');
            $('#header').css('padding','15px');

            $('#nowPlayingContainer').css('position','absolute');
            $('#nowPlayingContainer').css('z-index','100');
            $('#nowPlayingContainer').css('top','45px');
            $('#nowPlayingContainer').css('left','15px');

            $('#headerBackground').show();
            $timeout(function(){
              var width = $(window).width();
              var height = ((width * 9) / 16) - 5;
              $('#player1, #player2').attr('width',width + 'px');
              $('#player1, #player2').attr('height',height + 'px');
            },1000);
          }
          else{
            //adjust screen
            $('#main').css('width','');
            $('#main').css('padding','');

            $('#header').css('position','');
            $('#header').css('z-index','');
            $('#header').css('padding','');

            $('#nowPlayingContainer').css('position','');
            $('#nowPlayingContainer').css('z-index','');
            $('#nowPlayingContainer').css('top','');
            $('#nowPlayingContainer').css('left','');

            $('#player1, #player2').attr('width',PLAYER_WIDTH + 'px');
            $('#player1, #player2').attr('height',PLAYER_HEIGHT + 'px');
            $('#headerBackground').hide();
          }
        }

        function launchIntoFullscreen() {
          var element = document.documentElement;
          //holly fuck this is also ugly
          if(element.requestFullscreen) {
            element.requestFullscreen();
          } else if(element.mozRequestFullScreen) {
            element.mozRequestFullScreen();
          } else if(element.webkitRequestFullscreen) {
            element.webkitRequestFullscreen();
          } else if(element.msRequestFullscreen) {
            element.msRequestFullscreen();
          }
        }

        function exitFullscreen(){
          //oh, come on
          if(document.exitFullscreen) {
            document.exitFullscreen();
          } else if(document.mozExitFullScreen) {
            document.mozExitFullScreen();
          } else if(document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
          } else if(document.msExitFullscreen) {
            document.msExitFullscreen();
          }
        }

        $scope.fullscreen = function(){
          return isFullscreen() ? exitFullscreen() : launchIntoFullscreen();
        };

        $scope.fastForward = function(){
          if($scope.$parent.fire){
            $scope.$parent.doSwitch();
          }else{
            $scope.$parent.socket.emit('fastForward',$scope.$parent.roomName);
          }
        }
      }
    };
  });