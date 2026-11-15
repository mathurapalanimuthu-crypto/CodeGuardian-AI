import { NavLink, Link } from "react-router-dom";
import {
  ShieldCheck,
  LayoutDashboard,
  GitBranch,
  Code2,
  History
} from "lucide-react";
import "./Navbar.css";

function Navbar() {
  return (
    <nav className="navbar">

      <Link to="/" className="navbar-brand">
        <ShieldCheck size={30} />
        <span>
          CodeGuardian <strong>AI</strong>
        </span>
      </Link>

      <div className="navbar-links">

        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            isActive ? "active" : ""
          }
        >
          <LayoutDashboard size={18} />
          Dashboard
        </NavLink>

        <NavLink
          to="/repository"
          className={({ isActive }) =>
            isActive ? "active" : ""
          }
        >
          <GitBranch size={18} />
          Repositories
        </NavLink>

        <NavLink
          to="/analysis"
          className={({ isActive }) =>
            isActive ? "active" : ""
          }
        >
          <Code2 size={18} />
          Analysis
        </NavLink>

        <NavLink
          to="/history"
          className={({ isActive }) =>
            isActive ? "active" : ""
          }
        >
          <History size={18} />
          History
        </NavLink>

      </div>
    </nav>
  );
}

export default Navbar;