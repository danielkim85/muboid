angular.module('footer', [])
  .directive('footer', function(){
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

          $('.action#fullscreen i').html(fullscreen ? 'computer' : 'tv');
          $('.action#fullscreen span').html(fullscreen ? 'COMPUTER' : 'TV');

          if(fullscreen){
            //adjust screen
          }
          else{
            //adjust screen
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
      }
    }
  });