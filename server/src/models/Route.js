import mongoose from 'mongoose';

const RouteSchema = new mongoose.Schema({
  name: { type: String, required: true },
  stops: [{ 
    name: String, 
    lat: Number, 
    lng: Number 
  }],
  color: String,
  type: { type: String, enum: ['bus', 'airway'], default: 'bus' }
});

export default mongoose.model('Route', RouteSchema);