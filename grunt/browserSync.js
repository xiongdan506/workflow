module.exports = function (grunt, options) {
    return {
        dev: {
            bsFiles: {
                src : [
                	'public/css/*.css',
                	'public/tpl/*.js'
                ]
            },
            options: {
                host : "192.168.0.1",
                server: {
                    baseDir: "public/",
                    index: "index.html"
                }
            }
        }
    }
};