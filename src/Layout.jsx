import {Outlet} from 'react-router'
import Navbar from './Navbar/Navbar'

const Layout = () => <>
    <Navbar/>
    <Outlet/>
</>

export default Layout
