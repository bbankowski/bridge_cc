import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import 'bulma/css/bulma.min.css';
import {createBrowserRouter, RouterProvider,} from "react-router-dom";
import PbnViewer from "./PbnViewer/PbnViewer";
import ConvenctionCard from "./ConvenctionCard/ConvenctionCard";
import HomePage from "./HomePage";

const router = createBrowserRouter([
    {
        path: "/bridge_cc",
        element: <HomePage/>,
    },
    {
        path: "/bridge_cc/cc",
        element: <ConvenctionCard/>,
    },
    {
        path: "/bridge_cc/pbn",
        element: <PbnViewer/>,
    },
])

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
    <React.StrictMode>
        <RouterProvider router={router}/>
    </React.StrictMode>
)
