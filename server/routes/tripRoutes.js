import express from 'express';
import {
  getUserTrips,
  getTripById,
  createTrip,
  updateTrip,
  deleteTrip,
  togglePackingItem,
  addBudgetItem,
  deleteBudgetItem,
  chatAboutTrip,
} from '../controllers/tripController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply auth protection to all trip routes
router.use(protect);

router.route('/')
  .get(getUserTrips)
  .post(createTrip);

router.route('/:id')
  .get(getTripById)
  .put(updateTrip)
  .delete(deleteTrip);

router.put('/:id/packing/:itemId', togglePackingItem);
router.post('/:id/budget', addBudgetItem);
router.delete('/:id/budget/:itemId', deleteBudgetItem);
router.post('/:id/chat', chatAboutTrip);

export default router;
