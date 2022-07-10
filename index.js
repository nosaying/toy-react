import MyReact from './MyReact'

const element = MyReact.createElement(
    'div',
    {
        title: 'hello',
        id: 'sky'
    },
    'hello world',
    MyReact.createElement('a', null, '我是a标签')
)

console.log(element);

const container = document.querySelector('#root')

MyReact.render(element, container)