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
                // 新的值是object的话，进行监听
                observe(newVal);
                // 通知订阅者
                dep.notify();
            }
        });
    }
}

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
    addSub(sub) {
        this.subs.push(sub);
    }

    depend() {
        Dep.target.addDep(this);
    }

    removeSub(sub) {
        var index = this.subs.indexOf(sub);
        if (index != -1) {
            this.subs.splice(index, 1);
        }
    }

    notify() {
        this.subs.forEach(function (sub) {
            sub.update();
        });
    }
}

Dep.target = null;