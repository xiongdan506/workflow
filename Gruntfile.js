'use strict';

module.exports = function(grunt) {

    require('load-grunt-config')(grunt, {
        init: true, 
        data: { 
            pkg: grunt.file.readJSON('package.json'),
            meta: {
                banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
                        '<%= grunt.template.today("yyyy-mm-dd") %>\n' + 
                        '<%= pkg.author.name%> - <%=pkg.author.email%>*/\n'
            }
        }
    });
    
    grunt.loadTasks('tasks');

};
