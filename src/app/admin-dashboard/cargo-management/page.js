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

const CargoList = () => {
  const [cargoBookings, setCargoBookings] = useState([]);
  const [filteredCargoBookings, setFilteredCargoBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [selectedCargo, setSelectedCargo] = useState(null);

  useEffect(() => {
    const fetchCargoBookings = async () => {
      try {
        console.log("Fetching cargo bookings from API...");
        const response = await fetch("/api/admin/cargo");
        console.log("Response status:", response.status);

        if (!response.ok) {
          throw new Error(`Failed to fetch cargo bookings: ${response.statusText}`);
        }

        const result = await response.json();
        console.log("API response:", result);

        const fetchedCargoBookings = result.data || [];
        console.log("Fetched cargo bookings:", fetchedCargoBookings);

        setCargoBookings(fetchedCargoBookings);
        setFilteredCargoBookings(fetchedCargoBookings);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCargoBookings();
  }, []);

  useEffect(() => {
    const filtered = cargoBookings.filter((cargo) =>
      (cargo.bookingNo || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cargo.shipperName || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredCargoBookings(filtered);
    setCurrentPage(1);
  }, [searchQuery, cargoBookings]);

  const totalPages = Math.ceil(filteredCargoBookings.length / itemsPerPage);
  const paginatedCargoBookings = filteredCargoBookings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Box textAlign="center">
          <ClipLoader color="#3b82f6" size={50} />
          <Typography variant="body1" sx={{ mt: 2 }}>
            Loading cargo bookings...
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
      <Typography variant="h5" component="h2" gutterBottom>
        Cargo Bookings List
      </Typography>

      <Box mb={2} position="relative">
        <TextField
          label="Search by Booking Number or Shipper Name"
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
              <TableCell>Booking No</TableCell>
              <TableCell>Shipper Name</TableCell>
              <TableCell>Consignee</TableCell>
              <TableCell>ETD</TableCell>
              <TableCell>ETA</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedCargoBookings.length > 0 ? (
              paginatedCargoBookings.map((cargo, index) => (
                <TableRow key={cargo.id} hover>
                  <TableCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                  <TableCell>{cargo.bookingNo}</TableCell>
                  <TableCell>{cargo.shipperName}</TableCell>
                  <TableCell>{cargo.consignee}</TableCell>
                  <TableCell>{new Date(cargo.etd).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(cargo.eta).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={() => setSelectedCargo(cargo)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No cargo bookings found.
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
        open={!!selectedCargo}
        onClose={() => setSelectedCargo(null)}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { maxHeight: "85vh" } }}
      >
        <DialogTitle>
          Cargo Booking Details
          <IconButton
            aria-label="close"
            onClick={() => setSelectedCargo(null)}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedCargo && (
            <Box>
              {/* Container Booking Details */}
              <Box display="grid" gridTemplateColumns="repeat(4, 1fr)" gap={2} mb={4}>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Booking ID</Typography>
                  <Typography variant="body1">{selectedCargo.id}</Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Booking No</Typography>
                  <Typography variant="body1">{selectedCargo.bookingNo}</Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Shipper Name</Typography>
                  <Typography variant="body1">{selectedCargo.shipperName}</Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Consignee</Typography>
                  <Typography variant="body1">{selectedCargo.consignee}</Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Actual Shipper</Typography>
                  <Typography variant="body1">{selectedCargo.actualShipper}</Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">CY Open</Typography>
                  <Typography variant="body1">{selectedCargo.cyOpen}</Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">ETD</Typography>
                  <Typography variant="body1">{new Date(selectedCargo.etd).toLocaleString()}</Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">CY Cut Off</Typography>
                  <Typography variant="body1">{new Date(selectedCargo.cyCutOff).toLocaleString()}</Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">ETA</Typography>
                  <Typography variant="body1">{new Date(selectedCargo.eta).toLocaleString()}</Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Volume</Typography>
                  <Typography variant="body1">{selectedCargo.volume}</Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Carrier</Typography>
                  <Typography variant="body1">{selectedCargo.carrier}</Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Vessel</Typography>
                  <Typography variant="body1">{selectedCargo.vessel}</Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Port of Loading</Typography>
                  <Typography variant="body1">{selectedCargo.portOfLoading}</Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Port of Discharge</Typography>
                  <Typography variant="body1">{selectedCargo.portOfDischarge}</Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Cargo Mode</Typography>
                  <Typography variant="body1">{selectedCargo.cargoMode}</Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Place of Issue</Typography>
                  <Typography variant="body1">{selectedCargo.placeOfIssue}</Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Freight Term</Typography>
                  <Typography variant="body1">{selectedCargo.freightTerm}</Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Description of Goods</Typography>
                  <Typography variant="body1">{selectedCargo.descriptionOfGoods}</Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Container Quantity</Typography>
                  <Typography variant="body1">{selectedCargo.containerQuantity}</Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Numbers</Typography>
                  <Typography variant="body1">{selectedCargo.numbers}</Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Image Path</Typography>
                  <Typography variant="body1">{selectedCargo.imagePath || "N/A"}</Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Added By</Typography>
                  <Typography variant="body1">{selectedCargo.added_by}</Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Created At</Typography>
                  <Typography variant="body1">{new Date(selectedCargo.createdAt).toLocaleString()}</Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="caption" color="textSecondary">Updated At</Typography>
                  <Typography variant="body1">{new Date(selectedCargo.updatedAt).toLocaleString()}</Typography>
                </Paper>
              </Box>

              {/* Container Details */}
              {selectedCargo.containerDetails && selectedCargo.containerDetails.length > 0 && (
                <Box mt={4}>
                  <Typography variant="h6" gutterBottom>Container Details</Typography>
                  {selectedCargo.containerDetails.map((detail, idx) => (
                    <Paper key={detail.id} elevation={1} sx={{ p: 2, mb: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>Container Detail #{idx + 1}</Typography>
                      <Box display="grid" gridTemplateColumns="repeat(4, 1fr)" gap={2}>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Consignee Name</Typography>
                          <Typography variant="body1">{detail.consigneeName}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Notify Party</Typography>
                          <Typography variant="body1">{detail.notifyParty}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Shipper Per</Typography>
                          <Typography variant="body1">{detail.shipperPer}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">From</Typography>
                          <Typography variant="body1">{detail.from}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">To</Typography>
                          <Typography variant="body1">{detail.to}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Booking No</Typography>
                          <Typography variant="body1">{detail.bookingNo}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Note</Typography>
                          <Typography variant="body1">{detail.note}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Image Path</Typography>
                          <Typography variant="body1">{detail.imagePath || "N/A"}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Added By</Typography>
                          <Typography variant="body1">{detail.added_by}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Created At</Typography>
                          <Typography variant="body1">{new Date(detail.createdAt).toLocaleString()}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Updated At</Typography>
                          <Typography variant="body1">{new Date(detail.updatedAt).toLocaleString()}</Typography>
                        </Box>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              )}

              {/* Container Item Details */}
              <Box mt={4}>
                <Typography variant="h6" gutterBottom>Container Item Details</Typography>
                {selectedCargo.containerItemDetails && selectedCargo.containerItemDetails.length > 0 ? (
                  selectedCargo.containerItemDetails.map((item, idx) => (
                    <Paper key={item.id} elevation={1} sx={{ p: 2, mb: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>Item #{item.itemNo}</Typography>
                      <Box display="grid" gridTemplateColumns="repeat(4, 1fr)" gap={2}>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Item No</Typography>
                          <Typography variant="body1">{item.itemNo}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Vehicle ID</Typography>
                          <Typography variant="body1">{item.vehicleId}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Chassis No</Typography>
                          <Typography variant="body1">{item.chassisNo}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Year</Typography>
                          <Typography variant="body1">{item.year}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Color</Typography>
                          <Typography variant="body1">{item.color}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">CC</Typography>
                          <Typography variant="body1">{item.cc}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Amount</Typography>
                          <Typography variant="body1">{item.amount}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Created At</Typography>
                          <Typography variant="body1">{new Date(item.createdAt).toLocaleString()}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Updated At</Typography>
                          <Typography variant="body1">{new Date(item.updatedAt).toLocaleString()}</Typography>
                        </Box>
                      </Box>
                    </Paper>
                  ))
                ) : (
                  <Typography variant="body1" color="textSecondary">
                    No container item details available.
                  </Typography>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            color="error"
            onClick={() => setSelectedCargo(null)}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default CargoList;