/**
 * 实现Observer
 * 利用Obeject.defineProperty()来监听属性变动
 * 那么将需要observe的数据对象进行递归遍历，包括子属性对象的属性，都加上 setter 和 getter
 * 这样的话，给这个对象的某个值赋值，就会触发 setter，那么就能监听到了数据变化
 */
class Observer {
    constructor(data) {
        this.data = data;
        this.walk(data);
    }
    walk(data) {
        var me = this;
        Object.keys(data).forEach(function (key) {
            me.convert(key, data[key]);
        });
    }
    convert(key, val) {
        this.defineReactive(this.data, key, val);
    }
    defineReactive(data, key, val) {
        var dep = new Dep();
        observe(val); // 监听子属性
        Object.defineProperty(data, key, {
            enumerable: true, // 可枚举
            configurable: false, // 不能再define
            get() {
                if (Dep.target) {
                    dep.depend();
                }
                return val;
            },
            set(newVal) {
                if (newVal === val) {
                    return;
                }
                val = newVal;
                // 新的值是 object 的话，进行监听
                if (typeof newVal === 'object') observe(newVal);
                // 通知订阅者
                dep.notify();
            }
        });
    }
}

// 创建对象监听实例，用 observe 的数据对象进行递归遍历，包括子属性对象的属性，都加上 setter 和 getter
function observe(value, vm) {
    if (!value || typeof value !== 'object') {
        return;
    }
    return new Observer(value);
};

var uid = 0;

class Dep {
    constructor() {
        this.id = uid++;
        this.subs = [];
    }
    addSub(sub) { // 添加订阅
        this.subs.push(sub);
    }
    depend() {
        // Dep.target 的 this 指向 Watcher
        Dep.target.addDep(this);
    }
    removeSub(sub) { // 移除订阅
        var index = this.subs.indexOf(sub);
        if (index != -1) {
            this.subs.splice(index, 1);
        }
    }
    notify() { // 通知订阅者
        this.subs.forEach(function (sub) {
            sub.update();
        });
    }
}

Dep.target = null;