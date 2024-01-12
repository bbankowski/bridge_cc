import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import 'bulma/css/bulma.min.css';
import {createHashRouter,  RouterProvider,} from "react-router-dom";
import PbnViewer from "./PbnViewer/PbnViewer";
import ConvenctionCard from "./ConvenctionCard/ConvenctionCard";
import HomePage from "./HomePage";
import Navbar from "./Navbar/Navbar";

const router = createHashRouter([
    {
        path: "/",
        element: <HomePage/>,
    },
    {
        path: "/cc",
        element: <ConvenctionCard/>,
    },
    {
        path: "/pbn",
        element: <PbnViewer/>,
    },
])

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
    <React.StrictMode>
        <Navbar/>
        <RouterProvider router={router}/>
    </React.StrictMode>
)
