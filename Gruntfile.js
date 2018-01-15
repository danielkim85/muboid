module.exports = function(grunt) {

  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-jshint');


  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      all: [
        'Gruntfile.js',
        'public/**/*.js',
        '!public/third-party/**/*.js',
        'muboid_modules/**/*.js'
      ]
    },
    copy: {
      main: {
        files: [
          {
            cwd: 'node_modules/bootstrap-slider/dist/',
            src: ['**'],
            dest: 'public/third-party/bootstrap-slider',
            expand: true
          },
          {
            cwd: 'node_modules/socket.io-client/dist/',
            src: ['**'],
            dest: 'public/third-party/socket.io',
            expand: true
          },
          {
            cwd: 'bower_components/jqueryui-touch-punch/',
            src: ['**'],
            dest: 'public/third-party/jqueryui-touch-punch/jquery.ui.touch-punch.min.js',
            expand: true
          }
        ]
      }
    }
  });
  // Default task(s).
  grunt.registerTask('default', ['jshint','copy']);

};