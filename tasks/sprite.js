/**
 * sprite
 */
var _           = require('underscore'),
    fs          = require('fs'),
    path        = require('path'),
    json2css    = require('json2css'),
    spritesmith = require('spritesmith');

function ExtFormat() {
  this.formatObj = {};
}
ExtFormat.prototype = {
  'add': function (name, val) {
    this.formatObj[name] = val;
  },
  'get': function (filepath) {
    // 获以图片扩展
    var ext = path.extname(filepath),
        lowerExt = ext.toLowerCase();

    // 获取扩展
    var formatObj = this.formatObj,
        format = formatObj[lowerExt];
    return format;
  }
};

// 创建图片和css格式
var fileFormats = new ExtFormat();

// 添加图片格式
fileFormats.add('.png',  'png');
fileFormats.add('.jpg',  'jpeg');
fileFormats.add('.jpeg', 'jpeg');

// 添加css格式
fileFormats.add('.sass', 'sass');
fileFormats.add('.scss', 'scss');
fileFormats.add('.less', 'less');
fileFormats.add('.css',  'css');

function isImg2X(src) {
    var bool = false;
    if(src.indexOf('@2x') > -1) {
        bool = true;
    }
    return bool;
}

//区分普通或者视网模的路径
function extImage2X(obj) {
    var formats = {},
        small  = [],
        retina = [];

    _.each(obj, function(src) {
        if(isImg2X(src)) {
            retina.push(src);
        } else {
            small.push(src);
        }
    });

    formats.small  = small;
    formats.retina = retina;
    return formats;
}

//获取不带扩展的文件名
function getFileName(fullname) {
    var formats = path.extname(fullname),
        name    = path.basename(fullname, formats);
    return name;
}

module.exports = function (grunt) {

    function SpriteMaker() {
        var data    = this.data,
            src     = data.src,
            destImg = data.destImg,
            destCSS = data.destCSS,
            cssTemplate = data.cssTemplate,
            that = this;

        // 非法性检查
        if (!src || !destImg || !destCSS || !cssTemplate) {
          return grunt.fatal("嘿嘿~一定要src、destImg、destCSS、cssTemplate属性哦~~");
        }

        // 创建异步回调
        var cb = this.async();

        // 设置生成图片格式
        var imgOpts   = data.imgOpts || {},
            imgFormat = imgOpts.format || fileFormats.get(destImg) || 'png';

        // 设置imgOpts
        _.defaults(imgOpts, {'format': imgFormat});

        // 创建要生成图片的目录及对应的普通图片地址和视网模地址
        var destImgDir    = path.dirname(destImg),
            destImgName   = getFileName(destImg),
            smallDestImg  = destImg,
            retinaDestImg = path.join(destImgDir, destImgName + '@2x.' + imgFormat);
        retinaDestImg = retinaDestImg.split('\\').join('/');
        grunt.file.mkdir(destImgDir);
        

        // 区分合并区域的普通图片和视网模图片
        var srcFiles    = grunt.file.expand(src),
            extFiles    = extImage2X(srcFiles),
            smallFiles  = extFiles.small,
            retinaFiles = extFiles.retina; 
        
        //各图类型的合并参数处理
        var param = {
                'engine'     : data.engine || 'auto',
                'algorithm'  : data.algorithm || 'top-down',
                'padding'    : data.padding || 0,
                'engineOpts' : data.engineOpts || {},
                'exportOpts' : imgOpts 
            },
            smallParam  = {},
            retinaParam = {};

        _.defaults(smallParam,  {'src': smallFiles},  param);
        _.defaults(retinaParam, {'src': retinaFiles}, param);

        //处理css格式及参数
        var cssFormat    = 'spritesmith-custom',
            cssOptions   = data.cssOpts || {},
            cssBaseClass = data.cssBaseClass || '.icon';

        //处理一下参数


        //处理是否按模板生成或者使用原生模板
        if (cssTemplate) {
            if (typeof cssTemplate === 'function') {
                json2css.addTemplate(cssFormat, cssTemplate);
            } else {
                json2css.addMustacheTemplate(cssFormat, fs.readFileSync(cssTemplate, 'utf8'));
            }
        } else {
            cssFormat = data.cssFormat || fileFormats.get(destCSS) || 'json';
        }
        // 创建要生成css的目录
        var destCssDir = path.dirname(destCSS);
        grunt.file.mkdir(destCssDir);

        //调用spritesmith生成图片
        _Spritesmith(smallParam,  'small',  smallDestImg,  cssFormat, cssOptions, destCSS, cssBaseClass, cb);
        _Spritesmith(retinaParam, 'retina', retinaDestImg, cssFormat, cssOptions, destCSS, cssBaseClass, cb);
    }

    function _Spritesmith(params, type, destImg, cssFormat, cssOptions, destCSS, cssBaseClass, done) {
        spritesmith(params, function (err, result) {
            if(err) {
                grunt.fatal(err);
                return done(err);
            }

            // 生成css变量列表
            var coordinates = result.coordinates,
                properties  = result.properties,
                cleanCoords = [],
                errorTips   = [],
                total_width  = properties.width, 
                total_height = properties.height;

            // 文件检测提示
            Object.getOwnPropertyNames(coordinates).sort().forEach(function (file) {
                
                var fullname = path.basename(file),
                    name     = getFileName(fullname),
                    coords   = coordinates[file];

                //图片的指定处理
                coords.name         = name;
                coords.source_image = file;
                coords.image        = file;
                

                //额外设置
                cssOptions.cssClass && cssOptions.cssClass(coords, cssBaseClass);

                //不合格宽高记录
                if(type === 'retina') {
                    if(coords.width%2 !== 0 || coords.height%2 !== 0) {
                        errorTips.push(coords);
                    }
                } else {
                    cleanCoords.push(coords);
                }
                
            });

            //错误提示
            if(errorTips.length) {
                _.each(errorTips, function (tip) {
                    grunt.log.error(tip.source_image + ',width=' + tip.width + ',height=' + tip.height);
                });
                grunt.fatal('警告:以上文件的宽或者高非偶数哦~,好好检查撒~~~');
                return done(false);
            }

            //写入图片文件
            fs.writeFileSync(destImg, result.image, 'binary');
            grunt.log.writeln('【Done】' + destImg);

            var timeNow = grunt.template.today("yyyymmddHHmmss"),
                imgBaseName = path.basename(destImg) + '?' + timeNow;

            //普通文件记录坐标
            if(type === 'small') {
                var cssStr = json2css(cleanCoords, {'format': cssFormat});
                //添加总图片的引用
                cssStr = cssBaseClass + "{background-image:url('../img/" + imgBaseName + "')}\n" + cssStr;
                fs.writeFileSync(destCSS, cssStr, 'utf8');
                grunt.log.writeln('【Done】' + destCSS);
            } else {
                var cssStr = fs.readFileSync(destCSS);
                cssStr = cssStr + '\n' + 
                '@media only screen and (-webkit-min-device-pixel-ratio: 1.5),' +
                        'only screen and (min--moz-device-pixel-ratio: 1.5),' +
                        'only screen and (min-resolution: 240dpi) {' +
                        cssBaseClass + "{" +
                            "background-image:url('../img/" + imgBaseName + "');\n" +
                            "background-size: " + total_width/2 +"px " + total_height/2 + "px;" +
                        '}' + 
                '}';
                fs.writeFileSync(destCSS, cssStr, 'utf8');
                //Callback
                done(true);
            }
            
        });
    }

    // Export the SpriteMaker function
    grunt.registerMultiTask('sprite', 'Create sprites and updates css.', SpriteMaker);
};