let nextUnitOfWork = null
let wipRoot = null
let currentRoot = null
let deletions = []
let wipFiber = []
let hooksIndex = 0

function reconcileChildren(wipFiber, elements) {
    let prevSibling = null;
    let oldFiber = wipFiber.alternate && wipFiber.alternate.child
    let index = 0
    while(index < elements.length || !!oldFiber) {
        let childrenElement = elements[index]
        let newFiber = null;
        const sameType = oldFiber && childrenElement && childrenElement.type === oldFiber
        if (sameType) {
            newFiber = {
                type: oldFiber.type,
                props: childrenElement.props,
                dom: oldFiber,
                parent: wipFiber,
                alternate: oldFiber,
                effectTag: 'UPDATE'
            }
        }

        if (!sameType && childrenElement) {
            newFiber = {
                type: childrenElement.type,
                props: childrenElement.props,
                dom: null,
                parent: wipFiber,
                alternate: null,
                effectTag: 'PLACEMENT'
            }
        }

        if (!sameType && oldFiber) {
            oldFiber.effectTag = 'DELETION'
            deletions.push(oldFiber)
        }

        oldFiber = oldFiber?.sibling

        if(index === 0) {
            wipFiber.child = newFiber
        } else {
            prevSibling.sibling = newFiber
        }

        prevSibling = newFiber
        index++
    }
}

function useState(initial) {
    const oldHooks = wipFiber.alternate.hooks?.[hooksIndex]
    const hook = {
        state: oldHooks ? oldHooks.state : initial,
        queue: []
    }

    const actions = oldHooks ? oldHooks.queue : []
    actions.forEach(action => {
        hook.state = action
    })

    const setState = action => {
        hook.queue.push(action)
        wipRoot= {
            dom: currentRoot.dom,
            props: currentRoot.props,
            alternate: currentRoot
        }

        nextUnitOfWork = wipRoot
        deletions = []
    }
    wipFiber.hooks.push(hook)
    hooksIndex++
    return [hook.state, setState]
}

function updateFunctionComponent(fiber) {
    wipFiber = fiber
    wipFiber.hoos = []
    hooksIndex = 0;
    const children = [fiber.type(fiber.props)]
    reconcileChildren(fiber, children)
}

function updateHostComponent(fiber) {
    if(!fiber.dom) {
        fiber.dom = createDom(fiber)
    }

    // ????????????fiber?????????????????????fiber
    const elements = fiber?.props?.children;
    reconcileChildren(fiber, elements)
}

function perforUnitOfWork(fiber) {
    // reactElement ??????????????????dom

    const isFunctionComponent = fiber.type instanceof Function
    if (isFunctionComponent) {
        updateFunctionComponent(fiber)
    } else {
        updateHostComponent(fiber)
    }

    // return?????????????????????
    if(fiber.child) {
        return fiber.child
    }

    let nextFiber = fiber
    while(nextFiber) {
        if(nextFiber.sibling) {
            return nextFiber.sibling
        }

        nextFiber = nextFiber.parent
    }
}

// ?????????????????????
const isEvent = key => key.startsWith('on')
// ?????????children??????
const isProperty = key => key !== 'children' && !isEvent(key)
// ???????????????????????????
const isGone = (prev, next) => key => !(key in next);
// ?????????????????????
const isNew = (prev, next) => key => prev[key] !== next[key]
function updateDom(dom, prevProps, nextProps) {
    // ????????????????????????
    Object.keys(prevProps)
        .filter(isEvent)
        .filter(key => isGone(prevProps, nextProps)(key) || isNew(prevProps, nextProps)(key))
        .forEach(name => {
            const eventType = name.toLocaleLowerCase().substring(2)
            dom.removeEventListener(eventType, prevProps[name])
        })
    // ???????????????props???????????????
    Object.keys(prevProps)
        .filter(isProperty)
        .filter(isGone(prevProps, nextProps))
        .forEach(name => dom[name] = '')

    // ??????
    Object.keys(nextProps)
        .filter(isProperty)
        .filter(isNew(prevProps, nextProps))
        .forEach(name => {
            console.log(name);
            dom[name] = nextProps[name]
        })
    // ????????????
    Object.keys(nextProps)
        .filter(isEvent)
        .filter(isNew(prevProps, nextProps))
        .forEach(name => {
            const eventType = name.toLocaleLowerCase().substring(2)
            dom.addEventListener(eventType, nextProps[name])
        })
}

function commitDeletion(fiber, domParent) {
    if (fiber.dom) {
        domParent.removeChild(fiber.dom)
    } else {
        commitDeletion(fiber.dom, domParent)
    }
}

function commitWork(fiber) {
    if(!fiber) return

    // const domParent = fiber.parent.dom
    let domParentFiber = fiber.parent
    while(!domParentFiber.dom) {
        domParentFiber = domParentFiber.parent
    }
    const domParent = domParentFiber.dom

    switch (fiber.effectTag) {
        case "PLACEMENT":
            !!fiber.dom && domParent.appendChild(fiber.dom)
            break
        case "UPDATE":
            !!fiber.dom && updateDom(fiber.dom, fiber.alternate, fiber.props)
            break
        case "DELETION":
            commitDeletion(fiber, domParent)
            break
        default:
            break
    }
    commitWork(fiber.child)
    commitWork(fiber.sibling)
}

function commitRoot() {
    // ???????????????dom?????????
    currentRoot = wipRoot
    deletions.forEach(commitWork)
    commitWork(wipRoot.child)
    wipRoot = null
}

function workLoop(deadline) {
    let shouldYield = true
    while(nextUnitOfWork && shouldYield) {
        nextUnitOfWork = perforUnitOfWork(nextUnitOfWork)
        shouldYield  = deadline.timeRemaining() > 1  // ???????????????????????????????????????
    }

    if (!nextUnitOfWork && wipRoot) {
        commitRoot()
    }

    requestIdleCallback(workLoop)
}
requestIdleCallback(workLoop)

function createDom(fiber) {
    const dom = fiber.type === 'TEXT_ELEMENT'
        ? document.createTextNode('')
        : document.createElement(fiber.type)

    updateDom(dom, {}, fiber.props)

    return dom
}

function render(element, container) {
    wipRoot= {
        dom: container,
        props: {
            children: [element]
        },
        alternate: currentRoot
    }

    nextUnitOfWork = wipRoot
    deletions = []
}

export {
    render,
    useState
}