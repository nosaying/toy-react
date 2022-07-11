import MyReact from './MyReact'

const container = document.querySelector('#root')

function App() {
    const [number, setNumber] = MyReact.useState(1)
    const [visible, setVisible] = MyReact.useState(true)

    return (
        <div>
            <button onClick={() => {
                setNumber(number + 1)
                setVisible(!visible)
            }}>点我啊</button>
            <h1>{number}</h1>
            {
                visible ? <h2>你看噢到我了吗</h2> : null
            }
        </div>
    )
}

// const element = MyReact.createElement(
//     'div',
//     {
//         title: 'hello',
//         id: 'sky'
//     },
//     'hello world',
//     MyReact.createElement('a', null, '我是a标签')
// )

MyReact.render(<App />, container)