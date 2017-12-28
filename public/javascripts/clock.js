function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

angular.module('clock', [])
  .directive('clock', function(){
    return{
      scope:{
        minutes:'@',
        seconds:'@'
      },
      templateUrl: 'templates/clock.tpl.html',
      link: function($scope,$element){
        $scope.$watch('seconds',function(newValue){
          newValue = newValue < 0  || newValue > 59 ? 0 : newValue;
          $scope.seconds = pad(newValue,2)
        });
        $scope.$watch('minutes',function(newValue){
          $scope.minutes = pad(newValue,2)
        });
      }
    }
  });