module.exports = function (grunt, options) {
    return {
        files: [
            '<%=src.js%>*.js'
        ],
        options: {
            jshintrc: 'check/.jshintrc'
        }
    }
};