import mongoose from 'mongoose';

const BusSchema = new mongoose.Schema({
  busId: { type: String, required: true, unique: true },
  routeId: { type: String }, // Changed to String to store custom IDs like "live_..."
  status: { type: String, enum: ['active', 'idle', 'stopped', 'Restored'], default: 'idle' },
  lastPosition: {
    lat: Number,
    lng: Number
  },
  lastActive: Date 
});

export default mongoose.model('Bus', BusSchema);