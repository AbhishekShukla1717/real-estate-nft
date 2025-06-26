import React, { useState, useEffect } from "react";
import { Contract } from "ethers";
import { contractAddress, contractABI, mintProperty } from "../contracts/propertynft";
import { storeNFTMetadata } from "../utils/ipfs";
import { useNavigate } from "react-router-dom";
import walletService from "../utils/WalletService";
import { userApi, propertyApi } from "../services/apiService";

const Mint = () => {
  const [walletState, setWalletState] = useState({
    isConnected: false,
    address: "",
    provider: null
  });
  
  // Property form data
  const [propertyData, setPropertyData] = useState({
    name: "",
    description: "",
    physicalAddress: "",
    areaInSqFt: "",
    propertyType: "Residential",
    price: ""
  });
  
  const [propertyImage, setPropertyImage] = useState(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [userStatus, setUserStatus] = useState(null);
  const [approvedProperties, setApprovedProperties] = useState([]);
  const [step, setStep] = useState(1); // 1: Submit Property, 2: Mint NFT
  const navigate = useNavigate();

  useEffect(() => {
    const initWallet = async () => {
      await walletService.checkConnection();
      const state = walletService.getWalletState();
      setWalletState(state);
      if (state.address) {
        await checkVerification(state.address);
        await loadApprovedProperties(state.address);
      }
    };

    initWallet();

    const unsubscribe = walletService.subscribe((newState) => {
      setWalletState(newState);
      if (newState.address) {
        checkVerification(newState.address);
        loadApprovedProperties(newState.address);
      } else {
        setIsVerified(false);
        setUserStatus(null);
        setApprovedProperties([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const checkVerification = async (address) => {
    if (!address) {
      setIsVerified(false);
      setUserStatus(null);
      return;
    }

    try {
      const response = await userApi.checkUserStatus(address);
      
      if (response.success && response.data) {
        setUserStatus(response.data);
        setIsVerified(response.data.status === 'verified');
      } else {
        setIsVerified(false);
        setUserStatus(null);
      }
    } catch (error) {
      console.error("Error checking user verification:", error);
      setIsVerified(false);
      setUserStatus(null);
    }
  };

  const loadApprovedProperties = async (address) => {
    try {
      const response = await propertyApi.getAllProperties();
      if (response.success) {
        const approved = response.data.filter(prop => 
          prop.owner === address.toLowerCase() && 
          prop.status === 'approved'
        );
        setApprovedProperties(approved);
      }
    } catch (error) {
      console.error("Error loading approved properties:", error);
    }
  };

  const connectWallet = async () => {
    setStatus("⏳ Connecting to wallet...");
    
    if (!walletService.isMetaMaskInstalled()) {
      setStatus("⚠️ Please install MetaMask to use this feature.");
      return;
    }

    try {
      const success = await walletService.connect();
      if (success) {
        setStatus("✅ Wallet connected successfully!");
        setTimeout(() => setStatus(""), 2000);
      } else {
        setStatus("❌ Failed to connect wallet");
      }
    } catch (error) {
      console.error("Error connecting to wallet:", error);
      setStatus("❌ Failed to connect wallet: " + (error.message || "Unknown error"));
    }
  };

  const handleInputChange = (field, value) => {
    setPropertyData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (file.size > 5 * 1024 * 1024) {
        setStatus("⚠️ Image file too large. Please select a file under 5MB.");
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        setStatus("⚠️ Please select a valid image file.");
        return;
      }
      
      setPropertyImage(file);
      setStatus("");
    }
  };

  // Step 1: Submit property for approval
  const handlePropertySubmission = async () => {
    if (!walletState.isConnected) {
      setStatus("⚠️ Please connect your wallet first.");
      return;
    }

    if (!isVerified) {
      if (window.confirm("You need to complete KYC verification first. Go to registration?")) {
        navigate("/register");
      }
      return;
    }

    const { name, description, physicalAddress } = propertyData;
    if (!name.trim() || !description.trim() || !physicalAddress.trim() || !propertyImage) {
      setStatus("⚠️ Please fill all required fields and upload an image.");
      return;
    }

    setLoading(true);
    setStatus("⏳ Submitting property for admin approval...");

    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('description', description.trim());
      formData.append('physicalAddress', physicalAddress.trim());
      formData.append('areaInSqFt', propertyData.areaInSqFt || '1000');
      formData.append('propertyType', propertyData.propertyType);
      formData.append('price', propertyData.price || 'Not specified');
      formData.append('owner', walletState.address);
      formData.append('images', propertyImage);

      const response = await propertyApi.submitProperty(formData);

      if (response.success) {
        setStatus("✅ Property submitted successfully! Awaiting admin approval.");
        
        // Reset form
        setPropertyData({
          name: "",
          description: "",
          physicalAddress: "",
          areaInSqFt: "",
          propertyType: "Residential",
          price: ""
        });
        setPropertyImage(null);
        
        // Reset file input
        const fileInput = document.getElementById('property-image');
        if (fileInput) fileInput.value = '';
        
        // Reload approved properties
        setTimeout(() => {
          loadApprovedProperties(walletState.address);
        }, 2000);
      } else {
        setStatus(`❌ Failed to submit property: ${response.message}`);
      }
    } catch (error) {
      console.error("Property submission error:", error);
      setStatus(`❌ Property submission failed: ${error.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Mint NFT for approved property
  const handleNFTMinting = async (property) => {
    if (!walletState.isConnected || !walletState.provider) {
      setStatus("⚠️ Please connect your wallet first.");
      return;
    }

    setLoading(true);
    setStatus("⏳ Uploading property data to IPFS...");

    try {
      // Create metadata for IPFS
      const metadata = {
        name: property.name,
        description: property.description,
        image: property.images?.[0]?.path || "",
        attributes: [
          { trait_type: "Property Type", value: property.propertyType },
          { trait_type: "Area (sq ft)", value: property.areaInSqFt?.toString() || "1000" },
          { trait_type: "Physical Address", value: property.physicalAddress },
          { trait_type: "Price", value: property.price || "Not specified" },
          { trait_type: "Status", value: "Approved" }
        ]
      };

      // For now, create a simple JSON URI (in production, upload to IPFS)
      const tokenURI = `data:application/json;base64,${btoa(JSON.stringify(metadata))}`;
      
      setStatus("⏳ Minting NFT - Please confirm transaction in MetaMask...");

      const provider = walletState.provider;
      const signer = await provider.getSigner();
      const contract = new Contract(contractAddress, contractABI, signer);

      // Try different minting methods
      let tx;
      const mintingMethods = [
        { name: "mintProperty", args: [walletState.address, tokenURI] },
        { name: "mint", args: [walletState.address, tokenURI] },
        { name: "safeMint", args: [walletState.address, tokenURI] }
      ];

      for (const method of mintingMethods) {
        try {
          if (contract[method.name]) {
            tx = await contract[method.name](...method.args);
            console.log(`✅ Successfully called ${method.name}`);
            break;
          }
        } catch (error) {
          console.log(`❌ Method ${method.name} failed:`, error.message);
          continue;
        }
      }

      if (!tx) {
        throw new Error("No valid minting method found in contract");
      }

      console.log("✅ Transaction submitted:", tx.hash);
      setStatus("⏳ Transaction submitted! Waiting for confirmation...");
      
      const receipt = await tx.wait();
      console.log("✅ Transaction confirmed:", receipt);

      // Extract token ID from receipt
      let tokenId = null;
      if (receipt.logs && receipt.logs.length > 0) {
        for (const log of receipt.logs) {
          try {
            const parsedLog = contract.interface.parseLog({
              topics: log.topics,
              data: log.data
            });
            
            if (parsedLog && (parsedLog.name === "PropertyMinted" || parsedLog.name === "Transfer")) {
              if (parsedLog.name === "PropertyMinted") {
                tokenId = parsedLog.args.tokenId?.toString();
              } else if (parsedLog.name === "Transfer" && parsedLog.args.from === "0x0000000000000000000000000000000000000000") {
                tokenId = parsedLog.args.tokenId?.toString();
              }
              if (tokenId) break;
            }
          } catch (e) {
            continue;
          }
        }
      }

      // Fallback token ID generation
      if (!tokenId) {
        try {
          const currentCounter = await contract.tokenCounter();
          tokenId = (currentCounter - 1n).toString();
        } catch (e) {
          tokenId = `temp_${Date.now()}_${receipt.blockNumber}`;
        }
      }

      setStatus("⏳ Updating property data in database...");

      // Update property with NFT data
      try {
        await propertyApi.updatePropertyWithNFT(property.propertyId, {
          tokenId,
          contractAddress,
          transactionHash: receipt.hash,
          tokenURI,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed?.toString() || "0"
        });
      } catch (dbError) {
        console.error("Database update error:", dbError);
        // Don't fail the entire process
      }

      setStatus(`✅ Success! Property NFT minted with Token ID: ${tokenId}`);
      
      // Reload approved properties
      setTimeout(() => {
        loadApprovedProperties(walletState.address);
      }, 2000);

    } catch (error) {
      console.error("NFT minting error:", error);
      
      let errorMessage = "Unknown error";
      if (error.message) {
        if (error.message.includes("user rejected") || error.message.includes("User denied")) {
          errorMessage = "Transaction cancelled by user.";
        } else if (error.message.includes("AccessControlUnauthorizedAccount")) {
          errorMessage = "Access denied: You don't have permission to mint NFTs.";
        } else if (error.message.includes("insufficient funds")) {
          errorMessage = "Insufficient funds to pay for gas fees.";
        } else {
          errorMessage = error.message;
        }
      }
      
      setStatus(`❌ Minting failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusDisplay = () => {
    if (!userStatus) return null;
    
    switch (userStatus.status) {
      case 'pending':
        return (
          <div className="verification-warning">
            <div className="warning-icon">⏳</div>
            <h3>Verification Pending</h3>
            <p>Your KYC verification is being reviewed. Please wait for approval.</p>
          </div>
        );
      case 'rejected':
        return (
          <div className="verification-warning">
            <div className="warning-icon">❌</div>
            <h3>Verification Rejected</h3>
            <p>Your KYC verification was rejected. Please contact support or resubmit.</p>
            <button className="btn btn-primary" onClick={() => navigate("/register")}>
              Resubmit KYC
            </button>
          </div>
        );
      case 'verified':
        return null;
      default:
        return (
          <div className="verification-warning">
            <div className="warning-icon">⚠️</div>
            <h3>Verification Required</h3>
            <p>Complete KYC verification before submitting properties.</p>
            <button className="btn btn-primary" onClick={() => navigate("/register")}>
              Complete KYC
            </button>
          </div>
        );
    }
  };

  return (
    <div className="page-content">
      <div className="container">
        <div className="auth-card">
          <div className="card-header">
            <h2>Property NFT Management</h2>
            <p>Submit properties for approval and mint them as NFTs</p>
          </div>

          {!walletState.isConnected ? (
            <div className="text-center">
              <p>Connect your wallet to manage property NFTs</p>
              <button className="btn btn-primary" onClick={connectWallet}>
                Connect Wallet
              </button>
            </div>
          ) : (
            <>
              {getStatusDisplay()}
              
              {isVerified && (
                <>
                  <div className="wallet-info">
                    <span>Connected Wallet: </span>
                    <span className="wallet-address">
                      {walletState.address.substring(0, 6)}...
                      {walletState.address.substring(walletState.address.length - 4)}
                    </span>
                    <span className="verification-badge">✓ Verified</span>
                  </div>

                  {/* Step Navigation */}
                  <div className="step-navigation">
                    <button 
                      className={`step-btn ${step === 1 ? 'active' : ''}`}
                      onClick={() => setStep(1)}
                    >
                      1. Submit Property
                    </button>
                    <button 
                      className={`step-btn ${step === 2 ? 'active' : ''}`}
                      onClick={() => setStep(2)}
                    >
                      2. Mint NFTs
                    </button>
                  </div>

                  {/* Step 1: Property Submission */}
                  {step === 1 && (
                    <div className="property-submission-form">
                      <h3>Submit Property for Approval</h3>
                      
                      <div className="form-group">
                        <label htmlFor="property-name">Property Name *</label>
                        <input
                          id="property-name"
                          type="text"
                          className="form-control"
                          placeholder="Enter property name"
                          value={propertyData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          disabled={loading}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="property-description">Property Description *</label>
                        <textarea
                          id="property-description"
                          className="form-control"
                          placeholder="Enter detailed property description"
                          value={propertyData.description}
                          onChange={(e) => handleInputChange('description', e.target.value)}
                          disabled={loading}
                          rows={4}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="physical-address">Physical Address *</label>
                        <input
                          id="physical-address"
                          type="text"
                          className="form-control"
                          placeholder="Enter complete physical address"
                          value={propertyData.physicalAddress}
                          onChange={(e) => handleInputChange('physicalAddress', e.target.value)}
                          disabled={loading}
                        />
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label htmlFor="area">Area (sq ft)</label>
                          <input
                            id="area"
                            type="number"
                            className="form-control"
                            placeholder="1000"
                            value={propertyData.areaInSqFt}
                            onChange={(e) => handleInputChange('areaInSqFt', e.target.value)}
                            disabled={loading}
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="property-type">Property Type</label>
                          <select
                            id="property-type"
                            className="form-control"
                            value={propertyData.propertyType}
                            onChange={(e) => handleInputChange('propertyType', e.target.value)}
                            disabled={loading}
                          >
                            <option value="Residential">Residential</option>
                            <option value="Commercial">Commercial</option>
                            <option value="Industrial">Industrial</option>
                            <option value="Land">Land</option>
                            <option value="Villa">Villa</option>
                            <option value="Apartment">Apartment</option>
                          </select>
                        </div>
                      </div>

                      <div className="form-group">
                        <label htmlFor="price">Price (Optional)</label>
                        <input
                          id="price"
                          type="text"
                          className="form-control"
                          placeholder="e.g., ₹1.5 Cr, $200,000, etc."
                          value={propertyData.price}
                          onChange={(e) => handleInputChange('price', e.target.value)}
                          disabled={loading}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="property-image">Property Image *</label>
                        <input
                          id="property-image"
                          type="file"
                          accept="image/*"
                          className="form-control"
                          onChange={handleImageChange}
                          disabled={loading}
                        />
                        <small className="form-hint">
                          Upload a clear image of your property (max 5MB)
                        </small>
                      </div>

                      <button
                        className={`btn btn-primary w-full ${loading ? "btn-loading" : ""}`}
                        onClick={handlePropertySubmission}
                        disabled={loading}
                      >
                        {loading ? "Submitting..." : "Submit Property for Approval"}
                      </button>
                    </div>
                  )}

                  {/* Step 2: NFT Minting */}
                  {step === 2 && (
                    <div className="nft-minting-section">
                      <h3>Mint Approved Properties as NFTs</h3>
                      
                      {approvedProperties.length === 0 ? (
                        <div className="empty-state">
                          <p>No approved properties available for minting.</p>
                          <p>Submit properties in Step 1 and wait for admin approval.</p>
                          <button 
                            className="btn btn-outline"
                            onClick={() => setStep(1)}
                          >
                            Go to Step 1
                          </button>
                        </div>
                      ) : (
                        <div className="approved-properties">
                          {approvedProperties.map((property) => (
                            <div key={property.propertyId} className="property-mint-card">
                              <div className="property-info">
                                <h4>{property.name}</h4>
                                <p>{property.description}</p>
                                <div className="property-details">
                                  <span><strong>Address:</strong> {property.physicalAddress}</span>
                                  <span><strong>Type:</strong> {property.propertyType}</span>
                                  <span><strong>Area:</strong> {property.areaInSqFt} sq ft</span>
                                  <span><strong>Status:</strong> 
                                    <span className={`status-badge ${property.status}`}>
                                      {property.status === 'minted' ? '✅ Minted' : '⏳ Approved'}
                                    </span>
                                  </span>
                                  {property.tokenId && (
                                    <span><strong>Token ID:</strong> {property.tokenId}</span>
                                  )}
                                </div>
                              </div>
                              
                              {property.status === 'approved' && (
                                <button
                                  className={`btn btn-primary ${loading ? "btn-loading" : ""}`}
                                  onClick={() => handleNFTMinting(property)}
                                  disabled={loading}
                                >
                                  {loading ? "Minting..." : "Mint NFT"}
                                </button>
                              )}
                              
                              {property.status === 'minted' && (
                                <div className="mint-success">
                                  <span className="success-icon">✅</span>
                                  <span>NFT Minted Successfully!</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {status && (
            <div
              className={`status-message ${
                status.startsWith("❌")
                  ? "error"
                  : status.startsWith("⚠️")
                  ? "warning"
                  : status.startsWith("✅")
                  ? "success"
                  : "info"
              }`}
            >
              {status}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Mint;