/**
 * 实现MVVM
 * MVVM作为数据绑定的入口，整合 Observer、Compile 和 Watcher 三者，通过 Observer 来监听自己的 model 数据变化，
 * 通过 Compile 来解析编译模板指令，最终利用 Watcher 搭起 Observer 和 Compile 之间的通信桥梁，达到数据变化 -> 视图更新；
 * 视图交互变化 (input) -> 数据 model 变更的双向绑定效果
 */
class MVVM {
    constructor(options) {
        this.$options = options || {};
        const data = this._data = this.$options.data;
        const vm = this;
        // 属性代理，实现 vm.xxx -> vm._data.xxx
        Object.keys(data).forEach(function (key) {
            vm._proxyData(key);
        });

        // 初始化计算监听
        this._initComputed();

        // 监听 data
        observe(data, this)

        // 启动编译
        this.$compile = new Compile(options.el || document.body, this)
    }

    // 监听需要用到的值
    $watch(key, cb, options) {
        new Watcher(this, key, cb);
    }

    // 代理 this 中的 data
    _proxyData(key, setter, getter) {
        const vm = this;
        setter = setter ||
            Object.defineProperty(vm, key, {
                configurable: false,
                enumerable: true,
                get: function proxyGetter() {
                    return vm._data[key];
                },
                set: function proxySetter(newVal) {
                    vm._data[key] = newVal;
                }
            });
    }

    // 代理 this 中的 computed，通过这里动态通知数据更新
    _initComputed() {
        const vm = this;
        const computed = this.$options.computed;
        if (typeof computed === 'object') {
            Object.keys(computed).forEach(function (key) {
                Object.defineProperty(vm, key, {
                    get: typeof computed[key] === 'function'
                        ? computed[key]
                        : computed[key].get
                });
            });
        }
    }
}