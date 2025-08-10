import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

export async function connectDB() {
  try {
    if (mongoose.connection.readyState >= 1) return;

    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('MongoDB connected');
  } catch (err) {
    console.error(' MongoDB connection error:', err);
    throw err;
  }
}
