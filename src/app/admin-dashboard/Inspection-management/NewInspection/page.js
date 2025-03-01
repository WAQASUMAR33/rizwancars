"use client";
import { useEffect, useState } from "react";
import {
  TextField,
  Button,
  Box,
  Typography,
  Paper,
  IconButton,
} from "@mui/material";
import { Add as PlusIcon, Delete as TrashIcon } from "@mui/icons-material";
import { useSelector } from "react-redux";

export default function InspectionBookingForm() {
  const [vehicles, setVehicles] = useState([]);
  const [searchChassisNo, setSearchChassisNo] = useState("");
  const [inspectionData, setInspectionData] = useState({
    date: "",
    company: "",
    receiptImage: null,
    added_by: null,
    vehicles: [],
  });
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [imagePreview, setImagePreview] = useState(null);

  const username = useSelector((state) => state.user.username);
  const userid = useSelector((state) => state.user.id);

  useEffect(() => {
    setInspectionData((prev) => ({ ...prev, added_by: userid }));
  }, [userid]);

  useEffect(() => {
    const total = inspectionData.vehicles.reduce((sum, vehicle) => 
      sum + (parseFloat(vehicle.amount) || 0), 0);
    setTotalAmount(total);
  }, [inspectionData.vehicles]);

  const searchVehicle = async () => {
    if (!searchChassisNo) {
      setError("Please enter a chassis number");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/invoice-management/VehicleSearch/${searchChassisNo}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Vehicle not found");
      }
      const result = await response.json();
      setVehicles([result.data]);
      setError("");
    } catch (err) {
      setError(err.message);
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  const addToInspection = (vehicle) => {
    fetch(`/api/admin/invoice-management/VehicleSearch/${vehicle.chassisNo}`)
      .then((response) => {
        if (!response.ok) throw new Error("Failed to fetch vehicle status");
        return response.json();
      })
      .then((result) => {
        const fullVehicle = result.data;
        if (fullVehicle.status === "Transport") {
          setInspectionData((prev) => ({
            ...prev,
            vehicles: [...prev.vehicles, {
              id: fullVehicle.id,
              chassisNo: fullVehicle.chassisNo,
              amount: "",
            }],
          }));
          setVehicles([]);
          setSearchChassisNo("");
        } else {
          alert(`Cannot add vehicle. Current status: ${fullVehicle.status}`);
        }
      })
      .catch((err) => {
        setError("Error checking vehicle status: " + err.message);
      });
  };

  const updateVehicleInspection = (index, field, value) => {
    const updatedVehicles = [...inspectionData.vehicles];
    updatedVehicles[index][field] = value;
    setInspectionData((prev) => ({ ...prev, vehicles: updatedVehicles }));
  };

  const removeVehicle = (index) => {
    const updatedVehicles = inspectionData.vehicles.filter((_, i) => i !== index);
    setInspectionData((prev) => ({ ...prev, vehicles: updatedVehicles }));
  };

  const handleInputChange = (field, value) => {
    setInspectionData((prev) => ({ ...prev, [field]: value }));
    if (field === "receiptImage" && value) {
      const file = value[0];
      setImagePreview(file ? URL.createObjectURL(file) : null);
    }
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const uploadImageToServer = async (base64Image) => {
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_IMAGE_UPLOAD_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Image }),
      });
      const data = await response.json();
      if (!response.ok || !data.image_url) throw new Error("Failed to upload image");
      return `${process.env.NEXT_PUBLIC_IMAGE_UPLOAD_PATH}/${data.image_url}`;
    } catch (error) {
      console.error("Image upload error:", error);
      return null;
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      let imagePath = "";
      if (inspectionData.receiptImage) {
        const base64Image = await convertToBase64(inspectionData.receiptImage[0]);
        imagePath = await uploadImageToServer(base64Image);
        if (!imagePath) {
          throw new Error("Failed to upload receipt image");
        }
      }

      const payload = {
        date: inspectionData.date,
        company: inspectionData.company,
        imagePath: imagePath || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        added_by: inspectionData.added_by,
        vehicles: inspectionData.vehicles.map((v) => ({
          ...v,
          amount: parseFloat(v.amount) || 0,
        })),
      };

      console.log("Data to be submitted:", JSON.stringify(payload, null, 2));

      const response = await fetch("/api/admin/inspection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit inspection data");
      }

      alert("Inspection data submitted successfully!");
      setInspectionData({
        date: "",
        company: "",
        receiptImage: null,
        added_by: userid,
        vehicles: [],
      });
      setImagePreview(null);
    } catch (error) {
      console.error("Error submitting inspection data:", error);
      alert(`Failed to submit: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ p: 2, bgcolor: "#f1f6f9" }}>
      <Typography variant="h4" gutterBottom>
        New Inspection Booking
      </Typography>

      {/* Inspection Details */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Inspection Details
        </Typography>
        <Box display="grid" gridTemplateColumns="repeat(4, 1fr)" gap={2}>
          <TextField
            type="date"
            label="Inspection Date"
            variant="outlined"
            value={inspectionData.date}
            onChange={(e) => handleInputChange("date", e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <TextField
            label="Company"
            variant="outlined"
            value={inspectionData.company}
            onChange={(e) => handleInputChange("company", e.target.value)}
            fullWidth
          />
          <Box display="flex" flexDirection="column">
            <TextField
              type="file"
              variant="outlined"
              onChange={(e) => handleInputChange("receiptImage", e.target.files)}
              inputProps={{ accept: "image/*" }}
              label="Upload Receipt"
              fullWidth
            />
            {imagePreview && (
              <Box mt={2}>
                <img
                  src={imagePreview}
                  alt="Receipt Preview"
                  style={{ width: 128, height: 128, objectFit: "cover", borderRadius: 8 }}
                />
              </Box>
            )}
          </Box>
          {/* Empty column for spacing */}
          <Box />
        </Box>
      </Paper>

      {/* Search Vehicle */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Search Vehicle
        </Typography>
        <Box display="flex" gap={2} alignItems="center">
          <TextField
            label="Enter Chassis Number"
            variant="outlined"
            value={searchChassisNo}
            onChange={(e) => setSearchChassisNo(e.target.value)}
            fullWidth
          />
          <Button
            variant="contained"
            color="success"
            onClick={searchVehicle}
            disabled={loading}
            startIcon={<PlusIcon />}
          >
            {loading ? "Searching..." : "Search"}
          </Button>
        </Box>
        {error && (
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            {error}
          </Typography>
        )}
        {vehicles.map((vehicle, index) => (
          <Paper key={index} elevation={1} sx={{ mt: 2, p: 2, display: "flex", justifyContent: "space-between" }}>
            <Box>
              <Typography variant="body1">Chassis No: {vehicle.chassisNo}</Typography>
              <Typography variant="body1">Maker: {vehicle.maker}</Typography>
              <Typography variant="body1">Year: {vehicle.year}</Typography>
            </Box>
            <Button
              variant="contained"
              color="success"
              onClick={() => addToInspection(vehicle)}
              startIcon={<PlusIcon />}
            >
              Add to Inspection
            </Button>
          </Paper>
        ))}
      </Paper>

      {/* Vehicles for Inspection */}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Vehicles for Inspection
        </Typography>
        {inspectionData.vehicles.length === 0 ? (
          <Typography variant="body1" color="textSecondary">
            No vehicles added yet
          </Typography>
        ) : (
          <Box>
            <Box display="grid" gridTemplateColumns="repeat(4, 1fr)" gap={2} sx={{ fontWeight: "bold", mb: 1 }}>
              <Typography variant="body1">Vehicle ID</Typography>
              <Typography variant="body1">Chassis No</Typography>
              <Typography variant="body1">Amount</Typography>
              <Typography variant="body1">Actions</Typography>
            </Box>
            {inspectionData.vehicles.map((vehicle, index) => (
              <Box key={index} display="grid" gridTemplateColumns="repeat(4, 1fr)" gap={2} alignItems="center" mb={1}>
                <Typography variant="body1">{vehicle.id}</Typography>
                <Typography variant="body1">{vehicle.chassisNo}</Typography>
                <TextField
                  type="number"
                  label="Amount"
                  variant="outlined"
                  value={vehicle.amount}
                  onChange={(e) => updateVehicleInspection(index, "amount", e.target.value)}
                  fullWidth
                />
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => removeVehicle(index)}
                  startIcon={<TrashIcon />}
                >
                  Remove
                </Button>
              </Box>
            ))}
            <Box mt={2}>
              <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                Total Amount: {totalAmount.toFixed(2)}
              </Typography>
            </Box>
          </Box>
        )}
      </Paper>

      <Button
        variant="contained"
        color="success"
        onClick={handleSubmit}
        disabled={submitting || inspectionData.vehicles.length === 0}
        sx={{ mt: 2 }}
      >
        {submitting ? "Submitting..." : "Submit Inspection"}
      </Button>
    </Box>
  );
}