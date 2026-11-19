import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import {createHashRouter} from 'react-router'
import {RouterProvider} from 'react-router/dom'
// the site keeps its light look regardless of the OS dark mode
import 'bulma/css/versions/bulma-no-dark-mode.min.css'
import './index.css'
import Layout from './Layout'
import HomePage from './HomePage'
import ConventionCard from './ConventionCard/ConventionCard'
import PbnViewer from './PbnViewer/PbnViewer'

// Hash routing, because GitHub Pages has no fallback to index.html for unknown paths.
const router = createHashRouter([
    {
        element: <Layout/>,
        children: [
            {path: '/', element: <HomePage/>},
            {path: '/cc', element: <ConventionCard/>},
            {path: '/pbn', element: <PbnViewer/>},
            // loaded on demand: the training data is large
            {path: '/trening', lazy: () => import('./Training/TrainingPage').then(module => ({Component: module.default}))},
        ],
    },
])

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <RouterProvider router={router}/>
    </StrictMode>
)
