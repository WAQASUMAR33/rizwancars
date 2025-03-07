"use client";
import { toast, ToastContainer } from "react-toastify";
import { useState, useEffect } from "react";
import {
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Box,
  Typography,
  CircularProgress,
} from "@mui/material";
import { Edit as PencilIcon, Delete as TrashIcon, Add as PlusIcon } from "@mui/icons-material";
import "react-toastify/dist/ReactToastify.css";
import { useSelector } from "react-redux";

// Fetch all expenses
const fetchExpenses = async () => {
  const response = await fetch("/api/admin/expense");
  if (!response.ok) {
    throw new Error("Failed to fetch expenses");
  }
  const result = await response.json();
  console.log("Fetched expenses:", result);
  return result.data;
};

// Add a new expense
const addExpense = async (expense) => {
  console.log("Sending expense data:", expense);
  const response = await fetch("/api/admin/expense", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(expense),
  });
  const result = await response.json();
  console.log("Add expense response:", result);
  if (!response.ok) {
    throw new Error(result.error || "Failed to add expense");
  }
  return result.data;
};

// Update an existing expense
const updateExpense = async (expense) => {
  const response = await fetch(`/api/admin/expense/${expense.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(expense),
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Failed to update expense");
  }
  return result.data;
};

// Delete an expense
const deleteExpense = async (id) => {
  const response = await fetch(`/api/admin/expense/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    throw new Error("Failed to delete expense");
  }
  return true;
};

export default function ExpenseManagement() {
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentExpense, setCurrentExpense] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(null);

  const userid = useSelector((state) => state.user.id);

  useEffect(() => {
    fetchExpenses()
      .then((data) => {
        setExpenses(data);
        setFilteredExpenses(data);
      })
      .catch((err) => {
        toast.error(err.message);
        setExpenses([]);
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    setFilteredExpenses(
      expenses.filter(
        (expense) =>
          expense.expense_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          expense.expense_description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [expenses, searchTerm]);

  const handleAddExpense = () => {
    setCurrentExpense(null);
    setIsModalOpen(true);
  };

  const handleUpdateExpense = (expense) => {
    setCurrentExpense(expense);
    setIsModalOpen(true);
  };

  const handleDeleteExpense = async (id) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      setLoadingAction(id);
      try {
        await deleteExpense(id);
        const updatedExpenses = await fetchExpenses();
        setExpenses(updatedExpenses);
        toast.success("Expense deleted successfully");
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoadingAction(null);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const expenseData = {
      ...Object.fromEntries(formData.entries()),
      user_id: userid, // Set user_id same as added_by from Redux
      amount: parseFloat(formData.get("amount")),
      added_by: userid, // Automatically set from logged-in user
    };
    console.log("Form data being sent:", expenseData);

    setLoadingAction("form");
    try {
      if (currentExpense) {
        expenseData.id = currentExpense.id; // Include id for updates
        await updateExpense(expenseData);
        toast.success("Expense updated successfully");
      } else {
        await addExpense(expenseData);
        toast.success("Expense added successfully");
      }
      const updatedExpenses = await fetchExpenses();
      setExpenses(updatedExpenses);
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <Box>
      <ToastContainer />
      <Box sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <TextField
            label="Search expenses by title or description..."
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ width: "300px" }}
          />
          <Button
            variant="contained"
            color="success"
            onClick={handleAddExpense}
            startIcon={<PlusIcon />}
          >
            Add Expense
          </Button>
        </Box>

        {isLoading ? (
          <Box display="flex" justifyContent="center">
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper} sx={{ maxHeight: "72vh", overflow: "auto" }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>No.</TableCell>
                  <TableCell>User ID</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Added By</TableCell>
                  <TableCell>Created At</TableCell>
                  <TableCell>Updated At</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredExpenses.map((expense, index) => (
                  <TableRow key={expense.id} hover>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{expense.user_id}</TableCell>
                    <TableCell>{expense.expense_title}</TableCell>
                    <TableCell>{expense.expense_description}</TableCell>
                    <TableCell>${parseFloat(expense.amount).toFixed(2)}</TableCell>
                    <TableCell>{expense.added_by}</TableCell>
                    <TableCell>{new Date(expense.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(expense.updatedAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleUpdateExpense(expense)}>
                        <PencilIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDeleteExpense(expense.id)}
                        color="error"
                        disabled={loadingAction === expense.id}
                      >
                        {loadingAction === expense.id ? (
                          <CircularProgress size={20} />
                        ) : (
                          <TrashIcon fontSize="small" />
                        )}
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>{currentExpense ? "Update Expense" : "Add Expense"}</DialogTitle>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={2} mb={2}>
                <TextField
                  label="Expense Title"
                  name="expense_title"
                  defaultValue={currentExpense?.expense_title}
                  variant="outlined"
                  required
                  fullWidth
                />
               
                <TextField
                  label="Amount"
                  name="amount"
                  type="number"
                  defaultValue={currentExpense?.amount}
                  variant="outlined"
                  inputProps={{ step: "0.01" }}
                  required
                  fullWidth
                />

                 <TextField
                  label="Expense Description"
                  name="expense_description"
                  defaultValue={currentExpense?.expense_description}
                  variant="outlined"
                  multiline
                  rows={4}
                  fullWidth
                />
              </Box>
              <Button
                type="submit"
                variant="contained"
                color="success"
                fullWidth
                disabled={loadingAction === "form"}
                startIcon={loadingAction === "form" ? <CircularProgress size={20} /> : null}
              >
                {currentExpense ? "Update" : "Add"} Expense
              </Button>
            </form>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsModalOpen(false)} color="error">
              Cancel
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}