import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  const footerStyle = {
    backgroundColor: '#000000',
    color: '#808080',
    padding: '3rem 2rem 2rem',
    borderTop: '1px solid #333',
    marginTop: 'auto',
    width: '100%'
  };

  const footerContainerStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '2rem'
  };

  const footerSectionStyle = {
    display: 'flex',
    flexDirection: 'column'
  };

  const footerTitleStyle = {
    color: '#22c55e',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    marginBottom: '1rem'
  };

  const footerLinkStyle = {
    color: '#808080',
    textDecoration: 'none',
    marginBottom: '0.5rem',
    fontSize: '0.9rem',
    transition: 'color 0.3s ease'
  };

  const footerLinkHoverStyle = {
    color: '#22c55e'
  };

  const socialLinksStyle = {
    display: 'flex',
    gap: '1rem',
    marginTop: '1rem'
  };

  const socialLinkStyle = {
    color: '#808080',
    fontSize: '1.5rem',
    textDecoration: 'none',
    transition: 'color 0.3s ease'
  };

  const copyrightStyle = {
    borderTop: '1px solid #333',
    paddingTop: '2rem',
    marginTop: '2rem',
    textAlign: 'center',
    fontSize: '0.9rem',
    color: '#666'
  };

  const logoTextStyle = {
    color: '#22c55e',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    marginBottom: '1rem'
  };

  return (
    <footer style={footerStyle}>
      <div style={footerContainerStyle}>
        {/* Company Info */}
        <div style={footerSectionStyle}>
          <div style={logoTextStyle}>PlayAtac</div>
          <p style={{ fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '1rem' }}>
            Your ultimate gaming platform. Connect, compete, and conquer with players worldwide.
          </p>
          <div style={socialLinksStyle}>
            <a href="#" style={socialLinkStyle} onMouseEnter={(e) => e.target.style.color = '#22c55e'} onMouseLeave={(e) => e.target.style.color = '#808080'}>
              📘
            </a>
            <a href="#" style={socialLinkStyle} onMouseEnter={(e) => e.target.style.color = '#22c55e'} onMouseLeave={(e) => e.target.style.color = '#808080'}>
              🐦
            </a>
            <a href="#" style={socialLinkStyle} onMouseEnter={(e) => e.target.style.color = '#22c55e'} onMouseLeave={(e) => e.target.style.color = '#808080'}>
              📷
            </a>
            <a href="#" style={socialLinkStyle} onMouseEnter={(e) => e.target.style.color = '#22c55e'} onMouseLeave={(e) => e.target.style.color = '#808080'}>
              💼
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div style={footerSectionStyle}>
          <h3 style={footerTitleStyle}>Quick Links</h3>
          <Link to="/" style={footerLinkStyle} onMouseEnter={(e) => e.target.style.color = '#22c55e'} onMouseLeave={(e) => e.target.style.color = '#808080'}>
            Home
          </Link>
          <Link to="/dashboard" style={footerLinkStyle} onMouseEnter={(e) => e.target.style.color = '#22c55e'} onMouseLeave={(e) => e.target.style.color = '#808080'}>
            Dashboard
          </Link>
          <a href="#" style={footerLinkStyle} onMouseEnter={(e) => e.target.style.color = '#22c55e'} onMouseLeave={(e) => e.target.style.color = '#808080'}>
            Games
          </a>
          <a href="#" style={footerLinkStyle} onMouseEnter={(e) => e.target.style.color = '#22c55e'} onMouseLeave={(e) => e.target.style.color = '#808080'}>
            Tournaments
          </a>
          <a href="#" style={footerLinkStyle} onMouseEnter={(e) => e.target.style.color = '#22c55e'} onMouseLeave={(e) => e.target.style.color = '#808080'}>
            Leaderboard
          </a>
        </div>

        {/* Account */}
        <div style={footerSectionStyle}>
          <h3 style={footerTitleStyle}>Account</h3>
          <Link to="/login" style={footerLinkStyle} onMouseEnter={(e) => e.target.style.color = '#22c55e'} onMouseLeave={(e) => e.target.style.color = '#808080'}>
            Sign In
          </Link>
          <Link to="/signup" style={footerLinkStyle} onMouseEnter={(e) => e.target.style.color = '#22c55e'} onMouseLeave={(e) => e.target.style.color = '#808080'}>
            Sign Up
          </Link>
          <a href="#" style={footerLinkStyle} onMouseEnter={(e) => e.target.style.color = '#22c55e'} onMouseLeave={(e) => e.target.style.color = '#808080'}>
            Profile Settings
          </a>
          <a href="#" style={footerLinkStyle} onMouseEnter={(e) => e.target.style.color = '#22c55e'} onMouseLeave={(e) => e.target.style.color = '#808080'}>
            Account Security
          </a>
        </div>

        {/* Support */}
        <div style={footerSectionStyle}>
          <h3 style={footerTitleStyle}>Support</h3>
          <a href="#" style={footerLinkStyle} onMouseEnter={(e) => e.target.style.color = '#22c55e'} onMouseLeave={(e) => e.target.style.color = '#808080'}>
            Help Center
          </a>
          <a href="#" style={footerLinkStyle} onMouseEnter={(e) => e.target.style.color = '#22c55e'} onMouseLeave={(e) => e.target.style.color = '#808080'}>
            Contact Us
          </a>
          <a href="#" style={footerLinkStyle} onMouseEnter={(e) => e.target.style.color = '#22c55e'} onMouseLeave={(e) => e.target.style.color = '#808080'}>
            Bug Reports
          </a>
          <a href="#" style={footerLinkStyle} onMouseEnter={(e) => e.target.style.color = '#22c55e'} onMouseLeave={(e) => e.target.style.color = '#808080'}>
            Community Guidelines
          </a>
          <a href="#" style={footerLinkStyle} onMouseEnter={(e) => e.target.style.color = '#22c55e'} onMouseLeave={(e) => e.target.style.color = '#808080'}>
            Terms of Service
          </a>
        </div>
      </div>

      {/* Copyright */}
      <div style={copyrightStyle}>
        <p>&copy; 2025 PlayAtac. All rights reserved. Built with ❤️ for gamers.</p>
      </div>
    </footer>
  );
}

export default Footer;
