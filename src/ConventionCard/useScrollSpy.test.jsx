import {act, render} from '@testing-library/react'
import {beforeEach, expect, test, vi} from 'vitest'
import {useScrollSpy} from './useScrollSpy'

const IDS = ['a', 'b', 'c']

const Spy = ({preferred = null}) => <>
    {IDS.map(id => <div key={id} id={id}/>)}
    <p data-testid="active">{useScrollSpy(IDS, 100, preferred)}</p>
</>

const setTops = tops => IDS.forEach((id, index) => {
    document.getElementById(id).getBoundingClientRect = () => ({top: tops[index]})
})

const scroll = async () => {
    await act(async () => {
        window.dispatchEvent(new Event('scroll'))
        await new Promise(resolve => requestAnimationFrame(resolve))
    })
}

beforeEach(() => {
    vi.stubGlobal('innerHeight', 800)
    vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockReturnValue(10000)
})

test('marks the last element scrolled above the offset as active', async () => {
    const {getByTestId} = render(<Spy/>)

    setTops([-500, 50, 400])
    await scroll()
    expect(getByTestId('active')).toHaveTextContent('b')

    setTops([-900, -300, 90])
    await scroll()
    expect(getByTestId('active')).toHaveTextContent('c')
})

test('defaults to the first element at the top of the page', async () => {
    const {getByTestId} = render(<Spy/>)

    setTops([300, 600, 900])
    await scroll()

    expect(getByTestId('active')).toHaveTextContent('a')
})

test('marks the last visible element at the bottom of the page', async () => {
    const {getByTestId} = render(<Spy/>)
    vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockReturnValue(800)

    setTops([-200, 50, 500])
    await scroll()

    expect(getByTestId('active')).toHaveTextContent('c')
})

// the reported case: "Po silnym 2BA" opened from the menu near the end of the card showed the last section as active
test('at the bottom of the page the section navigated to wins if it is visible', async () => {
    const {getByTestId} = render(<Spy preferred="b"/>)
    vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockReturnValue(800)

    setTops([-200, 0, 500])
    await scroll()

    expect(getByTestId('active')).toHaveTextContent('b')
})

test('at the bottom the last visible element wins when the preferred one is scrolled away', async () => {
    const {getByTestId} = render(<Spy preferred="a"/>)
    vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockReturnValue(800)

    setTops([-200, 50, 500])
    await scroll()

    expect(getByTestId('active')).toHaveTextContent('c')
})

test('away from the bottom the preferred element does not change the result', async () => {
    const {getByTestId} = render(<Spy preferred="c"/>)

    setTops([-500, 50, 400])
    await scroll()

    expect(getByTestId('active')).toHaveTextContent('b')
})
