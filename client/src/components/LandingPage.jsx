import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const LandingPage = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className={`landing-page ${theme}`}>
      <nav className="landing-nav">
        <div className="logo">GrowEasy AI</div>
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How It Works</a>
          <a href="#pricing">Pricing</a>
          <button className="theme-toggle" onClick={toggleTheme}>
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </nav>

      <main className="landing-content">
        <div className="hero-section">
          <h1>Your AI Growth Partner</h1>
          <p className="subtitle">
            Transform your business with intelligent automation and data-driven insights. 
            GrowEasy AI helps you make smarter decisions and scale your operations efficiently.
          </p>
          <div className="cta-buttons">
            <button className="cta-button primary" onClick={() => navigate('/chat')}>
              Try Now
            </button>
            <button className="cta-button secondary" onClick={() => document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' })}>
              Learn More
            </button>
          </div>
          <div className="hero-stats">
            <div className="stat-item">
              <h3>10k+</h3>
              <p>Active Users</p>
            </div>
            <div className="stat-item">
              <h3>98%</h3>
              <p>Customer Satisfaction</p>
            </div>
            <div className="stat-item">
              <h3>24/7</h3>
              <p>AI Support</p>
            </div>
          </div>
        </div>

        <section id="features" className="features-section">
          <h2>Powerful Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🤖</div>
              <h3>Smart Automation</h3>
              <p>Automate repetitive tasks and workflows with our intelligent AI system. Save time and reduce errors.</p>
              <ul className="feature-list">
                <li>Task automation</li>
                <li>Workflow optimization</li>
                <li>Error reduction</li>
              </ul>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Data-Driven Insights</h3>
              <p>Make informed decisions with real-time analytics and predictive insights.</p>
              <ul className="feature-list">
                <li>Real-time analytics</li>
                <li>Predictive insights</li>
                <li>Custom reports</li>
              </ul>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💬</div>
              <h3>24/7 AI Support</h3>
              <p>Get instant assistance whenever you need it with our advanced AI chatbot.</p>
              <ul className="feature-list">
                <li>Instant responses</li>
                <li>Multi-language support</li>
                <li>Context-aware assistance</li>
              </ul>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="how-it-works-section">
          <h2>How It Works</h2>
          <div className="steps-container">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Connect Your Data</h3>
              <p>Integrate your existing systems and data sources with our platform.</p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <h3>Configure AI</h3>
              <p>Set up your AI preferences and automation rules.</p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <h3>Start Growing</h3>
              <p>Watch as our AI helps optimize your operations and drive growth.</p>
            </div>
          </div>
        </section>

        <section id="pricing" className="pricing-section">
          <h2>Simple, Transparent Pricing</h2>
          <div className="pricing-grid">
            <div className="pricing-card">
              <h3>Starter</h3>
              <div className="price">$49<span>/month</span></div>
              <ul className="pricing-features">
                <li>Basic AI automation</li>
                <li>5 user accounts</li>
                <li>Email support</li>
                <li>Basic analytics</li>
              </ul>
              <button className="pricing-button">Get Started</button>
            </div>
            <div className="pricing-card featured">
              <div className="featured-badge">Most Popular</div>
              <h3>Professional</h3>
              <div className="price">$99<span>/month</span></div>
              <ul className="pricing-features">
                <li>Advanced AI features</li>
                <li>15 user accounts</li>
                <li>Priority support</li>
                <li>Advanced analytics</li>
                <li>Custom integrations</li>
              </ul>
              <button className="pricing-button">Get Started</button>
            </div>
            <div className="pricing-card">
              <h3>Enterprise</h3>
              <div className="price">Custom</div>
              <ul className="pricing-features">
                <li>Full AI capabilities</li>
                <li>Unlimited users</li>
                <li>24/7 dedicated support</li>
                <li>Custom solutions</li>
                <li>API access</li>
              </ul>
              <button className="pricing-button">Contact Sales</button>
            </div>
          </div>
        </section>

        <section className="testimonials-section">
          <h2>What Our Customers Say</h2>
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <p className="testimonial-text">"GrowEasy AI has transformed how we handle customer support. The AI automation has reduced our response time by 80%."</p>
              <div className="testimonial-author">
                <div className="author-name">Sarah Johnson</div>
                <div className="author-title">CEO, TechStart Inc.</div>
              </div>
            </div>
            <div className="testimonial-card">
              <p className="testimonial-text">"The insights provided by GrowEasy AI have been invaluable for our growth strategy. It's like having a data scientist on the team."</p>
              <div className="testimonial-author">
                <div className="author-name">Michael Chen</div>
                <div className="author-title">CTO, GrowthLabs</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>GrowEasy AI</h4>
            <p>Your partner in business growth and automation.</p>
          </div>
          <div className="footer-section">
            <h4>Quick Links</h4>
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#pricing">Pricing</a>
          </div>
          <div className="footer-section">
            <h4>Contact</h4>
            <p>Email: support@groweasy.ai</p>
            <p>Phone: (555) 123-4567</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2024 GrowEasy AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage; 