module.exports = function (grunt, options) {
    return {
        all: {
            options:{
                optimizationLevel: 3,
                progressive: false,
                interlaced: false,
                pngquant: true,
            },
            files: [{
                expand: true,
                cwd: 'public/img/',
                src:  ['**/*.{png,jpg,gif}'],
                dest: 'dist/img/'
            }]
        }
    }
};