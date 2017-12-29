angular.module('welcome', [])
  .directive('welcome', function(){
    return{
      scope:{
      },
      templateUrl: 'welcome/welcome.tpl.html',
      link: function($scope,$element){
        var socket = $scope.$parent.socket;

        $scope.create = function(){
          socket.emit('create');
        };

        socket.on('created', function(roomName){
          $scope.$parent.roomName = roomName;
          $scope.$parent.wait = false;
          $scope.$parent.start();
        })
        $scope.join = function(){
          socket.emit('join','roomName')
        };

        socket.on('joined', function(roomName){
          console.info(roomName);
        });
      }
    }
  });