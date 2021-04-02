const vm = {
    name: 'bob',
    age: 11,
    enjoy: ['1', 'a', 3],
    hobby: { a: 'eat' }
}

const observe = (data) => {
    if (!data || typeof data !== 'object') return
    Object.keys(data).forEach(key => {
        if (typeof data[key] === 'object') {
            data[key] = proxyData(data[key])
            observe(data[key])
        }
    })
    return proxyData(data);
}

// Reflect
// Reflect 是一个内建对象，可简化 Proxy 的创建。
// 前面所讲过的内部方法，例如 [[Get]] 和 [[Set]] 等，都只是规范性的，不能直接调用。
// Reflect 对象使调用这些内部方法成为了可能。它的方法是内部方法的最小包装。
const proxyData = (data) => new Proxy(data, {
    get(target, propKey, receiver) {
        return Reflect.get(target, propKey, receiver)
    },
    set(target, propKey, value, receiver) {
        console.log('val changed: ', value)
        // target[propKey] = value
        Reflect.set(target, propKey, value, receiver)
        return true
    }
})

const proxyVm = observe(vm);

proxyVm.name = 'lucy'
proxyVm.age = 11
proxyVm.hobby.a = 'play'
proxyVm.enjoy.push(123)
proxyVm.sex = 'female'
