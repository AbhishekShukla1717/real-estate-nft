// utils/ipfs.js - Enhanced with better error handling and retry logic

import axios from "axios";

const PINATA_API_KEY = process.env.REACT_APP_PINATA_API_KEY;
const PINATA_SECRET_API_KEY = process.env.REACT_APP_PINATA_SECRET_API_KEY;

// Retry utility function
const retryOperation = async (operation, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Attempt ${attempt}/${maxRetries}`);
      return await operation();
    } catch (error) {
      lastError = error;
      console.error(`❌ Attempt ${attempt} failed:`, error.message);
      
      if (attempt < maxRetries) {
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }
  }
  
  throw lastError;
};

// Validate image file
const validateImageFile = (imageFile) => {
  if (!imageFile) {
    throw new Error("No image file provided");
  }
  
  // Check file size (5MB limit)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (imageFile.size > maxSize) {
    throw new Error(`Image file too large (${(imageFile.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 5MB.`);
  }
  
  // Check file type
  if (!imageFile.type.startsWith('image/')) {
    throw new Error(`Invalid file type: ${imageFile.type}. Please select an image file.`);
  }
  
  console.log(`✅ Image validation passed:`, {
    name: imageFile.name,
    size: `${(imageFile.size / 1024 / 1024).toFixed(2)}MB`,
    type: imageFile.type
  });
};

// Upload image to Pinata with retry logic
const uploadImageToPinata = async (imageFile) => {
  validateImageFile(imageFile);
  
  const uploadOperation = async () => {
    const imageFormData = new FormData();
    imageFormData.append("file", imageFile);
    
    // Add metadata for better organization
    const metadata = JSON.stringify({
      name: `property-image-${Date.now()}`,
      keyvalues: {
        type: "property-image",
        timestamp: new Date().toISOString()
      }
    });
    imageFormData.append("pinataMetadata", metadata);
    
    // Add pinning options
    const options = JSON.stringify({
      cidVersion: 1,
    });
    imageFormData.append("pinataOptions", options);

    console.log("📤 Uploading image to Pinata...");
    
    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      imageFormData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_SECRET_API_KEY,
        },
        timeout: 30000, // 30 second timeout
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`📤 Upload progress: ${percentCompleted}%`);
        }
      }
    );

    if (!response.data || !response.data.IpfsHash) {
      throw new Error("Invalid response from Pinata: missing IpfsHash");
    }

    return response.data;
  };

  try {
    const result = await retryOperation(uploadOperation, 3, 2000);
    console.log(`✅ Image uploaded successfully:`, result.IpfsHash);
    return result;
  } catch (error) {
    console.error("❌ Image upload failed:", error);
    
    // Provide more specific error messages
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      switch (status) {
        case 401:
          throw new Error("Pinata API authentication failed. Please check your API keys.");
        case 402:
          throw new Error("Pinata account quota exceeded. Please upgrade your plan.");
        case 413:
          throw new Error("File too large for Pinata. Please use a smaller image.");
        case 429:
          throw new Error("Pinata rate limit exceeded. Please try again later.");
        default:
          throw new Error(`Pinata API error (${status}): ${data?.error || error.message}`);
      }
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      throw new Error("Cannot connect to Pinata. Please check your internet connection.");
    } else if (error.code === 'ETIMEDOUT') {
      throw new Error("Upload timeout. Please try again with a smaller image or better connection.");
    } else {
      throw new Error(`Image upload failed: ${error.message}`);
    }
  }
};

// Upload metadata JSON to Pinata with retry logic
const uploadMetadataToPinata = async (metadata) => {
  const uploadOperation = async () => {
    // Add timestamp and version to metadata
    const enhancedMetadata = {
      ...metadata,
      timestamp: new Date().toISOString(),
      version: "1.0"
    };
    
    console.log("📤 Uploading metadata to Pinata...", enhancedMetadata);

    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      enhancedMetadata,
      {
        headers: {
          "Content-Type": "application/json",
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_SECRET_API_KEY,
        },
        timeout: 15000, // 15 second timeout
        pinataMetadata: {
          name: `property-metadata-${Date.now()}`,
          keyvalues: {
            type: "property-metadata",
            timestamp: new Date().toISOString()
          }
        },
        pinataOptions: {
          cidVersion: 1,
        }
      }
    );

    if (!response.data || !response.data.IpfsHash) {
      throw new Error("Invalid response from Pinata: missing IpfsHash");
    }

    return response.data;
  };

  try {
    const result = await retryOperation(uploadOperation, 3, 1000);
    console.log(`✅ Metadata uploaded successfully:`, result.IpfsHash);
    return result;
  } catch (error) {
    console.error("❌ Metadata upload failed:", error);
    
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      switch (status) {
        case 401:
          throw new Error("Pinata API authentication failed. Please check your API keys.");
        case 402:
          throw new Error("Pinata account quota exceeded. Please upgrade your plan.");
        case 429:
          throw new Error("Pinata rate limit exceeded. Please try again later.");
        default:
          throw new Error(`Pinata API error (${status}): ${data?.error || error.message}`);
      }
    } else {
      throw new Error(`Metadata upload failed: ${error.message}`);
    }
  }
};

// Main function to store NFT metadata
export const storeNFTMetadata = async (name, description, imageFile) => {
  console.log("🚀 Starting IPFS metadata storage process...");
  
  // Validate inputs
  if (!name || !name.trim()) {
    throw new Error("Property name is required");
  }
  
  if (!description || !description.trim()) {
    throw new Error("Property description is required");
  }
  
  if (!PINATA_API_KEY || !PINATA_SECRET_API_KEY) {
    throw new Error("Pinata API credentials are missing. Please configure REACT_APP_PINATA_API_KEY and REACT_APP_PINATA_SECRET_API_KEY environment variables.");
  }

  try {
    // Step 1: Upload image to Pinata
    console.log("📷 Step 1: Uploading image...");
    const imageUploadResult = await uploadImageToPinata(imageFile);
    const imageHash = imageUploadResult.IpfsHash;
    const imageURL = `https://gateway.pinata.cloud/ipfs/${imageHash}`;
    
    console.log(`✅ Image uploaded successfully. IPFS Hash: ${imageHash}`);
    console.log(`🔗 Image URL: ${imageURL}`);

    // Step 2: Create metadata object
    const metadata = {
      name: name.trim(),
      description: description.trim(),
      image: imageURL,
      external_url: imageURL, // Some marketplaces use this
      attributes: [
        {
          trait_type: "Type",
          value: "Real Estate Property"
        },
        {
          trait_type: "Created",
          value: new Date().toISOString().split('T')[0] // Date only
        }
      ]
    };

    // Step 3: Upload metadata JSON to Pinata
    console.log("📄 Step 2: Uploading metadata JSON...");
    const metadataUploadResult = await uploadMetadataToPinata(metadata);
    const metadataHash = metadataUploadResult.IpfsHash;
    const metadataURL = `https://gateway.pinata.cloud/ipfs/${metadataHash}`;
    
    console.log(`✅ Metadata uploaded successfully. IPFS Hash: ${metadataHash}`);
    console.log(`🔗 Metadata URL: ${metadataURL}`);

    // Step 4: Verify the metadata is accessible
    console.log("🔍 Step 3: Verifying metadata accessibility...");
    try {
      const verifyResponse = await axios.get(metadataURL, { timeout: 10000 });
      console.log("✅ Metadata verification successful:", verifyResponse.data);
    } catch (verifyError) {
      console.warn("⚠️ Metadata verification failed (but upload was successful):", verifyError.message);
      // Don't fail the entire process if verification fails
    }

    console.log("🎉 IPFS storage process completed successfully!");
    console.log(`📋 Summary:
    - Image Hash: ${imageHash}
    - Metadata Hash: ${metadataHash}
    - Token URI: ${metadataURL}`);

    return metadataURL;
    
  } catch (error) {
    console.error("🚨 IPFS storage process failed:", error);
    
    // Provide user-friendly error messages
    if (error.message.includes("API key")) {
      throw new Error("IPFS configuration error: " + error.message);
    } else if (error.message.includes("network") || error.message.includes("timeout")) {
      throw new Error("Network error: Please check your internet connection and try again.");
    } else if (error.message.includes("quota") || error.message.includes("limit")) {
      throw new Error("Storage quota exceeded: Please check your Pinata account limits.");
    } else if (error.message.includes("file") || error.message.includes("image")) {
      throw new Error("File error: " + error.message);
    } else {
      throw new Error(`IPFS storage failed: ${error.message}`);
    }
  }
};

// Utility function to retrieve metadata from IPFS
const getMetadataFromIPFS = async (tokenURI) => {
  try {
    console.log(`🔍 Fetching metadata from: ${tokenURI}`);
    
    const response = await axios.get(tokenURI, {
      timeout: 10000,
      headers: {
        'Accept': 'application/json'
      }
    });
    
    console.log("✅ Metadata retrieved successfully:", response.data);
    return response.data;
    
  } catch (error) {
    console.error("❌ Failed to retrieve metadata:", error);
    
    if (error.response) {
      throw new Error(`Failed to fetch metadata: HTTP ${error.response.status}`);
    } else if (error.code === 'ETIMEDOUT') {
      throw new Error("Timeout: Unable to fetch metadata from IPFS");
    } else {
      throw new Error(`Failed to retrieve metadata: ${error.message}`);
    }
  }
};

// Utility function to validate if a URL is a valid IPFS hash
const isValidIPFSHash = (hash) => {
  // Basic validation for IPFS hash (CIDv0 and CIDv1)
  const cidv0Regex = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;
  const cidv1Regex = /^b[A-Za-z2-7]{58}$/;
  
  return cidv0Regex.test(hash) || cidv1Regex.test(hash);
};

// Utility function to extract IPFS hash from URL
const extractIPFSHash = (url) => {
  if (!url) return null;
  
  // Handle different IPFS URL formats
  const patterns = [
    /ipfs\/([^/?]+)/, // https://gateway.pinata.cloud/ipfs/QmHash
    /\/ipfs\/([^/?]+)/, // /ipfs/QmHash
    /^(Qm[1-9A-HJ-NP-Za-km-z]{44})$/, // Direct hash
    /^(b[A-Za-z2-7]{58})$/ // CIDv1 hash
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
};

// Utility function to convert IPFS hash to different gateway URLs
const getIPFSGatewayURL = (hash, gateway = 'pinata') => {
  if (!hash) return null;
  
  const gateways = {
    pinata: 'https://gateway.pinata.cloud/ipfs/',
    ipfs: 'https://ipfs.io/ipfs/',
    cloudflare: 'https://cloudflare-ipfs.com/ipfs/',
    infura: 'https://ipfs.infura.io/ipfs/'
  };
  
  const baseURL = gateways[gateway] || gateways.pinata;
  return `${baseURL}${hash}`;
};

// Utility function to check Pinata connection and authentication
const testPinataConnection = async () => {
  try {
    console.log("🔍 Testing Pinata connection...");
    
    if (!PINATA_API_KEY || !PINATA_SECRET_API_KEY) {
      throw new Error("Pinata API credentials are not configured");
    }
    
    const response = await axios.get(
      "https://api.pinata.cloud/data/testAuthentication",
      {
        headers: {
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_SECRET_API_KEY,
        },
        timeout: 10000
      }
    );
    
    console.log("✅ Pinata connection successful:", response.data);
    return { success: true, data: response.data };
    
  } catch (error) {
    console.error("❌ Pinata connection failed:", error);
    
    if (error.response) {
      const status = error.response.status;
      switch (status) {
        case 401:
          return { success: false, error: "Invalid Pinata API credentials" };
        case 429:
          return { success: false, error: "Pinata rate limit exceeded" };
        default:
          return { success: false, error: `Pinata API error: ${status}` };
      }
    } else {
      return { success: false, error: error.message };
    }
  }
};

// Utility function to get file info from Pinata
const getPinataFileInfo = async (ipfsHash) => {
  try {
    console.log(`🔍 Getting file info for: ${ipfsHash}`);
    
    const response = await axios.get(
      `https://api.pinata.cloud/data/pinList?hashContains=${ipfsHash}`,
      {
        headers: {
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_SECRET_API_KEY,
        },
        timeout: 10000
      }
    );
    
    if (response.data && response.data.rows && response.data.rows.length > 0) {
      const fileInfo = response.data.rows[0];
      console.log("✅ File info retrieved:", fileInfo);
      return fileInfo;
    } else {
      throw new Error("File not found in Pinata");
    }
    
  } catch (error) {
    console.error("❌ Failed to get file info:", error);
    throw new Error(`Failed to get file info: ${error.message}`);
  }
};

// Export all utility functions
export {
  getMetadataFromIPFS,
  isValidIPFSHash,
  extractIPFSHash,
  getIPFSGatewayURL,
  testPinataConnection,
  getPinataFileInfo
};