/**
 * 实现MVVM
 * MVVM作为数据绑定的入口，整合 Observer、Compile 和 Watcher 三者，通过 Observer 来监听自己的 model 数据变化，
 * 通过 Compile 来解析编译模板指令，最终利用 Watcher 搭起 Observer 和 Compile 之间的通信桥梁，达到数据变化 -> 视图更新；
 * 视图交互变化 (input) -> 数据 model 变更的双向绑定效果
 */
class MVVM {
    constructor(options) {
        this.$options = options || {};
        var data = this._data = this.$options.data;
        var me = this;
        // 属性代理，实现 vm.xxx -> vm._data.xxx
        Object.keys(data).forEach(function (key) {
            me._proxyData(key);
        });

        this._initComputed();

        observe(data, this);

        this.$compile = new Compile(options.el || document.body, this)
    }
    
    $watch(key, cb, options) {
        new Watcher(this, key, cb);
    }

    _proxyData(key, setter, getter) {
        var me = this;
        setter = setter ||
            Object.defineProperty(me, key, {
                configurable: false,
                enumerable: true,
                get: function proxyGetter() {
                    return me._data[key];
                },
                set: function proxySetter(newVal) {
                    me._data[key] = newVal;
                }
            });
    }

    _initComputed() {
        var me = this;
        var computed = this.$options.computed;
        if (typeof computed === 'object') {
            Object.keys(computed).forEach(function (key) {
                Object.defineProperty(me, key, {
                    get: typeof computed[key] === 'function'
                        ? computed[key]
                        : computed[key].get,
                    set: function () { }
                });
            });
        }
    }
}