
function NavBar() {
    return (
        <nav className="navbar">
            <div className="navbar-logo">MyReactApp</div>
            <ul className="navbar-links">   
                <li><a href="/student-dashboard">Dashboard</a></li>
                <li><a href="/course-catalog">Courses</a></li>
                <li><a href="/profile">Profile</a></li>
            </ul>
        </nav>
    );
}   
export default NavBar;