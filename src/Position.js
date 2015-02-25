/**
 * @file 定位工具，将一个 DOM 节点相对于另一个 DOM 节点进行定位操作
 * @author shenli(meshenli@gmail.com）
 */
define(function (require) {

    var VIEWPORT = { _id: 'VIEWPORT', nodeType: 1 };
    var Position = {};
    var isPosFixed = false; // 是否fixed
    var lib = require('winnie/lib');


    /**
     * @constructor
     * @requires jQuery
     * @exports Position
     * @example
     */

    /**
     * 定位函数
     * @param {Object} target 目标元素定位对象
     * @param {jQuery} target.element 目标元素
     * @param {number} target.number 横向偏移
     * @param {number} target.number 纵向元素
     * @param {Object} base 基准元素定位对象
     * @param {jQuery} target.element 目标元素
     * @param {number} target.number 横向偏移
     * @param {number} target.number 纵向元素
     */
    Position.pin = function (target, base) {
        target = normalize(target);
        base = normalize(base);

        var pinElement = target.element;
        //  设定目标元素的 position 为绝对定位
        //  若元素的初始 position 不为 absolute，会影响元素的 display、宽高等属性
        if (lib.getStyle(pinElement,'position') !== 'fixed') {
            lib.setStyle(pinElement,{
                position: 'absolute'
            });

            isPosFixed = false;
        }
        else {
            isPosFixed = true;
        }

        //  将位置属性归一化为数值
        //  注：必须放在上面这句 `css('position', 'absolute')` 之后，
        //     否则获取的宽高有可能不对
        posConverter(target);
        posConverter(base);


        var parentOffset = getParentOffset(pinElement);
        var baseOffset = base.offset();

        var top = baseOffset.top + base.y - target.y - parentOffset.top;
        var left = baseOffset.left + base.x - target.x - parentOffset.left;

        lib.setStyle(pinElement,{
            left: left,
            top: top
        });

    };


    //  这是当前可视区域的伪 DOM 节点
    //  需要相对于当前可视区域定位时，可传入此对象作为 element 参数
    Position.VIEWPORT = VIEWPORT;

    /**
     * 转为浮点类型
     * @param {string|number} s 字符串
     * @returns {Number|number}
     */
    function numberize(s) {
        return parseFloat(s, 10) || 0;
    }

    /**
     * 转为标准的位置对象格式{ element: a, x: 0, y: 0 }， element传入是id选择器或者是dom元素
     * @param {Object} posObj
     * @returns {Object}
     */
    function normalize(posObj) {

        posObj = lib.get(posObj) || {};

        if (posObj.nodeType) {
            posObj = {
                element: posObj
            };
        }

        var element = lib.get(posObj.element) || VIEWPORT;

        if (element.nodeType !== 1) {
            throw  new Error('posObj.element is invalid.');
        }

        var result = {
            element: element,
            x: posObj.x || 0,
            y: posObj.y || 0
        };

        var isVIEWPORT = (element === VIEWPORT || element._id === 'VIEWPORT');

        result.offset = function () {
            if (isPosFixed) {
                return {
                    left: 0,
                    top: 0
                };
            }
            else if (isVIEWPORT) {
                return {
                    top: lib.getScrollTop(),
                    left: lib.getScrollLeft()
                };
            }
            else {
                return lib.getPosition(element);
            }
        };

        // 计算图形尺寸
        result.size = function () {
            var el = isVIEWPORT ? lib.get(window) : lib.get(element);
            return {
                width: lib.outerWidth(el),
                height: lib.outerHeight(el)
            };
        };

        return result;
    }

    function posConverter(posObj) {
        posObj.x = xyConverter(posObj.x, posObj, 'width');
        posObj.y = xyConverter(posObj.y, posObj, 'height');
    }

    /**
     * 转为各种值的形式
     * @param {string} x 坐标
     * @param {Object} posObj
     * @param {Object} type
     * @returns {Number|number}
     */
    function xyConverter(x, posObj, type) {
        // 转为string
        x = x + '';

        // 去掉px
        x = x.replace(/px/gi, '');

        if (/\D/.test(x)) {
            x = x.replace(/(?:top|left)/gi, '0%')
                .replace(/(?:bottom|right)/gi, '100%')
                .replace(/center/gi, '50%');

        }

        //  将百分比转为像素值
        if (x.indexOf('%') !== -1) {
            // 支持小数
            x = x.replace(/(\d+(?:\.\d+)?)%/gi, function (m, d) {
                return posObj.size()[type] * (d / 100.0);
            });
        }

        return parseFloat(x, 10) || 0;
    }

    /**
     * 获取最近的祖先定位元素的offset
     * @param {Object} element
     */
    function getParentOffset(element) {
        // https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement.offsetParent
        if (lib.getStyle(element, 'position') === 'fixed') {
            return {
                top:numberize(lib.getStyle(element,'border-top-width')),
                left:numberize(lib.getStyle(element,'border-left-width'))
            }
        }
        var parent = element.offsetParent;

        if (parent === document.documentElement) {
            parent = document.body;
        }

        var offset;

        if (parent === document.body
            && lib.getStyle(parent, 'position') === 'static') {
            offset = { top: 0, left: 0 };
        }
        else {
            offset = lib.getPosition(parent);
        }

        //  根据基准元素 offsetParent 的 border 宽度，来修正 offsetParent 的基准位置
        offset.top += numberize(lib.getStyle(parent,'border-top-width'));
        offset.left += numberize(lib.getStyle(parent,'border-left-width'));


        return offset;

    }

    return Position;
});
