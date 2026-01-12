import { NewsletterForm } from "../features/NewsletterForm";
import "./Footer.css";

export function Footer() {
  const year = new Date().getFullYear();
  
  return (
    <footer className="footer">
      <div className="footer__content">
        <div className="footer__copyright">
          &copy; {year} Ansyar World. All rights reserved.
        </div>
        <NewsletterForm />
        <div className="footer__links">
          <a href="https://github.com/mansyar" target="_blank" rel="noopener noreferrer" className="footer__link">
            GitHub
          </a>
          <a href="https://www.linkedin.com/in/muhammad-ansyar-rafi-putra-904a75157/" target="_blank" rel="noopener noreferrer" className="footer__link">
            LinkedIn
          </a>
        </div>
        <div className="footer__status">
          <span className="footer__status-dot"></span>
          System Online
        </div>
      </div>
    </footer>
  );
}
