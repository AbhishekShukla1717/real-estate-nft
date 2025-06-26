import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-column">
              <div className="footer-logo">
                <span className="logo-icon">🏢</span>
                <span className="logo-text">RealNFT</span>
              </div>
              <p className="footer-desc">
                Revolutionizing real estate with blockchain technology. 
                Secure, transparent, and efficient property transactions.
              </p>
              <div className="social-links">
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                  <i className="social-icon twitter">𝕏</i>
                </a>
                <a href="https://discord.com" target="_blank" rel="noopener noreferrer" aria-label="Discord">
                  <i className="social-icon discord">Discord</i>
                </a>
                <a href="https://telegram.org" target="_blank" rel="noopener noreferrer" aria-label="Telegram">
                  <i className="social-icon telegram">Telegram</i>
                </a>
              </div>
            </div>
            
            <div className="footer-column">
              <h3 className="footer-heading">Quick Links</h3>
              <ul className="footer-links">
                <li><Link to="/">Home</Link></li>
                <li><Link to="/properties">Properties</Link></li>
                <li><Link to="/mint">Mint Property</Link></li>
              </ul>
            </div>
            
            <div className="footer-column">
              <h3 className="footer-heading">Legal</h3>
              <ul className="footer-links">
                <li><Link to="/terms">Terms of Service</Link></li>
                <li><Link to="/privacy">Privacy Policy</Link></li>
                <li><Link to="/kyc-policy">KYC Policy</Link></li>
                <li><Link to="/disclaimer">Disclaimer</Link></li>
              </ul>
            </div>
            
            <div className="footer-column">
              <h3 className="footer-heading">Newsletter</h3>
              <p className="newsletter-text">Subscribe to our newsletter for updates</p>
              <div className="newsletter-form">
                <input 
                  type="email" 
                  placeholder="Your email address" 
                  className="newsletter-input" 
                />
                <button className="newsletter-button">Subscribe</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom">
        <div className="container">
          <p className="copyright">
            © {currentYear} RealNFT. All rights reserved.
          </p>
          <div className="blockchain-info">
            <span className="blockchain-badge">Powered by Ethereum</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;