/**
 * 1. Object.defineProperty 无法监听新增加的属性
 * 2. Object.defineProperty 无法一次性监听对象所有属性，如对象属性的子属性
 * 3. Object.defineProperty 无法响应数组操作
 * 4. Proxy 拦截方式更多, Object.defineProperty 只有 get 和 set
 */

const vm = {
    name: 'bob',
    age: 11,
    enjoy: ['1', 'a', 3],
    hobby: { a: 'eat' }
}

// const orginalProto = Array.prototype
// const arrayProto = Object.create(orginalProto) // 先克隆份 Array 原型
// const methodToPatch = [
//     'push',
//     'pop',
//     'shift',
//     'unshift',
//     'splice',
//     'sort',
//     'reverse'
// ]
// methodToPatch.forEach(method => {
//     arrayProto[method] = function () {
//         console.log('method changed: ', method, arguments)
//         orginalProto[method].apply(this, arguments)
//     }
// })

const observe = (data) => {
    if (!data || typeof data !== 'object') return
    // if (Array.isArray(data)) {
    //     // 如果是数组，重写原型链 data.__proto__ = arrayProto
    //     Object.setPrototypeOf(data, arrayProto);
    //     for (let i = 0; i < data.length; i++) {
    //         observe(data[i])
    //     }
    // } else {
        Object.keys(data).forEach(key => {
            dr(data, key, data[key])
        })
    // }
}

const dr = (data, key, val) => {
    observe(val) // 递归制造响应式数据
    Object.defineProperty(data, key, {
        enumerable: true,
        configurable: true,
        set(nv) {
            console.log('val changed: ', nv)
            val = nv
        },
        get() {
            return val
        }
    })
}

observe(vm)

vm.name = 'lucy'
vm.age = 11
vm.hobby.a = 'play'
vm.enjoy.push(123)
vm.sex = 'female' // 监听不到