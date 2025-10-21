import mongoose from 'mongoose';

let isConnected = false; // Variable to track the connection status

export const connectToDB = async () => {
  mongoose.set('strictQuery', true);

  if (!process.env.MONGODB_URI) {
    console.log('❌ MONGODB_URI is not defined');
    throw new Error('MONGODB_URI is not defined in environment variables');
  }

  if (isConnected) {
    console.log('✅ Using existing database connection');
    return;
  }

  try {
    const options = {
      dbName: 'pricetracker', // Specify your database name
      serverSelectionTimeoutMS: 10000, // 10 second timeout
      socketTimeoutMS: 45000, // 45 second socket timeout
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 2, // Maintain at least 2 connections
    };

    await mongoose.connect(process.env.MONGODB_URI, options);

    isConnected = true;

    console.log('✅ MongoDB Connected successfully');
  } catch (error: any) {
    console.error('❌ MongoDB connection error:', error.message);
    throw new Error(`Failed to connect to MongoDB: ${error.message}`);
  }
}