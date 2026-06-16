import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, DollarSign, ArrowRight, Tag, Trash2 } from 'lucide-react';
import { formatDate, formatCurrency, getDaysCount } from '../utils/formatters';

const TripCard = ({ trip, onDelete }) => {
  const duration = getDaysCount(trip.startDate, trip.endDate);
  
  // Total cost computation: budgetLedger + activities in itinerary
  const ledgerSum = trip.budgetLedger?.reduce((sum, item) => sum + item.amount, 0) || 0;
  const activitiesSum = trip.itinerary?.reduce(
    (sum, day) => sum + (day.activities?.reduce((dSum, act) => dSum + act.cost, 0) || 0),
    0
  ) || 0;
  const totalCost = ledgerSum + activitiesSum;

  const percentSpent = trip.budgetLimit > 0 ? (totalCost / trip.budgetLimit) * 100 : 0;
  const isOverBudget = totalCost > trip.budgetLimit && trip.budgetLimit > 0;

  return (
    <div className="relative group overflow-hidden rounded-2xl glass-panel-glow p-6 transition-all duration-300 flex flex-col h-full">
      {/* Decorative gradient spot */}
      <div className="absolute -right-10 -top-10 w-24 h-24 bg-brand-teal/10 rounded-full blur-2xl group-hover:bg-brand-teal/20 transition-all duration-300"></div>

      {/* Destination Name */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-cyan">Trip Plan</span>
          <h3 className="text-xl font-bold text-white mt-1 group-hover:text-brand-teal transition-colors">
            {trip.destination}
          </h3>
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete(trip._id);
          }}
          className="text-gray-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          title="Delete Trip"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Trip Details */}
      <div className="space-y-3 mb-6 text-sm text-gray-300 flex-grow">
        {/* Dates & Duration */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-brand-teal/70" />
          <span>
            {formatDate(trip.startDate)} - {formatDate(trip.endDate)} ({duration} {duration === 1 ? 'day' : 'days'})
          </span>
        </div>

        {/* Companion */}
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-brand-teal/70" />
          <span className="capitalize">{trip.companion} Trip</span>
        </div>

        {/* Budget limit / Spent */}
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-brand-teal/70" />
          <span>
            {trip.budgetLimit > 0 ? (
              <>
                {formatCurrency(totalCost)} / <span className="text-gray-400">{formatCurrency(trip.budgetLimit)}</span>
              </>
            ) : (
              `${formatCurrency(totalCost)} spent (No limit)`
            )}
          </span>
        </div>
      </div>

      {/* Budget Progress Bar */}
      {trip.budgetLimit > 0 && (
        <div className="mb-6">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-400">Budget Usage</span>
            <span className={isOverBudget ? 'text-rose-400 font-medium' : 'text-gray-300'}>
              {Math.round(percentSpent)}%
            </span>
          </div>
          <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isOverBudget ? 'bg-rose-500' : 'bg-gradient-to-r from-brand-cyan to-brand-teal'
              }`}
              style={{ width: `${Math.min(percentSpent, 100)}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Tags */}
      {trip.interests && trip.interests.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-6">
          {trip.interests.slice(0, 3).map((interest, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-white/5 text-gray-300"
            >
              <Tag className="h-2.5 w-2.5 text-brand-cyan/70" />
              {interest}
            </span>
          ))}
          {trip.interests.length > 3 && (
            <span className="text-[10px] text-gray-500 self-center">+{trip.interests.length - 3} more</span>
          )}
        </div>
      )}

      {/* Button */}
      <Link
        to={`/trips/${trip._id}`}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 hover:border-brand-teal/50 hover:bg-brand-teal/5 text-sm font-semibold text-white transition-all duration-300 mt-auto"
      >
        View Itinerary
        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
      </Link>
    </div>
  );
};

export default TripCard;
