"use client";
import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Paper,
  Modal,
  IconButton,
} from "@mui/material";
import { Clear as ClearIcon, Download as DownloadIcon } from "@mui/icons-material";

const VehiclesList = () => {
  const [vehicles, setVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [detailedVehicle, setDetailedVehicle] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Fetch initial vehicle list
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await fetch("/api/admin/vehicles");
        if (!response.ok) throw new Error("Failed to fetch vehicles");
        const data = await response.json();
        console.log("API response:", data);

        const fetchedVehicles = data.data || [];
        setVehicles(fetchedVehicles);
        setFilteredVehicles(fetchedVehicles);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, []);

  // Filter vehicles when searching
  useEffect(() => {
    const filtered = vehicles.filter((vehicle) =>
      (vehicle.chassisNo || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (vehicle.maker || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (vehicle.distributor?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (vehicle.seaPort?.name || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredVehicles(filtered);
    setCurrentPage(1);
  }, [searchQuery, vehicles]);

  // Fetch detailed vehicle data
  useEffect(() => {
    const fetchDetailedVehicle = async () => {
      if (!selectedVehicle) {
        setDetailedVehicle(null);
        return;
      }

      setDetailsLoading(true);
      try {
        const response = await fetch(`/api/admin/vehicles/${selectedVehicle.id}`);
        if (!response.ok) throw new Error("Failed to fetch vehicle details");
        const data = await response.json();
        if (data.status) {
          setDetailedVehicle(data.data);
        } else {
          throw new Error(data.error || "Unknown error");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setDetailsLoading(false);
      }
    };

    fetchDetailedVehicle();
  }, [selectedVehicle]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage);
  const paginatedVehicles = filteredVehicles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Download Image Handler
  const handleDownload = (url, filename) => {
    fetch(url)
      .then((response) => response.blob())
      .then((blob) => {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = filename || "image";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      })
      .catch((err) => console.error("Error downloading image:", err));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="64vh">
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>Loading vehicles...</Typography>
      </Box>
    );
  }
  if (error) return <Typography color="error" align="center">{error}</Typography>;

  return (
    <Box sx={{ maxWidth: "1200px", mx: "auto", p: 3, bgcolor: "#fff", borderRadius: 2, boxShadow: 3 }}>
      <Typography variant="h5" gutterBottom>Vehicles List</Typography>

      {/* Search Input */}
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search by Chassis No, Maker, Distributor, or Sea Port..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ mb: 3 }}
        InputProps={{
          endAdornment: searchQuery && (
            <IconButton onClick={() => setSearchQuery("")} size="small">
              <ClearIcon />
            </IconButton>
          ),
        }}
      />

      {/* Vehicles Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: "#f5f5f5" }}>
              <TableCell>#</TableCell>
              <TableCell>Chassis No</TableCell>
              <TableCell>Maker</TableCell>
              <TableCell>Year</TableCell>
              <TableCell>Color</TableCell>
              <TableCell>Distributor</TableCell>
              <TableCell>Sea Port</TableCell>
              <TableCell>Total Amount (USD)</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedVehicles.length > 0 ? (
              paginatedVehicles.map((vehicle, index) => (
                <TableRow key={vehicle.id} hover>
                  <TableCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                  <TableCell>{vehicle.chassisNo}</TableCell>
                  <TableCell>{vehicle.maker}</TableCell>
                  <TableCell>{vehicle.year}</TableCell>
                  <TableCell>{vehicle.color}</TableCell>
                  <TableCell>{vehicle.distributor?.name || "N/A"}</TableCell>
                  <TableCell>{vehicle.seaPort?.name || "N/A"}</TableCell>
                  <TableCell>
                    ${(vehicle.totalAmount_dollers ? parseFloat(vehicle.totalAmount_dollers) : 0).toFixed(2)}
                  </TableCell>
                  <TableCell sx={{ color: vehicle.status === "Delivered" ? "green" : "orange" }}>
                    {vehicle.status}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={() => setSelectedVehicle(vehicle)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={10} align="center">No vehicles found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={3} gap={1}>
          <Button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            variant="outlined"
          >
            Prev
          </Button>
          {Array.from({ length: totalPages }, (_, index) => (
            <Button
              key={index + 1}
              onClick={() => setCurrentPage(index + 1)}
              variant={currentPage === index + 1 ? "contained" : "outlined"}
            >
              {index + 1}
            </Button>
          ))}
          <Button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            variant="outlined"
          >
            Next
          </Button>
        </Box>
      )}

      {/* Vehicle Details Modal */}
      <Modal
        open={!!selectedVehicle}
        onClose={() => setSelectedVehicle(null)}
        aria-labelledby="vehicle-details-modal"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "80%",
            maxWidth: 1200,
            maxHeight: "90vh",
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
            overflowY: "auto",
          }}
        >
          <Typography variant="h6" id="vehicle-details-modal" gutterBottom>
            Vehicle Details
          </Typography>

          {detailsLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
              <CircularProgress />
            </Box>
          ) : detailedVehicle ? (
            <Grid container spacing={3}>
              {/* Vehicle Information */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>Vehicle Information</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={3}><Typography><strong>ID:</strong> {detailedVehicle.id}</Typography></Grid>
                      <Grid item xs={3}><Typography><strong>Chassis No:</strong> {detailedVehicle.chassisNo}</Typography></Grid>
                      <Grid item xs={3}><Typography><strong>Maker:</strong> {detailedVehicle.maker}</Typography></Grid>
                      <Grid item xs={3}><Typography><strong>Year:</strong> {detailedVehicle.year}</Typography></Grid>
                      <Grid item xs={3}><Typography><strong>Color:</strong> {detailedVehicle.color}</Typography></Grid>
                      <Grid item xs={3}><Typography><strong>Distributor:</strong> {detailedVehicle.distributor?.name || "N/A"}</Typography></Grid>
                      <Grid item xs={3}><Typography><strong>Sea Port:</strong> {detailedVehicle.seaPort?.name || "N/A"}</Typography></Grid>
                      <Grid item xs={3}><Typography><strong>Total Amount (USD):</strong> ${(detailedVehicle.totalAmount_dollers || 0).toFixed(2)}</Typography></Grid>
                      <Grid item xs={3}><Typography><strong>Status:</strong> {detailedVehicle.status}</Typography></Grid>
                      <Grid item xs={3}><Typography><strong>Invoice No:</strong> {detailedVehicle.invoiceNo}</Typography></Grid>
                      <Grid item xs={3}><Typography><strong>Document Required:</strong> {detailedVehicle.isDocumentRequired}</Typography></Grid>
                      <Grid item xs={3}><Typography><strong>Ownership:</strong> {detailedVehicle.isOwnership}</Typography></Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Vehicle Images */}
              {detailedVehicle.vehicleImages && detailedVehicle.vehicleImages.length > 0 && (
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>Vehicle Images</Typography>
                      <Grid container spacing={2}>
                        {detailedVehicle.vehicleImages.map((image, idx) => (
                          <Grid item xs={3} key={idx}>
                            <Card sx={{ height: "100%" }}>
                              <img
                                src={image.imagePath}
                                alt={`Vehicle Image ${idx + 1}`}
                                style={{ width: "100%", height: 150, objectFit: "cover" }}
                                onError={(e) => (e.target.src = "https://via.placeholder.com/150?text=Image+Not+Found")}
                              />
                              <CardContent sx={{ p: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <Typography variant="body2" noWrap>
                                  <a href={image.imagePath} target="_blank" rel="noopener noreferrer">
                                    {image.imagePath.split("/").pop()}
                                  </a>
                                </Typography>
                                <IconButton
                                  color="primary"
                                  onClick={() => handleDownload(image.imagePath, `vehicle_image_${idx + 1}.${image.imagePath.split(".").pop()}`)}
                                >
                                  <DownloadIcon />
                                </IconButton>
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {/* Container Items */}
              {detailedVehicle.containerItems && detailedVehicle.containerItems.length > 0 && (
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>Container Items</Typography>
                      <Grid container spacing={2}>
                        {detailedVehicle.containerItems.map((item, idx) => (
                          <Grid item xs={3} key={idx}>
                            <Card>
                              <CardContent>
                                <Typography><strong>Item No:</strong> {item.itemNo || "N/A"}</Typography>
                                <Typography><strong>Chassis No:</strong> {item.chassisNo || "N/A"}</Typography>
                                <Typography><strong>Year:</strong> {item.year || "N/A"}</Typography>
                                <Typography><strong>Amount:</strong> ${(item.amount || 0).toFixed(2)}</Typography>
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {/* Transport Details */}
              {detailedVehicle.transports && detailedVehicle.transports.length > 0 && (
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>Transport Details</Typography>
                      <Grid container spacing={2}>
                        {detailedVehicle.transports.map((transport, idx) => (
                          <Grid item xs={3} key={idx}>
                            <Card>
                              <CardContent>
                                <Typography><strong>Date:</strong> {new Date(transport.date).toLocaleDateString()}</Typography>
                                <Typography><strong>Company:</strong> {transport.company}</Typography>
                                <Typography><strong>Fee (USD):</strong> ${(transport.fee_doller || 0).toFixed(2)}</Typography>
                                {transport.imagePath && (
                                  <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Typography>
                                      <strong>Image:</strong>{" "}
                                      <a href={transport.imagePath} target="_blank" rel="noopener noreferrer">View</a>
                                    </Typography>
                                    <IconButton
                                      color="primary"
                                      onClick={() => handleDownload(transport.imagePath, `transport_image_${idx + 1}.${transport.imagePath.split(".").pop()}`)}
                                    >
                                      <DownloadIcon />
                                    </IconButton>
                                  </Box>
                                )}
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          ) : (
            <Typography color="error">Failed to load vehicle details.</Typography>
          )}

          <Button
            variant="contained"
            color="error"
            onClick={() => setSelectedVehicle(null)}
            sx={{ mt: 3, width: "100%" }}
          >
            Close
          </Button>
        </Box>
      </Modal>
    </Box>
  );
};

export default VehiclesList;