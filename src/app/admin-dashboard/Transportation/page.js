"use client";
import { useState, useEffect } from "react";
import { ClipLoader } from "react-spinners";
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
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";

const TransportList = () => {
  const [transports, setTransports] = useState([]);
  const [filteredTransports, setFilteredTransports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [selectedTransport, setSelectedTransport] = useState(null);

  useEffect(() => {
    const fetchTransports = async () => {
      try {
        console.log("Fetching transports from API...");
        const response = await fetch("/api/admin/transport-management");
        console.log("Response status:", response.status);

        if (!response.ok) {
          throw new Error(`Failed to fetch transports: ${response.statusText}`);
        }

        const result = await response.json();
        console.log("API response:", result);

        const fetchedTransports = result.data || [];
        console.log("Fetched transports:", fetchedTransports);

        setTransports(fetchedTransports);
        setFilteredTransports(fetchedTransports);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTransports();
  }, []);

  useEffect(() => {
    const filtered = transports.filter((transport) =>
      (transport.vehicleNo || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (transport.company || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredTransports(filtered);
    setCurrentPage(1);
  }, [searchQuery, transports]);

  const totalPages = Math.ceil(filteredTransports.length / itemsPerPage);
  const paginatedTransports = filteredTransports.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="64vh">
        <Box textAlign="center">
          <ClipLoader color="#3b82f6" size={50} />
          <Typography variant="body1" sx={{ mt: 2 }}>
            Loading transports...
          </Typography>
        </Box>
      </Box>
    );
  }
  if (error) {
    return (
      <Typography variant="body1" color="error" align="center">
        {error}
      </Typography>
    );
  }

  return (
    <Paper sx={{ maxWidth: "1200px", mx: "auto", p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Transport List
      </Typography>

      <Box mb={2} position="relative">
        <TextField
          label="Search by Vehicle Number or Company"
          variant="outlined"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          fullWidth
          InputProps={{
            endAdornment: searchQuery && (
              <IconButton onClick={() => setSearchQuery("")} edge="end">
                <CloseIcon />
              </IconButton>
            ),
          }}
        />
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Delivery Date</TableCell>
              <TableCell>Port</TableCell>
              <TableCell>Company</TableCell>
              <TableCell>Fee</TableCell>
              <TableCell>Vehicle No</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedTransports.length > 0 ? (
              paginatedTransports.map((transport, index) => (
                <TableRow key={transport.id} hover>
                  <TableCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                  <TableCell>{new Date(transport.date).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(transport.deliveryDate).toLocaleDateString()}</TableCell>
                  <TableCell>{transport.port}</TableCell>
                  <TableCell>{transport.company}</TableCell>
                  <TableCell>{(transport.fee ? Number(transport.fee) : 0).toFixed(2)}</TableCell>
                  <TableCell>{transport.vehicleNo}</TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={() => setSelectedTransport(transport)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No transports found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" alignItems="center" mt={3} gap={1}>
          <Button
            variant="outlined"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Prev
          </Button>
          {Array.from({ length: totalPages }, (_, index) => (
            <Button
              key={index + 1}
              variant={currentPage === index + 1 ? "contained" : "outlined"}
              onClick={() => setCurrentPage(index + 1)}
            >
              {index + 1}
            </Button>
          ))}
          <Button
            variant="outlined"
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </Box>
      )}

      <Dialog
        open={!!selectedTransport}
        onClose={() => setSelectedTransport(null)}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { maxHeight: "85vh" } }}
      >
        <DialogTitle>
          Transport Details
          <IconButton
            aria-label="close"
            onClick={() => setSelectedTransport(null)}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedTransport && (
            <Box>
              {/* Transport Details */}
              <Box display="grid" gridTemplateColumns="repeat(4, 1fr)" gap={2} mb={4}>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Transport ID</Typography>
                  <Typography variant="body1">{selectedTransport.id}</Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Date</Typography>
                  <Typography variant="body1">{new Date(selectedTransport.date).toLocaleString()}</Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Delivery Date</Typography>
                  <Typography variant="body1">{new Date(selectedTransport.deliveryDate).toLocaleString()}</Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Port</Typography>
                  <Typography variant="body1">{selectedTransport.port}</Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Company</Typography>
                  <Typography variant="body1">{selectedTransport.company}</Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Fee</Typography>
                  <Typography variant="body1">{(selectedTransport.fee ? Number(selectedTransport.fee) : 0).toFixed(2)}</Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Vehicle No</Typography>
                  <Typography variant="body1">{selectedTransport.vehicleNo}</Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Image Path</Typography>
                  <Typography variant="body1">{selectedTransport.imagePath || "N/A"}</Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Added By</Typography>
                  <Typography variant="body1">{selectedTransport.added_by}</Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Created At</Typography>
                  <Typography variant="body1">{new Date(selectedTransport.createdAt).toLocaleString()}</Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Updated At</Typography>
                  <Typography variant="body1">{new Date(selectedTransport.updatedAt).toLocaleString()}</Typography>
                </Paper>
              </Box>

              {/* Related Vehicle Details */}
              {selectedTransport.vehicles && selectedTransport.vehicles.length > 0 && (
                <Box mt={4}>
                  <Typography variant="h6" gutterBottom>Vehicle Details</Typography>
                  {selectedTransport.vehicles.map((vehicle, idx) => (
                    <Paper key={vehicle.id} elevation={1} sx={{ p: 2, mb: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>Vehicle #{idx + 1}</Typography>
                      <Box display="grid" gridTemplateColumns="repeat(4, 1fr)" gap={2}>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Vehicle ID</Typography>
                          <Typography variant="body1">{vehicle.id}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Invoice No</Typography>
                          <Typography variant="body1">{vehicle.invoiceNo}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Chassis No</Typography>
                          <Typography variant="body1">{vehicle.chassisNo}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Maker</Typography>
                          <Typography variant="body1">{vehicle.maker}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Year</Typography>
                          <Typography variant="body1">{vehicle.year}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Color</Typography>
                          <Typography variant="body1">{vehicle.color}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Engine Type</Typography>
                          <Typography variant="body1">{vehicle.engineType}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Total Amount</Typography>
                          <Typography variant="body1">{(vehicle.totalAmount ? Number(vehicle.totalAmount) : 0).toFixed(2)}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Sending Port</Typography>
                          <Typography variant="body1">{vehicle.sendingPort}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Status</Typography>
                          <Typography variant="body1">{vehicle.status}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Added By</Typography>
                          <Typography variant="body1">{vehicle.added_by}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Created At</Typography>
                          <Typography variant="body1">{new Date(vehicle.createdAt).toLocaleString()}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Updated At</Typography>
                          <Typography variant="body1">{new Date(vehicle.updatedAt).toLocaleString()}</Typography>
                        </Box>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            color="error"
            onClick={() => setSelectedTransport(null)}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default TransportList;