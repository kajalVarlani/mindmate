import "./Footer.css";
export default function Footer(){
    return(
<footer className="footer">
                <p>This application is for wellness support and not a substitute for professional mental health care</p>
                <p>© {new Date().getFullYear()} MindMate — By Kajal</p>
                <div className="footer-links">
                    <a href="#">Privacy</a>
                    <a href="#">Terms</a>
                    <a href="#">Contact</a>
                </div>
            </footer>
    )
}