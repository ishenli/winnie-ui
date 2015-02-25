/**
 * @file   switchable 效果函数
 * @author shenli <shenli03@baidu.com>
 */
define(function (require) {
    var SCROLLX = 'scrollx';
    var SCROLLY = 'scrolly';
    var FADE = 'fade';
    var $ = require('jquery');
    var Effects = {
        isNeeded: function () {
            return this.get('effect') !== 'none';
        },
        install: function () {
            var panels = this.get('panels');
            var effect = this.get('effect');
            var step = this.get('step');
            var isFunction = $.isFunction(effect);

            // 初始化滚动效果
            if (!isFunction && effect.indexOf('scroll') === 0) {
                var container = this.get('container');
                var firstPanel = panels.eq(0);

                // 设置定位信息，为滚动效果做铺垫
                container.css('position', 'relative');

                // 注：container 的父级不一定是 container
                if (container.parent().css('position') === 'static') {
                    container.parent().css('position', 'relative');
                }

                // 水平排列
                if (effect === SCROLLX) {
                    panels.css('float', 'left');
                    // 设置最大宽度，以保证有空间让 panels 水平排布
                    // 35791197px 为 360 下 width 最大数值
                    container.width('20000px');
                }

                // 只有 scrollX, scrollY 需要设置 viewSize
                // 其他情况下不需要
                var viewSize = this.get('viewSize');
                if (!viewSize[0]) {
                    viewSize[0] = firstPanel.outerWidth() * step;
                    viewSize[1] = firstPanel.outerHeight() * step;
                    this.set('viewSize', viewSize);
                }

                if (!viewSize[0]) {
                    throw new Error('Please specify viewSize manually');
                }
            }
            // 初始化淡隐淡出效果
            else if (!isFunction && effect === FADE) {
                var activeIndex = this.get('activeIndex');
                var min = activeIndex * step;
                var max = min + step - 1;
                panels.each(function (i, panel) {
                    var isActivePanel = i >= min && i <= max;
                    $(panel).css({
                        opacity: isActivePanel ? 1 : 0,
                        position: 'absolute',
                        zIndex: isActivePanel ? 9 : 1
                    });
                });
            }
            // 覆盖 switchPanel 方法
            this._switchPanel = function (panelInfo) {
                var effect = this.get('effect');
                var fn = $.isFunction(effect) ? effect : Effects[effect];
                fn.call(this, panelInfo);
            };
        },
        // 淡隐淡现效果
        fade: function (panelInfo) {
            // 简单起见，目前不支持 step > 1 的情景。若需要此效果时，可修改结构来达成。
            if (this.get('step') > 1) {
                throw new Error('Effect "fade" only supports step === 1');
            }

            var fromPanel = panelInfo.fromPanels.eq(0);
            var toPanel = panelInfo.toPanels.eq(0);

            if (this.anim) {
                // 立刻停止，以开始新的
                this.anim.stop(false, true);
            }

            // 首先显示下一张
            toPanel.css('opacity', 1);
            toPanel.show();

            if (panelInfo.fromIndex > -1) {
                var that = this;
                var duration = this.get('duration');
                var easing = this.get('easing');

                // 动画切换
                this.anim = fromPanel.animate({ opacity: 0 }, duration, easing,
                    function () {
                        that.anim = null; // free

                        // 切换 z-index
                        toPanel.css('zIndex', 9);
                        fromPanel.css('zIndex', 1);
                        fromPanel.css('display', 'none');
                    });
            }
            // 初始情况下没有必要动画切换
            else {
                toPanel.css('zIndex', 9);
            }
        },

        // 水平/垂直滚动效果
        scroll: function (panelInfo) {
            // console.log('this scroll');
            // console.log(panelInfo);
            var isX = this.get('effect') === SCROLLX;
            var container = this.get('container');
            var diff = this.get('viewSize')[isX ? 0 : 1] * panelInfo.toIndex;

            var props = {};
            props[isX ? 'left' : 'top'] = -diff + 'px';

            if (this.anim) {
                this.anim.stop();
            }

            if (panelInfo.fromIndex > -1) {
                var that = this;
                var duration = this.get('duration');
                var easing = this.get('easing');

                this.anim = container.animate(props, duration, easing,
                    function () {
                        that.anim = null; // free
                    });
            }
            else {
                container.css(props);
            }
        }

    };
    Effects[SCROLLY] = Effects.scroll;
    Effects[SCROLLX] = Effects.scroll;
    return Effects;
});
