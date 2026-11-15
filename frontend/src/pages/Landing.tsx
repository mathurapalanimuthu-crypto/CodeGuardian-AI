import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import "./Landing.css";

function Landing() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <Navbar />

      <main className="hero">
        <div className="hero-badge">
          AI-Powered Software Intelligence
        </div>

        <h1>
          Understand Your Code Before It Becomes a Problem.
        </h1>

        <p>
          CodeGuardian AI analyzes your software to identify technical debt,
          software risks, and code quality issues before they become costly.
        </p>

        <button
          className="hero-button"
          onClick={() => navigate("/repository")}
        >
          Analyze Repository →
        </button>
      </main>
    </div>
  );
}

export default Landing;