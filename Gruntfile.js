module.exports = function(grunt) {

  grunt.loadNpmTasks('grunt-contrib-copy');

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
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
          }
        ]
      }
    }
  });
  // Default task(s).
  grunt.registerTask('default', ['copy']);

};