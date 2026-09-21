import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

export const DynamicLoaderCard = ({ platform = 'reddit', keyword = 'AI Agents' }) => {
  const [stepIndex, setStepIndex] = useState(0);

  const getPlatformInfo = (plat) => {
    const p = (plat || 'reddit').toLowerCase();
    if (p === 'twitter') {
      return {
        name: 'Twitter / X',
        icon: '🐦',
        gradient: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
        subtext: 'Scanning tweets, handles, retweets, and engagement analytics.',
      };
    }
    if (p === 'hackernews') {
      return {
        name: 'HackerNews',
        icon: '🟠',
        gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
        subtext: 'Scanning tech stories, developer comments, and points ranking.',
      };
    }
    if (p === 'all') {
      return {
        name: 'All Networks',
        icon: '🌐',
        gradient: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
        subtext: 'Scanning cross-platform feeds across Reddit, Twitter/X, and HackerNews.',
      };
    }
    return {
      name: 'Reddit',
      icon: '🔴',
      gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      subtext: 'Parsing subreddits, community posts, upvotes, and sentiment scores.',
    };
  };

  const platInfo = getPlatformInfo(platform);

  const steps = [
    `Connecting to PulseRed Live Intelligence Engine...`,
    `Querying ${platInfo.name} for "${keyword}"...`,
    `Running AI Sentiment Scoring & Key Phrase Extraction...`,
    `Finalizing record selection & community metrics...`,
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 1200);

    return () => clearInterval(interval);
  }, [steps.length]);

  const progressPercentage = Math.min(95, 25 + stepIndex * 25);

  return (
    <div
      className="glass-card animate-fade-in"
      style={{
        padding: '48px 32px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid var(--glass-border-hover)',
        borderRadius: '24px',
        background: 'var(--card-inner-bg-solid, #0f172a)',
        marginBottom: '28px',
      }}
    >
      {/* Animated Top Glow Accent */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '60%',
          height: '4px',
          background: platInfo.gradient,
          borderRadius: '0 0 8px 8px',
          boxShadow: '0 0 20px rgba(99, 102, 241, 0.6)',
        }}
      />

      {/* Main Spinner & Platform Badge */}
      <div style={{ position: 'relative', display: 'inline-block', marginBottom: '20px' }}>
        <div
          className="spinner"
          style={{
            width: '56px',
            height: '56px',
            border: '3px solid rgba(99, 102, 241, 0.15)',
            borderTopColor: '#818cf8',
            borderRadius: '50%',
            margin: '0 auto',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <span
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '1.3rem',
          }}
        >
          {platInfo.icon}
        </span>
      </div>

      {/* Status Heading */}
      <h4 style={{ fontSize: '1.3rem', fontWeight: '800', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
        Fetching {platInfo.name} Data via PulseRed AI...
      </h4>

      <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', maxWidth: '540px', margin: '0 auto 24px auto', lineHeight: 1.5 }}>
        {platInfo.subtext}
      </p>

      {/* Live Status Step Pill */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(99, 102, 241, 0.12)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          color: '#818cf8',
          padding: '6px 16px',
          borderRadius: '20px',
          fontSize: '0.82rem',
          fontWeight: '700',
          marginBottom: '20px',
        }}
      >
        <Sparkles size={14} />
        <span>Status: {steps[stepIndex]}</span>
      </div>

      {/* Animated Progress Bar */}
      <div
        style={{
          maxWidth: '420px',
          height: '6px',
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '10px',
          margin: '0 auto',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progressPercentage}%`,
            background: platInfo.gradient,
            borderRadius: '10px',
            transition: 'width 0.8s ease',
            boxShadow: '0 0 10px rgba(99, 102, 241, 0.5)',
          }}
        />
      </div>
    </div>
  );
};
