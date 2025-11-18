// src/pages/MainPage.jsx
import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { animate, createScope, stagger } from 'animejs';
import { onScroll } from 'animejs/events';
import SubscriptionList from '../components/SubscriptionList';

function MainPage() {
  const navigate = useNavigate();
  
  // Refs for anime.js animations
  const rootRef = useRef(null);
  const scope = useRef(null);

  // Initial page load animations using anime.js v4
  useEffect(() => {
    if (!rootRef.current) return;

    // Set initial opacity to 0 for elements that will animate
    const animateElements = rootRef.current.querySelectorAll('[data-animate]');
    animateElements.forEach(el => {
      el.style.opacity = '0';
    });

    scope.current = createScope({ root: rootRef }).add(self => {
      // Hero section animations with dramatic entrance
      const heroSection = rootRef.current.querySelector('[data-section="hero"]');
      if (heroSection) {
        // Main title with elastic bounce effect
        animate(heroSection.querySelector('h1'), {
          opacity: [0, 1],
          translateY: [-50, 0],
          scale: [0.8, 1],
          rotate: ['-5deg', '0deg'],
          duration: 1400,
          ease: 'out(4)' // Stronger bounce
        });

        // Subtitle with wave effect
        const subtitleChars = heroSection.querySelector('p');
        if (subtitleChars) {
          animate(subtitleChars, {
            opacity: [0, 1],
            translateY: [30, 0],
            duration: 1000,
            delay: 400,
            ease: 'out(3)'
          });
        }

        // Buttons with stagger + scale pulse
        const buttons = heroSection.querySelectorAll('button');
        animate(buttons, {
          opacity: [0, 1],
          translateY: [30, 0],
          scale: [0.8, 1],
          duration: 900,
          delay: stagger(120, {start: 600}),
          ease: 'out(4)'
        });
        
        // Add continuous subtle pulse to primary button
        if (buttons.length > 0) {
          animate(buttons[0], {
            scale: [1, 1.05, 1],
            duration: 2000,
            loop: true,
            ease: 'inOut(2)'
          });
        }
      }

      // Scroll-triggered animations for stats section with number counter effect
      const statsSection = rootRef.current.querySelector('[data-section="stats"]');
      if (statsSection) {
        const statCards = statsSection.querySelectorAll('[data-animate="stat-card"]');
        
        onScroll({
          target: statsSection,
          onEnter: () => {
            // Cards appear with rotation
            animate(statCards, {
              opacity: [0, 1],
              translateY: [60, 0],
              rotateX: ['90deg', '0deg'],
              duration: 900,
              delay: stagger(150),
              ease: 'out(4)'
            });
            
            // Add shimmer effect to stat numbers
            const statNumbers = statsSection.querySelectorAll('.stat-number');
            statNumbers.forEach((num, index) => {
              setTimeout(() => {
                animate(num, {
                  scale: [1, 1.2, 1],
                  duration: 600,
                  ease: 'inOut(3)'
                });
              }, index * 150 + 500);
            });
          }
        });
      }

      // Features cards animation with flip effect
      const featuresSection = rootRef.current.querySelector('[data-section="features"]');
      if (featuresSection) {
        const featureCards = featuresSection.querySelectorAll('[data-animate="feature-card"]');
        
        onScroll({
          target: featuresSection,
          onEnter: () => {
            // Cards flip in from the side
            animate(featureCards, {
              opacity: [0, 1],
              translateY: [80, 0],
              rotateY: ['-90deg', '0deg'],
              scale: [0.7, 1],
              duration: 1200,
              delay: stagger(150, {start: 200}),
              ease: 'out(4)'
            });
            
            // Feature icons bounce after cards appear
            const icons = featuresSection.querySelectorAll('[data-animate="feature-card"] > div:first-child');
            icons.forEach((icon, index) => {
              setTimeout(() => {
                animate(icon, {
                  translateY: [0, -15, 0],
                  duration: 800,
                  ease: 'out(3)'
                });
              }, index * 150 + 1000);
            });
          }
        });
      }

      // Gaming stats animation with explosive entrance
      const gamingStatsSection = rootRef.current.querySelector('[data-section="gaming-stats"]');
      if (gamingStatsSection) {
        const gamingCards = gamingStatsSection.querySelectorAll('[data-animate="gaming-stat-card"]');
        
        onScroll({
          target: gamingStatsSection,
          onEnter: () => {
            // Cards explode into view from center
            animate(gamingCards, {
              opacity: [0, 1],
              scale: [0, 1.1, 1],
              rotate: ['180deg', '0deg'],
              duration: 1000,
              delay: stagger(120),
              ease: 'out(5)'
            });
            
            // Add continuous subtle glow pulse to cards
            setTimeout(() => {
              gamingCards.forEach(card => {
                animate(card, {
                  scale: [1, 1.02, 1],
                  duration: 2500,
                  loop: true,
                  ease: 'inOut(2)'
                });
              });
            }, 1200);
          }
        });
      }

      // Partners animation with wave pattern
      const partnersSection = rootRef.current.querySelector('[data-section="partners"]');
      if (partnersSection) {
        const partnerItems = partnersSection.querySelectorAll('[data-animate="partner-item"]');
        const trustBadges = partnersSection.querySelectorAll('[data-animate="trust-badge"]');
        
        onScroll({
          target: partnersSection,
          onEnter: () => {
            // Partner logos with wave from both sides
            animate(partnerItems, {
              opacity: [0, 1],
              translateX: (el, i) => [i % 2 === 0 ? -60 : 60, 0],
              translateY: [30, 0],
              rotate: (el, i) => [i % 2 === 0 ? '-15deg' : '15deg', '0deg'],
              duration: 800,
              delay: stagger(100, {from: 'center'}),
              ease: 'out(4)'
            });

            // Trust badges pop up with bounce
            animate(trustBadges, {
              opacity: [0, 1],
              scale: [0, 1.2, 1],
              translateY: [50, 0],
              duration: 700,
              delay: stagger(120, {start: 600}),
              ease: 'out(5)'
            });
            
            // Add hover-like float to badges
            setTimeout(() => {
              trustBadges.forEach((badge, i) => {
                animate(badge, {
                  translateY: [0, -8, 0],
                  duration: 2000 + (i * 200),
                  loop: true,
                  ease: 'inOut(2)'
                });
              });
            }, 1500);
          }
        });
      }

      // Testimonials animation with 3D flip
      const testimonialsSection = rootRef.current.querySelector('[data-section="testimonials"]');
      if (testimonialsSection) {
        const testimonialCards = testimonialsSection.querySelectorAll('[data-animate="testimonial-card"]');
        
        onScroll({
          target: testimonialsSection,
          onEnter: () => {
            // Cards flip in 3D
            animate(testimonialCards, {
              opacity: [0, 1],
              translateZ: [-200, 0],
              rotateY: ['90deg', '0deg'],
              translateY: [50, 0],
              duration: 1100,
              delay: stagger(180),
              ease: 'out(4)'
            });
            
            // Add subtle sway animation to cards
            setTimeout(() => {
              testimonialCards.forEach((card, i) => {
                animate(card, {
                  rotateY: ['-2deg', '2deg', '-2deg'],
                  duration: 3000 + (i * 300),
                  loop: true,
                  ease: 'inOut(2)'
                });
              });
            }, 1300);
          }
        });
      }

      // FAQ animation with ripple effect
      const faqSection = rootRef.current.querySelector('[data-section="faq"]');
      if (faqSection) {
        const faqItems = faqSection.querySelectorAll('[data-animate="faq-item"]');
        
        onScroll({
          target: faqSection,
          onEnter: () => {
            // Items cascade in with stagger from center
            animate(faqItems, {
              opacity: [0, 1],
              translateX: [-80, 0],
              scale: [0.8, 1],
              duration: 700,
              delay: stagger(90, {from: 'center', ease: 'out(2)'}),
              ease: 'out(4)'
            });
            
            // Add subtle shake to draw attention
            setTimeout(() => {
              animate(faqItems[0], {
                translateX: [-3, 3, -3, 0],
                duration: 400,
                ease: 'inOut(2)'
              });
            }, 800);
          }
        });
      }

      // CTA section animation with spotlight effect
      const ctaSection = rootRef.current.querySelector('[data-section="cta"]');
      if (ctaSection) {
        const ctaContent = ctaSection.querySelector('[data-animate="cta-content"]');
        
        onScroll({
          target: ctaSection,
          onEnter: () => {
            // Dramatic zoom-in entrance
            animate(ctaContent, {
              opacity: [0, 1],
              scale: [0.5, 1.05, 1],
              translateY: [100, 0],
              rotate: ['-5deg', '0deg'],
              duration: 1200,
              ease: 'out(5)'
            });
            
            // Add continuous attention pulse to CTA button
            setTimeout(() => {
              const ctaButton = ctaContent.querySelector('button');
              if (ctaButton) {
                animate(ctaButton, {
                  scale: [1, 1.08, 1],
                  boxShadow: [
                    '0 0 0 0 rgba(34, 197, 94, 0)',
                    '0 0 20px 10px rgba(34, 197, 94, 0.3)',
                    '0 0 0 0 rgba(34, 197, 94, 0)'
                  ],
                  duration: 2000,
                  loop: true,
                  ease: 'inOut(2)'
                });
              }
            }, 1200);
          }
        });
      }
    });

    // Cleanup on unmount
    return () => scope.current?.revert();
  }, []);


  const handlePlanSelection = React.useCallback((plan) => {
    // For non-authenticated users, redirect to signup
    navigate('/signup');
  }, [navigate]);

  const features = [
    {
      icon: '🎮',
      title: 'Unlimited Games',
      description: 'Access thousands of premium games across all genres'
    },
    {
      icon: '⚡',
      title: 'Instant Play',
      description: 'No downloads, no waiting. Start playing immediately'
    },
    {
      icon: '🌐',
      title: 'Cross-Platform',
      description: 'Play on any device, anywhere, anytime'
    },
    {
      icon: '🎯',
      title: 'Exclusive Titles',
      description: 'Get early access to new releases and exclusive content'
    }
  ];

  const testimonials = [
    {
      name: 'Alex Johnson',
      role: 'Pro Gamer',
      comment: 'PlayAtac revolutionized my gaming experience. The library is incredible!',
      rating: 5
    },
    {
      name: 'Sarah Miller',
      role: 'Casual Player',
      comment: 'Best value for money. I can try new games without breaking the bank.',
      rating: 5
    },
    {
      name: 'Mike Chen',
      role: 'Game Enthusiast',
      comment: 'The instant play feature is a game-changer. No more storage issues!',
      rating: 5
    }
  ];

  const faqs = [
    {
      question: 'Can I cancel anytime?',
      answer: 'Yes! All our plans are flexible. You can cancel or change your subscription at any time with no penalties.'
    },
    {
      question: 'How many devices can I use?',
      answer: 'You can play on unlimited devices with your account, but only on one device at a time.'
    },
    {
      question: 'Are there any hidden fees?',
      answer: 'No hidden fees! The price you see is the price you pay. All games included in your subscription are free to play.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards, debit cards, and secure online payment methods through Stripe.'
    }
  ];

  return (
    <div ref={rootRef} style={{ 
      backgroundColor: '#000000',
      minHeight: '100vh',
      color: '#ffffff'
    }}>
      {/* Hero Section */}
      <section data-section="hero" style={{
        background: 'linear-gradient(180deg, #000000 0%, #0a0a0a 100%)',
        padding: '6rem 2rem 4rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Animated background elements */}
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '10%',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(34, 197, 94, 0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(60px)',
          animation: 'float 6s ease-in-out infinite'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '10%',
          right: '10%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(60px)',
          animation: 'float 8s ease-in-out infinite reverse'
        }} />
        
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{
            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
            fontWeight: '900',
            marginBottom: '1.5rem',
            background: 'linear-gradient(135deg, #ffffff 0%, #22c55e 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            lineHeight: '1.2'
          }}>
            Welcome to PlayAtac
          </h1>
          <p style={{
            fontSize: 'clamp(1.1rem, 2vw, 1.5rem)',
            color: '#9ca3af',
            marginBottom: '2rem',
            maxWidth: '700px',
            margin: '0 auto 2rem',
            lineHeight: '1.6'
          }}>
            Your gateway to unlimited gaming. Choose your plan and dive into thousands of premium games instantly.
          </p>
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginTop: '2.5rem'
          }}>
            <button
              onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
              style={{
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                color: '#000',
                border: 'none',
                padding: '1rem 2.5rem',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 20px rgba(34, 197, 94, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 25px rgba(34, 197, 94, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 20px rgba(34, 197, 94, 0.3)';
              }}
            >
              Get Started Free
            </button>
            <button
              onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
              style={{
                background: 'transparent',
                color: '#fff',
                border: '2px solid #22c55e',
                padding: '1rem 2.5rem',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(34, 197, 94, 0.1)';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              View Plans
            </button>
          </div>
        </div>

        {/* Add keyframe animations */}
        <style>{`
          @keyframes float {
            0%, 100% { transform: translate(0, 0); }
            50% { transform: translate(20px, 20px); }
          }
        `}</style>
      </section>

      {/* Stats Section */}
      <section data-section="stats" style={{
        padding: '4rem 2rem',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #000000 100%)',
        borderTop: '1px solid #1a1a1a'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '3rem',
            textAlign: 'center'
          }}>
            <div data-animate="stat-card">
              <div className="stat-number" style={{
                fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                fontWeight: '900',
                background: 'linear-gradient(135deg, #22c55e 0%, #10b981 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                marginBottom: '0.5rem'
              }}>
                150K+
              </div>
              <p style={{
                color: '#9ca3af',
                fontSize: '1.1rem',
                fontWeight: '600'
              }}>
                Active Players
              </p>
            </div>
            <div data-animate="stat-card">
              <div className="stat-number" style={{
                fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                fontWeight: '900',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                marginBottom: '0.5rem'
              }}>
                5,000+
              </div>
              <p style={{
                color: '#9ca3af',
                fontSize: '1.1rem',
                fontWeight: '600'
              }}>
                Games Available
              </p>
            </div>
            <div data-animate="stat-card">
              <div className="stat-number" style={{
                fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                fontWeight: '900',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                marginBottom: '0.5rem'
              }}>
                99.9%
              </div>
              <p style={{
                color: '#9ca3af',
                fontSize: '1.1rem',
                fontWeight: '600'
              }}>
                Uptime
              </p>
            </div>
            <div data-animate="stat-card">
              <div className="stat-number" style={{
                fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                fontWeight: '900',
                background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                marginBottom: '0.5rem'
              }}>
                24/7
              </div>
              <p style={{
                color: '#9ca3af',
                fontSize: '1.1rem',
                fontWeight: '600'
              }}>
                Support
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section data-section="features" style={{
        padding: '5rem 2rem',
        background: '#000000',
        borderTop: '1px solid #1a1a1a'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: '800',
            textAlign: 'center',
            marginBottom: '1rem',
            color: '#fff'
          }}>
            Why Choose PlayAtac?
          </h2>
          <p style={{
            textAlign: 'center',
            color: '#9ca3af',
            fontSize: '1.1rem',
            marginBottom: '4rem',
            maxWidth: '600px',
            margin: '0 auto 4rem'
          }}>
            Everything you need for the ultimate gaming experience
          </p>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '2rem',
            maxWidth: '1400px',
            margin: '0 auto'
          }}>
            {features.map((feature, index) => (
              <div
                key={index}
                data-animate="feature-card"
                style={{
                  background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
                  padding: '2.5rem',
                  borderRadius: '16px',
                  border: '1px solid #222',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.borderColor = '#22c55e';
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(34, 197, 94, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = '#222';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  fontSize: '3rem',
                  marginBottom: '1rem'
                }}>
                  {feature.icon}
                </div>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  marginBottom: '0.75rem',
                  color: '#fff'
                }}>
                  {feature.title}
                </h3>
                <p style={{
                  color: '#9ca3af',
                  lineHeight: '1.6'
                }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" style={{
        padding: '5rem 2rem',
        background: 'linear-gradient(180deg, #000000 0%, #0a0a0a 100%)',
        borderTop: '1px solid #1a1a1a'
      }}>
        <SubscriptionList 
          selectedPlan={null}
          handlePlanSelection={handlePlanSelection}
          user={null}
        />
      </section>

      {/* Gaming Stats Section */}
      <section data-section="gaming-stats" style={{
        padding: '5rem 2rem',
        background: '#000000',
        borderTop: '1px solid #1a1a1a'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: '800',
            textAlign: 'center',
            marginBottom: '1rem',
            color: '#fff'
          }}>
            Gaming by the Numbers
          </h2>
          <p style={{
            textAlign: 'center',
            color: '#9ca3af',
            fontSize: '1.1rem',
            marginBottom: '4rem'
          }}>
            Real-time statistics from our gaming community
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '2rem'
          }}>
            <div data-animate="gaming-stat-card" style={{
              background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
              padding: '2.5rem',
              borderRadius: '16px',
              border: '1px solid #22c55e',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: '-50%',
                right: '-50%',
                width: '200px',
                height: '200px',
                background: 'radial-gradient(circle, rgba(34, 197, 94, 0.1) 0%, transparent 70%)',
                borderRadius: '50%'
              }} />
              <div style={{
                fontSize: '3rem',
                marginBottom: '1rem'
              }}>🎮</div>
              <div style={{
                fontSize: '2.5rem',
                fontWeight: '900',
                color: '#22c55e',
                marginBottom: '0.5rem'
              }}>
                2.5M+
              </div>
              <p style={{
                color: '#9ca3af',
                fontSize: '1.1rem'
              }}>
                Hours Played This Month
              </p>
            </div>

            <div data-animate="gaming-stat-card" style={{
              background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
              padding: '2.5rem',
              borderRadius: '16px',
              border: '1px solid #3b82f6',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: '-50%',
                right: '-50%',
                width: '200px',
                height: '200px',
                background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
                borderRadius: '50%'
              }} />
              <div style={{
                fontSize: '3rem',
                marginBottom: '1rem'
              }}>👥</div>
              <div style={{
                fontSize: '2.5rem',
                fontWeight: '900',
                color: '#3b82f6',
                marginBottom: '0.5rem'
              }}>
                85K
              </div>
              <p style={{
                color: '#9ca3af',
                fontSize: '1.1rem'
              }}>
                Players Online Now
              </p>
            </div>

            <div data-animate="gaming-stat-card" style={{
              background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
              padding: '2.5rem',
              borderRadius: '16px',
              border: '1px solid #f59e0b',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: '-50%',
                right: '-50%',
                width: '200px',
                height: '200px',
                background: 'radial-gradient(circle, rgba(245, 158, 11, 0.1) 0%, transparent 70%)',
                borderRadius: '50%'
              }} />
              <div style={{
                fontSize: '3rem',
                marginBottom: '1rem'
              }}>⭐</div>
              <div style={{
                fontSize: '2.5rem',
                fontWeight: '900',
                color: '#f59e0b',
                marginBottom: '0.5rem'
              }}>
                4.9/5
              </div>
              <p style={{
                color: '#9ca3af',
                fontSize: '1.1rem'
              }}>
                Average User Rating
              </p>
            </div>

            <div data-animate="gaming-stat-card" style={{
              background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
              padding: '2.5rem',
              borderRadius: '16px',
              border: '1px solid #ec4899',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: '-50%',
                right: '-50%',
                width: '200px',
                height: '200px',
                background: 'radial-gradient(circle, rgba(236, 72, 153, 0.1) 0%, transparent 70%)',
                borderRadius: '50%'
              }} />
              <div style={{
                fontSize: '3rem',
                marginBottom: '1rem'
              }}>🏆</div>
              <div style={{
                fontSize: '2.5rem',
                fontWeight: '900',
                color: '#ec4899',
                marginBottom: '0.5rem'
              }}>
                500+
              </div>
              <p style={{
                color: '#9ca3af',
                fontSize: '1.1rem'
              }}>
                New Games Added Monthly
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Partners/Trust Section */}
      <section data-section="partners" style={{
        padding: '5rem 2rem',
        background: 'linear-gradient(180deg, #000000 0%, #0a0a0a 100%)',
        borderTop: '1px solid #1a1a1a'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: '800',
            textAlign: 'center',
            marginBottom: '1rem',
            color: '#fff'
          }}>
            Trusted by Gaming Partners
          </h2>
          <p style={{
            textAlign: 'center',
            color: '#9ca3af',
            fontSize: '1.1rem',
            marginBottom: '4rem'
          }}>
            Working with leading game publishers and studios
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '2rem',
            alignItems: 'center',
            justifyItems: 'center',
            marginBottom: '4rem',
            maxWidth: '900px',
            margin: '0 auto 4rem'
          }}>
            {['Epic Games', 'Ubisoft', 'EA Sports', 'Riot Games', 'Blizzard', 'Steam'].map((partner, index) => (
              <div
                key={index}
                data-animate="partner-item"
                style={{
                  color: '#6b7280',
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  padding: '1.5rem 2rem',
                  background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
                  borderRadius: '12px',
                  border: '1px solid #222',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'center'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#22c55e';
                  e.currentTarget.style.borderColor = '#22c55e';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#6b7280';
                  e.currentTarget.style.borderColor = '#222';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                {partner}
              </div>
            ))}
          </div>

          {/* Trust Badges */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '2rem',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <div data-animate="trust-badge" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '1rem 1.5rem',
              background: 'rgba(34, 197, 94, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(34, 197, 94, 0.3)'
            }}>
              <span style={{ fontSize: '1.5rem' }}>🔒</span>
              <div style={{background: 'transparent'}}>
                <p style={{ color: '#22c55e', fontWeight: '600', fontSize: '0.9rem' }}>
                  Secure Payments
                </p>
                <p style={{ color: '#9ca3af', fontSize: '0.8rem' }}>
                  256-bit SSL Encryption
                </p>
              </div>
            </div>

            <div data-animate="trust-badge" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '1rem 1.5rem',
              background: 'rgba(59, 130, 246, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(59, 130, 246, 0.3)'
            }}>
              <span style={{ fontSize: '1.5rem' }}>✅</span>
              <div style={{background: 'transparent'}}>
                <p style={{ color: '#3b82f6', fontWeight: '600', fontSize: '0.9rem' }}>
                  GDPR Compliant
                </p>
                <p style={{ color: '#9ca3af', fontSize: '0.8rem' }}>
                  Your Data Protected
                </p>
              </div>
            </div>

            <div data-animate="trust-badge" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '1rem 1.5rem',
              background: 'rgba(245, 158, 11, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(245, 158, 11, 0.3)'
            }}>
              <span style={{ fontSize: '1.5rem' }}>💳</span>
              <div style={{background: 'transparent'}}>
                <p style={{ color: '#f59e0b', fontWeight: '600', fontSize: '0.9rem' }}>
                  Money-Back Guarantee
                </p>
                <p style={{ color: '#9ca3af', fontSize: '0.8rem' }}>
                  30-Day Refund Policy
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section data-section="testimonials" style={{
        padding: '5rem 2rem',
        background: '#000000',
        borderTop: '1px solid #1a1a1a'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: '800',
            textAlign: 'center',
            marginBottom: '1rem',
            color: '#fff'
          }}>
            Loved by Gamers Worldwide
          </h2>
          <p style={{
            textAlign: 'center',
            color: '#9ca3af',
            fontSize: '1.1rem',
            marginBottom: '4rem'
          }}>
            Join thousands of satisfied players
          </p>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '2rem'
          }}>
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                data-animate="testimonial-card"
                style={{
                  background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
                  padding: '2rem',
                  borderRadius: '16px',
                  border: '1px solid #222',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#22c55e';
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#222';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <div style={{
                  display: 'flex',
                  gap: '0.25rem',
                  marginBottom: '1rem'
                }}>
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} style={{ color: '#22c55e', fontSize: '1.25rem' }}>★</span>
                  ))}
                </div>
                <p style={{
                  color: '#e5e7eb',
                  fontSize: '1.05rem',
                  lineHeight: '1.6',
                  marginBottom: '1.5rem',
                  fontStyle: 'italic'
                }}>
                  "{testimonial.comment}"
                </p>
                <div>
                  <p style={{
                    color: '#fff',
                    fontWeight: '600',
                    marginBottom: '0.25rem'
                  }}>
                    {testimonial.name}
                  </p>
                  <p style={{
                    color: '#9ca3af',
                    fontSize: '0.9rem'
                  }}>
                    {testimonial.role}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section data-section="faq" style={{
        padding: '5rem 2rem',
        background: 'linear-gradient(180deg, #000000 0%, #0a0a0a 100%)',
        borderTop: '1px solid #1a1a1a'
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: '800',
            textAlign: 'center',
            marginBottom: '1rem',
            color: '#fff'
          }}>
            Frequently Asked Questions
          </h2>
          <p style={{
            textAlign: 'center',
            color: '#9ca3af',
            fontSize: '1.1rem',
            marginBottom: '4rem'
          }}>
            Got questions? We've got answers
          </p>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem'
          }}>
            {faqs.map((faq, index) => (
              <div
                key={index}
                data-animate="faq-item"
                style={{
                  background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
                  padding: '2rem',
                  borderRadius: '12px',
                  border: '1px solid #222',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#22c55e';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#222';
                }}
              >
                <h3 style={{
                  color: '#22c55e',
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  marginBottom: '0.75rem'
                }}>
                  {faq.question}
                </h3>
                <p style={{
                  color: '#9ca3af',
                  lineHeight: '1.6',
                  fontSize: '1.05rem'
                }}>
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section data-section="cta" style={{
        padding: '5rem 2rem',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #000000 100%)',
        borderTop: '1px solid #1a1a1a',
        textAlign: 'center'
      }}>
        <div data-animate="cta-content" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: '800',
            marginBottom: '1rem',
            background: 'linear-gradient(135deg, #ffffff 0%, #22c55e 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Ready to Level Up?
          </h2>
          <p style={{
            color: '#9ca3af',
            fontSize: '1.2rem',
            marginBottom: '2.5rem',
            lineHeight: '1.6'
          }}>
            Start your gaming journey today. No credit card required for the free plan.
          </p>
          <button
            onClick={() => navigate('/signup')}
            style={{
              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
              color: '#000',
              border: 'none',
              padding: '1.25rem 3rem',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 20px rgba(34, 197, 94, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-3px) scale(1.05)';
              e.target.style.boxShadow = '0 8px 30px rgba(34, 197, 94, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0) scale(1)';
              e.target.style.boxShadow = '0 4px 20px rgba(34, 197, 94, 0.3)';
            }}
          >
            Join PlayAtac Now →
          </button>
        </div>
      </section>
    </div>
  );
}

export default MainPage;
