import React from 'react';

const Navbar = ({ user, onLogout }) => {
    return (
        <nav className="navbar navbar-expand-lg navbar-light bg-light mb-4 px-4 shadow-sm">
            <div className="container-fluid">
                <span className="navbar-brand mb-0 h1 text-primary">E-Test System</span>
                <div className="d-flex align-items-center gap-2">
                    <span className="small fw-semibold">{user.name}</span>
                    <button className="btn btn-sm btn-outline-danger" onClick={onLogout}>
                        Logout
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
