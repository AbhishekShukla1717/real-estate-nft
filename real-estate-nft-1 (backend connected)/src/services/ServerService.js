import axios from 'axios';

class ServerService {
  constructor() {
    this.isConnected = false;
    this.listeners = new Set();
    this.checkInterval = null;
  }

  startMonitoring(interval = 30000) { // Check every 30 seconds
    this.checkInterval = setInterval(() => this.checkServer(), interval);
    return this.checkServer(); // Initial check
  }

  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }

  async checkServer() {
    try {
      const response = await axios.get('/api/health', {
        timeout: 5000,
        baseURL: 'http://localhost:5000' // Direct base URL without /api
      });
      
      const newStatus = response.data.status === 'ok';
      if (this.isConnected !== newStatus) {
        this.isConnected = newStatus;
        this.notifyListeners();
      }
      return this.isConnected;
    } catch (error) {
      this.isConnected = false;
      this.notifyListeners();
      return false;
    }
  }

  onStatusChange(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners() {
    this.listeners.forEach(callback => callback(this.isConnected));
  }
}

const serverService = new ServerService();
export default serverService;
