import Home from './pages/Home';
import Apply from './pages/Apply';
import MyRequests from './pages/MyRequests';
import RequestDetail from './pages/RequestDetail';
import Queue from './pages/Queue';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Apply": Apply,
    "MyRequests": MyRequests,
    "RequestDetail": RequestDetail,
    "Queue": Queue,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};