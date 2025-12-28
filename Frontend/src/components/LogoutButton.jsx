import { useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import "../LandingPage.css";
import "./Navbar.css";

export default function AuthButton() {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth(); 

  const handleClick = () => {
    if (isAuthenticated) {
      logout(); 
    }
    navigate("/login");
  };

  return (
    <button className="journal-pill" onClick={handleClick}>
      {isAuthenticated ? "Logout" : "Login"}
    </button>
  );
}