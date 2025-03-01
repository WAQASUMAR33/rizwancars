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

// Fetch all sea ports
const fetchSeaPorts = async () => {
  const response = await fetch("/api/admin/sea_ports");
  if (!response.ok) {
    throw new Error("Failed to fetch sea ports");
  }
  const result = await response.json();
  return result.data || [];
};

// Add a new sea port
const addSeaPort = async (port) => {
  const response = await fetch("/api/admin/sea_ports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(port),
  });
  if (!response.ok) {
    throw new Error("Failed to add sea port");
  }
  const result = await response.json();
  return result.data;
};

// Update an existing sea port
const updateSeaPort = async (port) => {
  const response = await fetch(`/api/admin/sea_ports/${port.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(port),
  });
  if (!response.ok) {
    throw new Error("Failed to update sea port");
  }
  const result = await response.json();
  return result.data;
};

// Delete a sea port
const deleteSeaPort = async (id) => {
  const response = await fetch(`/api/admin/sea_ports/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    throw new Error("Failed to delete sea port");
  }
  return true;
};

export default function SeaPortManagement() {
  const [seaPorts, setSeaPorts] = useState([]);
  const [filteredSeaPorts, setFilteredSeaPorts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPort, setCurrentPort] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(null);

  useEffect(() => {
    fetchSeaPorts()
      .then((ports) => {
        console.log("Fetched sea ports:", ports);
        setSeaPorts(ports);
        setFilteredSeaPorts(ports);
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        toast.error(err.message);
        setSeaPorts([]);
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    setFilteredSeaPorts(
      seaPorts.filter((port) =>
        port.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [seaPorts, searchTerm]);

  const handleAddPort = () => {
    setCurrentPort(null);
    setIsModalOpen(true);
  };

  const handleUpdatePort = (port) => {
    setCurrentPort(port);
    setIsModalOpen(true);
  };

  const handleDeletePort = async (id) => {
    if (window.confirm("Are you sure you want to delete this sea port?")) {
      setLoadingAction(id);
      try {
        await deleteSeaPort(id);
        const updatedPorts = await fetchSeaPorts();
        setSeaPorts(updatedPorts);
        toast.success("Sea port deleted successfully");
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
    const portData = Object.fromEntries(formData.entries());

    setLoadingAction("form");
    try {
      if (currentPort) {
        await updateSeaPort({ ...currentPort, ...portData });
        toast.success("Sea port updated successfully");
      } else {
        await addSeaPort(portData);
        toast.success("Sea port added successfully");
      }
      const updatedPorts = await fetchSeaPorts();
      setSeaPorts(updatedPorts);
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
            label="Search sea ports..."
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ width: "300px" }}
          />
          <Button
            variant="contained"
            color="success"
            onClick={handleAddPort}
            startIcon={<PlusIcon />}
          >
            Add Sea Port
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
                  <TableCell>Sea Port Title</TableCell>
                  <TableCell>Created At</TableCell>
                  <TableCell>Updated At</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSeaPorts.map((port, index) => (
                  <TableRow key={port.id} hover>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{port.title}</TableCell>
                    <TableCell>{new Date(port.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(port.updatedAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleUpdatePort(port)}>
                        <PencilIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDeletePort(port.id)}
                        color="error"
                        disabled={loadingAction === port.id}
                      >
                        {loadingAction === port.id ? (
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

        <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            {currentPort ? "Update Sea Port" : "Add Sea Port"}
          </DialogTitle>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <Box mb={2} mt={1}>
                <TextField
                  label="Sea Port Title"
                  name="title"
                  defaultValue={currentPort?.title}
                  variant="outlined"
                  required
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
                {currentPort ? "Update" : "Add"} Sea Port
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