import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  time: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String },
  cost: { type: Number, default: 0 },
  category: { type: String, default: 'Sightseeing' }, // e.g. Sightseeing, Food, Transport, Lodging
});

const daySchema = new mongoose.Schema({
  dayNumber: { type: Number, required: true },
  date: { type: String, required: true },
  activities: [activitySchema],
});

const packingItemSchema = new mongoose.Schema({
  item: { type: String, required: true },
  packed: { type: Boolean, default: false },
});

const budgetItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  category: { type: String, default: 'Other' }, // e.g., Activities, Food, Transport, Lodging, Other
  date: { type: String },
});

const tripSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    destination: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    budgetLimit: {
      type: Number,
      default: 0,
    },
    companion: {
      type: String,
      default: 'solo', // solo, couple, family, friends
    },
    interests: [
      {
        type: String,
      },
    ],
    itinerary: [daySchema],
    packingList: [packingItemSchema],
    budgetLedger: [budgetItemSchema],
  },
  {
    timestamps: true,
  }
);

// Virtual field for total cost dynamically computed
tripSchema.virtual('totalCost').get(function () {
  const ledgerSum = this.budgetLedger.reduce((sum, item) => sum + item.amount, 0);
  const activitySum = this.itinerary.reduce(
    (sum, day) => sum + day.activities.reduce((dSum, act) => dSum + act.cost, 0),
    0
  );
  return ledgerSum + activitySum;
});

// Configure JSON serialization to include virtuals
tripSchema.set('toJSON', { virtuals: true });
tripSchema.set('toObject', { virtuals: true });

const Trip = mongoose.model('Trip', tripSchema);

export default Trip;
