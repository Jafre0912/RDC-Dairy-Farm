const express = require("express");
const {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionSummary,
} = require("../controllers/financeController");
const { protect } = require("../middlewares/auth");

const router = express.Router();

// Apply auth protection to all routes
router.use(protect);

// Transaction routes
router
  .route("/transactions")
  .get(getTransactions)
  .post(createTransaction);

router
  .route("/transactions/:id")
  .put(updateTransaction)
  .delete(deleteTransaction);

// Summary route
router.get("/summary", getTransactionSummary);

module.exports = router; 