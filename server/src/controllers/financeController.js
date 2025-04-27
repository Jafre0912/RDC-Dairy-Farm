const Transaction = require("../models/Transaction");
const asyncHandler = require("../middlewares/async");

// @desc    Get all transactions
// @route   GET /api/finance/transactions
// @access  Private
exports.getTransactions = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  // Build query
  const query = { user: req.user.id };
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }

  // Get transactions
  const transactions = await Transaction.find(query).sort({ date: -1 });

  res.status(200).json({
    success: true,
    data: transactions,
  });
});

// @desc    Create new transaction
// @route   POST /api/finance/transactions
// @access  Private
exports.createTransaction = asyncHandler(async (req, res) => {
  // Add user to req.body
  req.body.user = req.user.id;

  // Format the data
  const transactionData = {
    ...req.body,
    amount: Number(req.body.amount),
    date: new Date(req.body.date),
  };

  const transaction = await Transaction.create(transactionData);

  res.status(201).json({
    success: true,
    data: transaction,
  });
});

// @desc    Update transaction
// @route   PUT /api/finance/transactions/:id
// @access  Private
exports.updateTransaction = asyncHandler(async (req, res) => {
  let transaction = await Transaction.findById(req.params.id);

  if (!transaction) {
    return res.status(404).json({
      success: false,
      error: "Transaction not found",
    });
  }

  // Make sure user owns transaction
  if (transaction.user.toString() !== req.user.id) {
    return res.status(401).json({
      success: false,
      error: "Not authorized to update this transaction",
    });
  }

  // Format the data
  const transactionData = {
    ...req.body,
    amount: Number(req.body.amount),
    date: new Date(req.body.date),
  };

  transaction = await Transaction.findByIdAndUpdate(
    req.params.id,
    transactionData,
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    success: true,
    data: transaction,
  });
});

// @desc    Delete transaction
// @route   DELETE /api/finance/transactions/:id
// @access  Private
exports.deleteTransaction = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findById(req.params.id);

  if (!transaction) {
    return res.status(404).json({
      success: false,
      error: "Transaction not found",
    });
  }

  // Make sure user owns transaction
  if (transaction.user.toString() !== req.user.id) {
    return res.status(401).json({
      success: false,
      error: "Not authorized to delete this transaction",
    });
  }

  await transaction.deleteOne();

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Get transaction summary
// @route   GET /api/finance/summary
// @access  Private
exports.getTransactionSummary = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  // Build query
  const query = { user: req.user.id };
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }

  // Get transactions
  const transactions = await Transaction.find(query);

  // Calculate summary
  const summary = {
    totalIncome: transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0),
    totalExpenses: transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0),
    netBalance:
      transactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0) -
      transactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0),
    transactionCount: transactions.length,
    incomeCount: transactions.filter((t) => t.type === "income").length,
    expenseCount: transactions.filter((t) => t.type === "expense").length,
  };

  res.status(200).json({
    success: true,
    data: summary,
  });
}); 