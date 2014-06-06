module.exports = function (grunt, options) {
    return {
        all:{
        	src: [
                'public/imgSlice/*.png'
            ],
            //生成的图片地址
            destImg: 'public/img/t.png',
            //图片设置
            imgOpts: {
                //图片格式,默认为destImg设置
                format: 'png'
            },
            //生成的css地址
            destCSS: 'public/css/imgSlice.css',
            //css模板生成
            cssTemplate: 'lib/css.template.mustache',
            cssOpts: {
                cssBaseClass: '.icon',
                cssClass: function (item, baseName) {
                    //注baseName即cssBaseClass，默认值为.icon
    
                    var exp = {
                            'myaskOn' : '.foot_item--jsOn',
                            'newsOn'  : '.foot_item--jsOn'
                        },
                        name = item.name,
                        newName = baseName + '--' + name;
    
                    if(exp[name]) {
                        newName = exp[name] + ' ' + newName.replace('On', '');
                        item.isShowWidth  = true;
                        item.isShowHeight = true;
                    }
    
                    item.class = newName;
                }
            },
            //排列算法
                //top-down (default) 从上至下
                //left-right          从左至右
                //diagonal            从左至右斜
                //alt-diagonal        从右至左斜
                //binary-tree         二叉树        
            algorithm: 'binary-tree'
        }
    }
};