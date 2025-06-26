import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  const [isVerified, setIsVerified] = useState(false);
  const [featuredProperties, setFeaturedProperties] = useState([]);
  const [marketStats, setMarketStats] = useState({
    propertiesMinted: 0,
    totalVolume: 0,
    activeUsers: 0
  });

  useEffect(() => {
    // Check if user is verified
    const verifiedUsers = JSON.parse(localStorage.getItem('verifiedUsers')) || [];
    // For demo - if there's any verified user, we'll consider this user as verified
    if (verifiedUsers.length > 0) {
      setIsVerified(true);
    }

    // Mock data for featured properties
const mockProperties = [
  {
    id: 'prop001',
    title: 'Luxury Apartment in Downtown',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    price: '45.5',
    location: 'New York, NY',
    bedrooms: 3,
    bathrooms: 2,
    area: '1,850'
  },
  {
    id: 'prop002',
    title: 'Beachfront Villa',
    image: 'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=800&q=80',
    price: '120',
    location: 'Miami, FL',
    bedrooms: 5,
    bathrooms: 4,
    area: '3,200'
  },
  {
  id: 'prop003',
  title: 'Modern Studio Loft',
  image: 'https://images.unsplash.com/photo-1615874959474-d609969a20ed?auto=format&fit=crop&w=800&q=80',
  price: '28.8',
  location: 'San Francisco, CA',
  bedrooms: 1,
  bathrooms: 1,
  area: '750'
}

];

    setFeaturedProperties(mockProperties);
    
    
  }, []);

  return (
    <>
      <div className="hero">
        <div className="container">
          <h1>Revolutionizing Real Estate with Blockchain</h1>
          <p className="hero-subtitle">
            Buy, sell, and invest in properties with the security and transparency of NFTs.
            Experience faster transactions, lower fees, and immutable proof of ownership.
          </p>
          <div className="hero-buttons">
            {isVerified ? (
              <>
                <Link to="/properties" className="btn btn-primary">Browse Properties</Link>
                <Link to="/mint" className="btn btn-secondary">Mint Your Property</Link>
              </>
            ) : (
              <>
                <Link to="/properties" className="btn btn-primary">Explore Properties</Link>
                <Link to="/register" className="btn btn-secondary">Get Verified</Link>
              </>
            )}
          </div>
          
          <div className="market-stats">
            <div className="stat">
              <span className="stat-value">{marketStats.propertiesMinted}</span>
              <span className="stat-label">Properties Minted</span>
            </div>
            <div className="stat">
              <span className="stat-value">{marketStats.totalVolume.toLocaleString()} ETH</span>
              <span className="stat-label">Total Volume</span>
            </div>
            <div className="stat">
              <span className="stat-value">{marketStats.activeUsers}</span>
              <span className="stat-label">Active Users</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="features">
        <div className="container">
          <h2 className="section-title">Why Choose NFT Real Estate</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Secure Ownership</h3>
              <p>Blockchain-backed property rights that are immutable and verifiable, eliminating title fraud.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Fast Transfers</h3>
              <p>Transfer property ownership in minutes, not months. No lengthy closing processes.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">💸</div>
              <h3>Lower Costs</h3>
              <p>Eliminate intermediaries and reduce transaction fees by up to 80% compared to traditional methods.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🌐</div>
              <h3>Global Access</h3>
              <p>Invest in international properties without barriers. Open market 24/7 from anywhere.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Fractional Ownership</h3>
              <p>Own portions of premium properties through tokenization, reducing entry barriers.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>Smart Contracts</h3>
              <p>Automated processes for rent collection, property transfers, and maintenance funds.</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="featured-properties">
        <div className="container">
          <h2 className="section-title">Featured Properties</h2>
          <div className="properties-slider">
            {featuredProperties.map(property => (
              <div className="property-card" key={property.id}>
                <div className="property-image">
                  <img src={property.image} alt={property.title} />
                  <div className="property-price">{property.price} ETH</div>
                </div>
                <div className="property-details">
                  <h3>{property.title}</h3>
                  <div className="property-location">{property.location}</div>
                  <div className="property-specs">
                    <span>{property.bedrooms} beds</span>
                    <span>{property.bathrooms} baths</span>
                    <span>{property.area} sq ft</span>
                  </div>
                  <Link to={`/property/${property.id}`} className="btn btn-outline">View Details</Link>
                </div>
              </div>
            ))}
          </div>
          <div className="view-all-link">
            <Link to="/properties">View All Properties →</Link>
          </div>
        </div>
      </div>
      
      <div className="how-it-works">
        <div className="container">
          <h2 className="section-title">How It Works</h2>
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Register & Get Verified</h3>
              <p>Complete KYC verification to ensure security and compliance with regulations.</p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <h3>Connect Your Wallet</h3>
              <p>Link your Ethereum wallet to buy, sell, and manage your property NFTs.</p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <h3>Browse or List Properties</h3>
              <p>Explore available NFT properties or list your own real estate for sale.</p>
            </div>
            <div className="step">
              <div className="step-number">4</div>
              <h3>Secure transactions</h3>
              <p>Complete transactions securely through blockchain-backed smart contracts.</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="cta-section">
        <div className="container">
          <h2>Ready to Transform Your Real Estate Experience?</h2>
          <p className="cta-subtitle">
            <strong>Create your free account and get verified to start buying, selling, and trading property NFTs</strong>
          </p>
          <Link to="/register" className="btn btn-primary btn-large">
            <span className="btn-icon">👤</span>
            Register & Get Verified Now
          </Link>
        </div>
      </div>
    </>
  );
};

export default Home;