import { useNavigate } from 'react-router-dom';
import { Icons } from '../../utils/icons';
import './Landing.css';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="landing">
      {/* Floating Orbs — soft 3D background decoration */}
      <div className="hero-orb orb-1" />
      <div className="hero-orb orb-2" />
      <div className="hero-orb orb-3" />

      <div className="landing-container">
        {/* Header */}
        <header className="landing-header">
          <div className="logo">
            <div className="logo-mark">A</div>
            <span className="logo-text">AssignTify</span>
          </div>
          <nav className="landing-nav">
            <button
              className="nav-link"
              onClick={() => navigate('/login')}
            >
              Log In
            </button>
          </nav>
        </header>

        {/* Hero Section */}
        <section className="hero">
          <div className="hero-content">
            <div className="hero-badge">Your Study Companion</div>
            <h1 className="hero-title">
              Start today, stress less tomorrow.
            </h1>
            <p className="hero-subtitle landing-description-text">
              AssignTify helps students organise deadlines, focus on one task at
              a time, and feel more in control during busy study periods — without the overwhelm.
            </p>
            <div className="hero-buttons">
              <button
                className="btn btn-primary"
                onClick={() => navigate('/register')}
              >
                Get Started
              </button>
            </div>
          </div>

          {/* 3D-Style Dashboard Preview */}
          <div className="hero-illustration">
            <div className="illustration-card-3d">
              {/* Window Chrome */}
              <div className="preview-chrome">
                <span className="preview-dot red" />
                <span className="preview-dot yellow" />
                <span className="preview-dot green" />
              </div>

              {/* Mini Sidebar */}
              <div className="preview-body">
                <div className="preview-sidebar">
                  <div className="preview-sidebar-logo">A</div>
                  <div className="preview-sidebar-item active" />
                  <div className="preview-sidebar-item" />
                  <div className="preview-sidebar-item" />
                  <div className="preview-sidebar-item" />
                </div>

                <div className="preview-main">
                  {/* Greeting */}
                  <div className="preview-greeting">
                    <div className="preview-greeting-text" />
                    <div className="preview-greeting-sub" />
                  </div>

                  {/* Focus Card */}
                  <div className="preview-focus-card">
                    <div className="preview-focus-badge">HIGH</div>
                    <div className="preview-focus-title">Essay Draft</div>
                    <div className="preview-focus-meta">
                      <span className="preview-meta-pill">Due: Jun 5</span>
                      <span className="preview-meta-pill">2 days left</span>
                    </div>
                    <div className="preview-focus-action">View Details →</div>
                  </div>

                  {/* Mini Stats */}
                  <div className="preview-stats-row">
                    <div className="preview-mini-stat blue">
                      <div className="preview-mini-stat-val">4</div>
                      <div className="preview-mini-stat-label">Active</div>
                    </div>
                    <div className="preview-mini-stat green">
                      <div className="preview-mini-stat-val">2</div>
                      <div className="preview-mini-stat-label">Done</div>
                    </div>
                    <div className="preview-mini-stat amber">
                      <div className="preview-mini-stat-val">1</div>
                      <div className="preview-mini-stat-label">Urgent</div>
                    </div>
                  </div>

                  {/* Task Rows */}
                  <div className="preview-task-row">
                    <span className="task-indicator medium" />
                    <span className="preview-task-name" />
                    <span className="task-risk medium">MED</span>
                  </div>
                  <div className="preview-task-row">
                    <span className="task-indicator low" />
                    <span className="preview-task-name short" />
                    <span className="task-risk low">LOW</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="features">
          <h2 className="features-title">How AssignTify helps</h2>
          <p className="features-subtitle">
              Designed to help you feel calm, organised, and in control — not overwhelmed.
          </p>
          <div className="features-grid">
            <div className="feature-card card-animate">
              <div className="feature-icon-wrapper blue">{Icons.target}</div>
              <h3>Today's Focus</h3>
              <p>
                See exactly which task matters most right now — no guesswork, no stress.
              </p>
            </div>
            <div className="feature-card card-animate">
              <div className="feature-icon-wrapper purple">{Icons.bell}</div>
              <h3>Gentle Reminders</h3>
              <p>
                Calm, timely nudges before deadlines creep up. No alarms, just awareness.
              </p>
            </div>
            <div className="feature-card card-animate">
              <div className="feature-icon-wrapper green">{Icons.calendar}</div>
              <h3>Study Plan</h3>
              <p>
                Break big assignments into small, manageable daily steps.
              </p>
            </div>
            <div className="feature-card card-animate">
              <div className="feature-icon-wrapper amber">{Icons.trendingUp}</div>
              <h3>Progress Check</h3>
              <p>
                Track how you're doing at a glance — no pressure, just clarity.
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="landing-footer">
          <p>AssignTify &copy; {new Date().getFullYear()} — Built for students, with care</p>
        </footer>
      </div>
    </div>
  );
};

export default Landing;