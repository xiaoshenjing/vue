// 指令处理集合，node：节点，exp：v-xxx 绑定的对象值，vm：储存所有 data 中的对象值
const compileUtil = {
    text(node, vm, exp) { // v-text
        this.bind(node, vm, exp, 'text');
    },

    html(node, vm, exp) { // v-html
        this.bind(node, vm, exp, 'html');
    },

    model(node, vm, exp) { // v-model
        this.bind(node, vm, exp, 'model');
        var val = this._getVMVal(vm, exp);
        var self = this

        node.addEventListener('input', function (e) { // 监听 input 框内容变动
            var newValue = e.target.value;
            if (val === newValue) return;

            self._setVMVal(vm, exp, newValue);
            val = newValue;
        });
    },

    class(node, vm, exp) {
        this.bind(node, vm, exp, 'class');
    },

    bind(node, vm, exp, dir) { // 绑定更新节点
        var updaterFn = updater[dir + 'Updater'];
        // 第一次初始化视图
        updaterFn && updaterFn(node, this._getVMVal(vm, exp));
        // 实例化订阅者，此操作会在对应的属性消息订阅器（有绑定的对象值）中添加了该订阅者 watcher
        new Watcher(vm, exp, function (value, oldValue) {
            // 一旦属性值有变化，会收到通知执行此更新函数，更新视图
            updaterFn && updaterFn(node, value, oldValue);
        });
    },

    // 事件处理，dir：click、change 等事件指令
    eventHandler(node, vm, exp, dir) {
        var eventType = dir.split(':')[1],
            fn = vm.$options.methods && vm.$options.methods[exp];

        if (eventType && fn) {
            node.addEventListener(eventType, fn.bind(vm), false);
        }
    },

    _getVMVal(vm, exp) { // 获取对象内的值
        var val = vm;
        exp = exp.split('.');
        exp.forEach(function (k) {
            val = val[k];
        });
        return val;
    },

    _setVMVal(vm, exp, value) { // 设置对象内的值
        var val = vm;
        exp = exp.split('.');
        exp.forEach(function (k, i) {
            // 非最后一个key，更新val的值
            if (i < exp.length - 1) {
                val = val[k];
            } else {
                val[k] = value;
            }
        });
    }
};

const updater = { // 更新节点
    textUpdater(node, value) {
        node.textContent = typeof value == 'undefined' ? '' : value;
    },

    htmlUpdater(node, value) {
        node.innerHTML = typeof value == 'undefined' ? '' : value;
    },

    classUpdater(node, value, oldValue) {
        var className = node.className;
        className = className.replace(oldValue, '').replace(/\s$/, '');

        var space = className && String(value) ? ' ' : '';

        node.className = className + space + value;
    },

    modelUpdater(node, value, oldValue) {
        node.value = typeof value == 'undefined' ? '' : value;
    }
};

/**
 * 实现Compile
 * compile主要做的事情是解析模板指令，将模板中的变量替换成数据，然后初始化渲染页面视图，
 * 并将每个指令对应的节点绑定更新函数，添加监听数据的订阅者，一旦数据有变动，收到通知，更新视图
 */
class Compile {
    constructor(el, vm) {
        this.$vm = vm;
        this.$el = this.isElementNode(el) ? el : document.querySelector(el);

        if (this.$el) {
            this.$fragment = this.node2Fragment(this.$el);
            this.init();
            this.$el.appendChild(this.$fragment);
        }
    }
    node2Fragment(el) { // 虚拟 dom
        var fragment = document.createDocumentFragment(),
            child;

        // 将原生节点拷贝到fragment
        while (child = el.firstChild) {
            // fragment.appendChild() 具有移动性，此操作是 move dom
            // 将 el.children[0] 被抽出，在下次操作从 el.children[1] 开始，以达到循环的目的
            fragment.appendChild(child);
        }

        return fragment;
    }
    init() {
        this.compileElement(this.$fragment);
    }
    // 递归遍历所有节点及其子节点，进行扫描解析编译，调用对应指令渲染，并调用对应指令更新函数进行绑定
    compileElement(el) {
        var childNodes = el.childNodes,
            me = this;

        [].slice.call(childNodes).forEach(function (node) {
            var text = node.textContent;
            var reg = /\{\{(.*)\}\}/;
            // 按元素节点方式编译
            if (me.isElementNode(node)) { // 是否元素节点
                me.compile(node);
            } else if (me.isTextNode(node) && reg.test(text)) { // 是否文本节点并符合 {{xxx}} 形式
                // 指的是与正则表达式匹配的第一个 子匹配(以括号为标志)字符串
                // 以此类推，RegExp.$2，RegExp.$3，..RegExp.$99 总共可以有99个匹配
                me.compileText(node, RegExp.$1.trim());
            }
            // 遍历编译子节点
            if (node.childNodes && node.childNodes.length) {
                me.compileElement(node);
            }
        });
    }
    // 修改元素节点对应属性的赋值操作
    compile(node) {
        var nodeAttrs = node.attributes,
            me = this;

        [].slice.call(nodeAttrs).forEach(function (attr) {
            var attrName = attr.name;
            // 规定：指令以 v-xxx 命名（v-text、v-html 等）
            if (me.isDirective(attrName)) {
                var exp = attr.value;
                var dir = attrName.substring(2);
                if (me.isEventDirective(dir)) {
                    // 事件指令，如 v-on:click
                    compileUtil.eventHandler(node, me.$vm, exp, dir);
                } else {
                    // 普通指令
                    compileUtil[dir] && compileUtil[dir](node, me.$vm, exp);
                }

                node.removeAttribute(attrName);
            }
        });
    }

    compileText(node, exp) {
        compileUtil.text(node, this.$vm, exp);
    }

    isDirective(attr) {
        return attr.indexOf('v-') == 0;
    }

    isEventDirective(dir) {
        return dir.indexOf('on') === 0;
    }

    isElementNode(node) {
        return node.nodeType == 1;
    }

    isTextNode(node) {
        return node.nodeType == 3;
    }
}