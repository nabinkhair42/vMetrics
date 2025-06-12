import mongoose from 'mongoose';

// Track connection state
let isConnected = false;

const connectDB = async (): Promise<void> => {
  // If already connected, return early
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }

  try {
    // Prevent multiple connections in serverless environment
    if (mongoose.connection.readyState === 2) {
      // Connection is in the process of connecting
      return;
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/productivity-tracker', {
      // Optimized settings for serverless
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000, // 10 second timeout
      socketTimeoutMS: 30000, // 30 second socket timeout
      maxPoolSize: 10, // Maintain up to 10 socket connections
    });
    
    isConnected = true;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      isConnected = false;
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
      isConnected = false;
    });

    mongoose.connection.on('connected', () => {
      console.log('MongoDB connected');
      isConnected = true;
    });
    
  } catch (error) {
    console.error('Database connection error:', error);
    isConnected = false;
    throw error; // Re-throw to be handled by the calling function
  }
};

export default connectDB;
