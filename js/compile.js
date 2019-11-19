const compileUtil = { // 指令处理集合
    text(node, vm, exp) {
        this.bind(node, vm, exp, 'text')
    },
    html(node, vm, exp) {
        this.bind(node, vm, exp, 'html');
    },
    model(node, vm, exp) {
        this.bind(node, vm, exp, 'model');
        let val = this._getVMVal(vm, exp);

        node.addEventListener('input', (e) => {
            const newValue = e.target.value;
            if (val === newValue) return;

            this._setVMVal(vm, exp, newValue);
            val = newValue;
        });
    },

    class(node, vm, exp) {
        this.bind(node, vm, exp, 'class');
    },
    bind(node, vm, exp, dir) {
        const updaterFn = updater[dir + 'Updater']
        // 第一次初始化视图
        updaterFn && updaterFn(node, this._getVMVal(vm, exp))
        // 实例化订阅者，此操作会在对应的属性消息订阅器中添加了该订阅者 watcher
        new Watcher(vm, exp, (value, oldValue) => {
            // 一旦属性值有变化，会收到通知执行此更新函数，更新视图
            updaterFn && updaterFn(node, value, oldValue)
        })
    },
    // 事件处理
    eventHandler(node, vm, exp, dir) {
        const [eventType, fn] = [dir.split(':')[1], vm.$options.methods && vm.$options.methods[exp]]

        if (eventType && fn) {
            node.addEventListener(eventType, fn.bind(vm), false);
        }
    },
    _getVMVal(vm, exp) {
        let val = vm;
        exp = exp.split('.');
        exp.forEach((k) => {
            val = val[k];
        });
        return val;
    },
    _setVMVal(vm, exp, value) {
        let val = vm;
        exp = exp.split('.');
        exp.forEach((k, i) => {
            // 非最后一个key，更新val的值
            if (i < exp.length - 1) {
                val = val[k]
            } else {
                val[k] = value
            }
        });
    }
}

const updater = { // 更新函数
    textUpdater(node, value) {
        node.textContent = typeof value == 'undefined' ? '' : value
    },
    htmlUpdater(node, value) {
        node.innerHTML = typeof value == 'undefined' ? '' : value;
    },
    classUpdater(node, value, oldValue) {
        let className = node.className;
        className = className.replace(oldValue, '').replace(/\s$/, '');

        let space = className && String(value) ? ' ' : '';

        node.className = className + space + value;
    },
    modelUpdater(node, value, oldValue) {
        node.value = typeof value == 'undefined' ? '' : value;
    }
}

/**
 * 实现Compile
 * compile主要做的事情是解析模板指令，将模板中的变量替换成数据，然后初始化渲染页面视图，
 * 并将每个指令对应的节点绑定更新函数，添加监听数据的订阅者，一旦数据有变动，收到通知，更新视图
 */
class Compile {
    constructor(el, vm) {
        this.$vm = vm
        this.$el = this.isElementNode(el) ? el : document.querySelector(el)

        if (this.$el) {
            this.$fragment = this.node2Fragment(this.$el)
            this.init()
            this.$el.appendChild(this.$fragment)
        }
    }
    init() {
        this.compileElement(this.$fragment)
    }
    node2Fragment(el) { // 虚拟 dom
        const fragment = document.createDocumentFragment()
        let child = null
        // 将原生节点拷贝到 fragment
        while (child = el.firstChild) {
            fragment.appendChild(child)
        }
        return fragment
    }
    // 便利所有节点及其子节点，进行扫描解析编译，调用对应指令渲染，并调用对应指令更新函数进行绑定
    compileElement(el) {
        const childNodes = el.childNodes
        Array.prototype.slice.call(childNodes).forEach(node => {
            const [text, reg] = [node.textContent, /\{\{(.*)\}\}/]
            // 按元素节点方式编译
            if (this.isElementNode(node)) {
                this.compile(node)
            } else if (this.isTextNode(node), reg.test(text)) {
                this.compileText(node, RegExp.$1)
            }
            // 遍历编译子节点
            if (node.childNodes && node.childNodes.length) {
                this.compileElement(node)
            }
        })
    }
    compile(node) {
        const nodeAttrs = node.attributes
        Array.prototype.slice.call(nodeAttrs).forEach(attr => {
            // 规定：指令以 v-xxx 命名（v-text、v-html 等）
            const attrName = attr.name
            if (this.isDirective(attrName)) {
                const [exp, dir] = [attr.value, attrName.substring(2)]
                if (this.isEventDirective(dir)) {
                    // 事件指令，如 v-on:click
                    compileUtil.eventHandler(node, this.$vm, exp, dir)
                } else {
                    // 普通指令
                    compileUtil[dir] && compileUtil[dir](node, this.$vm, exp)
                }

                node.removeAttribute(attrName)
            }
        })
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