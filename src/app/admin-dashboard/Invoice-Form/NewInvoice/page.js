"use client";
import { useEffect, useState } from "react";
import {
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Typography,
  Paper,
  IconButton,
  CircularProgress,
} from "@mui/material";
import { Add as PlusIcon, Delete as TrashIcon, Close as CloseIcon } from "@mui/icons-material";
import { useSelector } from "react-redux";

export default function NewBookingForm() {
  const [seaPorts, setSeaPorts] = useState([]);
  const [distributors, setDistributors] = useState([]);
  const [invoiceData, setInvoiceData] = useState({
    date: "",
    number: "",
    amount: "",
    status: "UNPAID",
    auctionHouse: "",
    imagePath: "",
    amountYen: "",
    added_by: "",
    vehicles: [],
  });
  const username = useSelector((state) => state.user.username);
  const userid = useSelector((state) => state.user.id);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [invoiceImagePreview, setInvoiceImagePreview] = useState(null);

  useEffect(() => {
    setInvoiceData((prev) => ({ ...prev, added_by: userid || "" }));
  }, [userid]);

  useEffect(() => {
    const fetchSeaPorts = async () => {
      try {
        const response = await fetch("/api/admin/sea_ports");
        if (!response.ok) throw new Error(`Failed to fetch sea ports: ${response.statusText}`);
        const result = await response.json();
        setSeaPorts(result.data || []);
      } catch (error) {
        console.error("Error fetching sea ports:", error);
        setError(error.message);
        setSeaPorts([]);
      }
    };

    const fetchDistributors = async () => {
      try {
        const response = await fetch("/api/admin/distributers");
        if (!response.ok) throw new Error(`Failed to fetch distributors: ${response.statusText}`);
        const result = await response.json();
        setDistributors(result || []);
      } catch (error) {
        console.error("Error fetching distributors:", error);
        setError(error.message);
        setDistributors([]);
      }
    };

    Promise.all([fetchSeaPorts(), fetchDistributors()]).finally(() => setLoading(false));
  }, []);

  const handleInputChange = (field, value) => {
    setInvoiceData((prev) => ({ ...prev, [field]: value }));
    if (field === "imagePath" && value) {
      const file = value[0];
      setInvoiceImagePreview(file ? URL.createObjectURL(file) : null);
    }
  };

  const addVehicle = () => {
    setInvoiceData((prev) => ({
      ...prev,
      vehicles: [
        ...prev.vehicles,
        {
          invoiceNo: "",
          chassisNo: "",
          maker: "",
          year: "",
          color: "",
          engineType: "",
          tenPercentAdd: "",
          recycleAmount: "",
          auctionFee: "",
          auctionFeeAmount: "",
          bidAmount: "",
          commissionAmount: "",
          numberPlateTax: "",
          repairCharges: "",
          totalAmount: "",
          sendingPort: "",
          additionalAmount: "",
          isDocumentRequired: "",
          documentReceiveDate: "",
          isOwnership: "",
          ownershipDate: "",
          status: "Pending",
          distributor_id: 1,
          vehicleImages: [],
          added_by: userid || "",
        },
      ],
    }));
  };

  const removeVehicle = (index) => {
    setInvoiceData((prev) => ({
      ...prev,
      vehicles: prev.vehicles.filter((_, i) => i !== index),
    }));
  };

  const handleVehicleChange = (index, field, value) => {
    const updatedVehicles = [...invoiceData.vehicles];
    if (field === "vehicleImages") {
      const newImages = Array.from(value);
      updatedVehicles[index][field] = [...(updatedVehicles[index][field] || []), ...newImages];
      updatedVehicles[index]["vehicleImagePreviews"] = updatedVehicles[index][field].map((file) =>
        typeof file === "string" ? file : URL.createObjectURL(file)
      );
    } else {
      updatedVehicles[index][field] = value;
    }
    setInvoiceData((prev) => ({ ...prev, vehicles: updatedVehicles }));
  };

  const removeImage = (vehicleIndex, imageIndex) => {
    setInvoiceData((prev) => {
      const updatedVehicles = [...prev.vehicles];
      updatedVehicles[vehicleIndex].vehicleImages.splice(imageIndex, 1);
      if (updatedVehicles[vehicleIndex].vehicleImagePreviews) {
        updatedVehicles[vehicleIndex].vehicleImagePreviews.splice(imageIndex, 1);
      }
      return { ...prev, vehicles: updatedVehicles };
    });
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
      let jsonPayload = { ...invoiceData };

      if (!jsonPayload.number || jsonPayload.number === "") throw new Error("Invoice number is required.");
      jsonPayload.number = parseInt(jsonPayload.number, 10);
      if (isNaN(jsonPayload.number)) throw new Error("Invoice number must be a valid integer.");

      jsonPayload.amount = parseFloat(jsonPayload.amount) || 0;
      jsonPayload.amountYen = parseFloat(jsonPayload.amountYen) || 0;
      jsonPayload.added_by = parseInt(userid);

      if (invoiceData.imagePath && invoiceData.imagePath.length > 0) {
        const base64Image = await convertToBase64(invoiceData.imagePath[0]);
        const imageUrl = await uploadImageToServer(base64Image);
        jsonPayload.imagePath = imageUrl || "";
      } else {
        jsonPayload.imagePath = "";
      }

      const updatedVehicles = await Promise.all(
        invoiceData.vehicles.map(async (vehicle, index) => {
          let updatedVehicle = { ...vehicle };
          delete updatedVehicle.vehicleImagePreviews;

          const numericFields = [
            "year",
            "tenPercentAdd",
            "recycleAmount",
            "auctionFee",
            "auctionFeeAmount",
            "bidAmount",
            "commissionAmount",
            "numberPlateTax",
            "repairCharges",
            "totalAmount",
          ];
          numericFields.forEach((field) => {
            updatedVehicle[field] = parseFloat(updatedVehicle[field]) || 0;
          });

          updatedVehicle.distributor_id = parseInt(vehicle.distributor_id, 10) || 1;
          updatedVehicle.added_by = parseInt(userid);

          if (vehicle.vehicleImages && vehicle.vehicleImages.length > 0) {
            const imageUrls = await Promise.all(
              vehicle.vehicleImages.map(async (file) => {
                const base64Image = await convertToBase64(file);
                return await uploadImageToServer(base64Image);
              })
            );
            updatedVehicle.vehicleImages = imageUrls.filter((url) => url !== null);
          } else {
            updatedVehicle.vehicleImages = [];
          }

          return updatedVehicle;
        })
      );

      jsonPayload.vehicles = updatedVehicles.filter((vehicle) => vehicle !== null);

      console.log("JSON Payload to be sent:", JSON.stringify(jsonPayload, null, 2));

      const response = await fetch("/api/admin/invoice-management", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jsonPayload),
      });

      const textResponse = await response.text();
      console.log("Raw API response:", textResponse);

      if (!response.ok) throw new Error(`Server Error: ${response.status} - ${textResponse}`);

      const jsonResponse = JSON.parse(textResponse);
      console.log("Parsed JSON response:", jsonResponse);

      alert("Invoice added successfully!");
      setInvoiceData({
        date: "",
        number: "",
        amount: "",
        status: "UNPAID",
        auctionHouse: "",
        imagePath: "",
        amountYen: "",
        added_by: userid || "",
        vehicles: [],
      });
      setInvoiceImagePreview(null);
    } catch (error) {
      console.error("Error submitting invoice:", error);
      alert(`Failed to submit invoice. Error: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Box textAlign="center">
          <CircularProgress />
          <Typography variant="body1" sx={{ mt: 2 }}>
            Loading sea ports and distributors...
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
    <Box sx={{ p: 2, bgcolor: "#f1f6f9" }}>
      <Typography variant="h4" gutterBottom>
        New Invoice
      </Typography>

      {/* Invoice Details */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Invoice Details
        </Typography>
        <Box display="grid" gridTemplateColumns="repeat(4, 1fr)" gap={2}>
          <TextField
            type="date"
            label="Invoice Date"
            variant="outlined"
            value={invoiceData.date}
            onChange={(e) => handleInputChange("date", e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <TextField
            label="Invoice Number"
            variant="outlined"
            value={invoiceData.number}
            onChange={(e) => handleInputChange("number", e.target.value)}
            required
            fullWidth
          />
          <TextField
            type="number"
            label="Invoice Amount"
            variant="outlined"
            value={invoiceData.amount}
            onChange={(e) => handleInputChange("amount", e.target.value)}
            fullWidth
          />
          <TextField
            type="number"
            label="Invoice Amount (Yen)"
            variant="outlined"
            value={invoiceData.amountYen}
            onChange={(e) => handleInputChange("amountYen", e.target.value)}
            fullWidth
          />
          <FormControl variant="outlined" fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={invoiceData.status}
              onChange={(e) => handleInputChange("status", e.target.value)}
              label="Status"
            >
              <MenuItem value="UNPAID">Unpaid</MenuItem>
              <MenuItem value="PAID">Paid</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Auction House"
            variant="outlined"
            value={invoiceData.auctionHouse}
            onChange={(e) => handleInputChange("auctionHouse", e.target.value)}
            fullWidth
          />
          <Box gridColumn="span 2">
            <TextField
              type="file"
              variant="outlined"
              onChange={(e) => handleInputChange("imagePath", e.target.files)}
              inputProps={{ accept: "image/*" }}
              fullWidth
              label="Upload Invoice Image"
            />
            {invoiceImagePreview && (
              <Box mt={2}>
                <img
                  src={invoiceImagePreview}
                  alt="Invoice Preview"
                  style={{ width: 96, height: 96, objectFit: "cover", borderRadius: 8 }}
                />
              </Box>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Vehicle Details */}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Vehicle Details
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={addVehicle}
          startIcon={<PlusIcon />}
          sx={{ mb: 2 }}
        >
          Add Vehicle
        </Button>
        {invoiceData.vehicles.map((vehicle, index) => (
          <Paper key={index} elevation={1} sx={{ p: 2, mb: 2, bgcolor: "#f5f5f5" }}>
            <Box display="grid" gridTemplateColumns="repeat(5, 1fr)" gap={2}>
              <TextField
                label="Invoice No"
                variant="outlined"
                value={vehicle.invoiceNo}
                onChange={(e) => handleVehicleChange(index, "invoiceNo", e.target.value)}
                fullWidth
              />
              <TextField
                label="Chassis No"
                variant="outlined"
                value={vehicle.chassisNo}
                onChange={(e) => handleVehicleChange(index, "chassisNo", e.target.value)}
                fullWidth
              />
              <TextField
                label="Maker"
                variant="outlined"
                value={vehicle.maker}
                onChange={(e) => handleVehicleChange(index, "maker", e.target.value)}
                fullWidth
              />
              <TextField
                type="number"
                label="Year"
                variant="outlined"
                value={vehicle.year}
                onChange={(e) => handleVehicleChange(index, "year", e.target.value)}
                fullWidth
              />
              <TextField
                label="Color"
                variant="outlined"
                value={vehicle.color}
                onChange={(e) => handleVehicleChange(index, "color", e.target.value)}
                fullWidth
              />
              <TextField
                label="Engine Type"
                variant="outlined"
                value={vehicle.engineType}
                onChange={(e) => handleVehicleChange(index, "engineType", e.target.value)}
                fullWidth
              />
              <FormControl variant="outlined" fullWidth>
                <InputLabel>Sending Port</InputLabel>
                <Select
                  value={vehicle.sendingPort}
                  onChange={(e) => handleVehicleChange(index, "sendingPort", e.target.value)}
                  label="Sending Port"
                >
                  <MenuItem value="">
                    <em>Select Sending Port</em>
                  </MenuItem>
                  {seaPorts.map((port) => (
                    <MenuItem key={port.id} value={port.title}>
                      {port.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl variant="outlined" fullWidth>
                <InputLabel>Distributor</InputLabel>
                <Select
                  value={vehicle.distributor_id}
                  onChange={(e) => handleVehicleChange(index, "distributor_id", e.target.value)}
                  label="Distributor"
                >
                  <MenuItem value={1}>
                    <em>Select Distributor</em>
                  </MenuItem>
                  {distributors.map((dist) => (
                    <MenuItem key={dist.id} value={dist.id}>
                      {dist.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                type="number"
                label="Bid Amount"
                variant="outlined"
                value={vehicle.bidAmount}
                onChange={(e) => handleVehicleChange(index, "bidAmount", e.target.value)}
                fullWidth
              />
              <TextField
                type="number"
                label="10% Add"
                variant="outlined"
                value={vehicle.tenPercentAdd}
                onChange={(e) => handleVehicleChange(index, "tenPercentAdd", e.target.value)}
                fullWidth
              />
              <TextField
                type="number"
                label="Recycle Amount"
                variant="outlined"
                value={vehicle.recycleAmount}
                onChange={(e) => handleVehicleChange(index, "recycleAmount", e.target.value)}
                fullWidth
              />
              <TextField
                type="number"
                label="Auction Fee"
                variant="outlined"
                value={vehicle.auctionFee}
                onChange={(e) => handleVehicleChange(index, "auctionFee", e.target.value)}
                fullWidth
              />
              <TextField
                type="number"
                label="Commission Amount"
                variant="outlined"
                value={vehicle.commissionAmount}
                onChange={(e) => handleVehicleChange(index, "commissionAmount", e.target.value)}
                fullWidth
              />
              <TextField
                type="number"
                label="Number Plate Tax"
                variant="outlined"
                value={vehicle.numberPlateTax}
                onChange={(e) => handleVehicleChange(index, "numberPlateTax", e.target.value)}
                fullWidth
              />
              <TextField
                type="number"
                label="Repair Charges"
                variant="outlined"
                value={vehicle.repairCharges}
                onChange={(e) => handleVehicleChange(index, "repairCharges", e.target.value)}
                fullWidth
              />
              <TextField
                type="number"
                label="Total Amount"
                variant="outlined"
                value={vehicle.totalAmount}
                onChange={(e) => handleVehicleChange(index, "totalAmount", e.target.value)}
                fullWidth
              />
              <TextField
                label="Additional Amount"
                variant="outlined"
                value={vehicle.additionalAmount}
                onChange={(e) => handleVehicleChange(index, "additionalAmount", e.target.value)}
                fullWidth
              />
              <FormControl variant="outlined" fullWidth>
                <InputLabel>Document Required</InputLabel>
                <Select
                  value={vehicle.isDocumentRequired}
                  onChange={(e) => handleVehicleChange(index, "isDocumentRequired", e.target.value)}
                  label="Document Required"
                >
                  <MenuItem value="">
                    <em>Select Document Requirement</em>
                  </MenuItem>
                  <MenuItem value="yes">Yes</MenuItem>
                  <MenuItem value="no">No</MenuItem>
                </Select>
              </FormControl>
              <TextField
                type="date"
                label="Document Receive Date"
                variant="outlined"
                value={vehicle.documentReceiveDate ? vehicle.documentReceiveDate.split("T")[0] : ""}
                onChange={(e) => handleVehicleChange(index, "documentReceiveDate", e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <FormControl variant="outlined" fullWidth>
                <InputLabel>Ownership</InputLabel>
                <Select
                  value={vehicle.isOwnership}
                  onChange={(e) => handleVehicleChange(index, "isOwnership", e.target.value)}
                  label="Ownership"
                >
                  <MenuItem value="">
                    <em>Select Ownership</em>
                  </MenuItem>
                  <MenuItem value="yes">Yes</MenuItem>
                  <MenuItem value="no">No</MenuItem>
                </Select>
              </FormControl>
              <TextField
                type="date"
                label="Ownership Date"
                variant="outlined"
                value={vehicle.ownershipDate ? vehicle.ownershipDate.split("T")[0] : ""}
                onChange={(e) => handleVehicleChange(index, "ownershipDate", e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <FormControl variant="outlined" fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={vehicle.status}
                  onChange={(e) => handleVehicleChange(index, "status", e.target.value)}
                  label="Status"
                >
                  <MenuItem value="">
                    <em>Select Status</em>
                  </MenuItem>
                  <MenuItem value="Pending">Pending</MenuItem>
                </Select>
              </FormControl>
              <TextField
                type="file"
                variant="outlined"
                onChange={(e) => handleVehicleChange(index, "vehicleImages", e.target.files)}
                inputProps={{ multiple: true, accept: "image/*" }}
                label="Upload Vehicle Images"
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
            {vehicle.vehicleImagePreviews && (
              <Box mt={2} display="grid" gridTemplateColumns="repeat(8, 1fr)" gap={1}>
                {vehicle.vehicleImagePreviews.map((src, imgIndex) => (
                  <Box key={imgIndex} position="relative" width={96} height={96}>
                    <img
                      src={src}
                      alt={`Preview ${imgIndex}`}
                      style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => removeImage(index, imgIndex)}
                      sx={{ position: "absolute", top: 4, right: 4, bgcolor: "red", color: "white" }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        ))}
      </Paper>

      <Button
        variant="contained"
        color="success"
        onClick={handleSubmit}
        disabled={submitting}
        sx={{ mt: 2 }}
        startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : null}
      >
        {submitting ? "Submitting..." : "Submit Invoice"}
      </Button>
    </Box>
  );
}