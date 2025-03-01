'use client';
import { useEffect, useState } from "react";
import { TextField, Button as MuiButton, Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import { Plus, Trash } from 'lucide-react';
import { useSelector } from "react-redux";

export default function NewCargoBooking() {
  const [vehicles, setVehicles] = useState([]);
  const [searchChassisNo, setSearchChassisNo] = useState("");
  const [seaPorts, setSeaPorts] = useState([]);
  const [cargoData, setCargoData] = useState({
    actualShipper: "",
    cyOpen: "",
    bookingNo: "",
    etd: "",
    cyCutOff: "",
    eta: "",
    volume: "",
    carrier: "",
    vessel: "",
    portOfLoading: "",
    portOfDischarge: "",
    cargoMode: "",
    placeOfIssue: "",
    freightTerm: "",
    shipperName: "",
    consignee: "",
    descriptionOfGoods: "",
    containerQuantity: 0,
    numbers: "",
    imagePath: "",
    added_by: 0,
    containerDetails: {
      consigneeName: "",
      notifyParty: "",
      shipperPer: "",
      from: "",
      to: "",
      bookingNo: "",
      note: "",
      imagePath: "",
      added_by: 0,
    },
    containerItemDetails: [],
  });
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [containerImagePreview, setContainerImagePreview] = useState(null);

  const username = useSelector((state) => state.user.username);
  const userid = useSelector((state) => state.user.id);

  // Sync added_by and bookingNo for ContainerDetail
  useEffect(() => {
    setCargoData(prev => ({
      ...prev,
      added_by: userid || 0,
      containerDetails: {
        ...prev.containerDetails,
        bookingNo: prev.bookingNo,
        added_by: userid || 0,
      },
    }));
  }, [userid, cargoData.bookingNo]);

  useEffect(() => {
    const fetchSeaPorts = async () => {
      try {
        const response = await fetch("/api/admin/sea_ports");
        if (!response.ok) throw new Error("Failed to fetch sea ports");
        const ports = await response.json();
        setSeaPorts(ports.data || ports);
      } catch (err) {
        setError("Error fetching sea ports: " + err.message);
      }
    };
    fetchSeaPorts();
  }, []);

  useEffect(() => {
    const total = cargoData.containerItemDetails.reduce((sum, item) => 
      sum + (parseFloat(item.amount) || 0), 0);
    setTotalAmount(total);
  }, [cargoData.containerItemDetails]);

  const searchVehicle = async () => {
    if (!searchChassisNo) {
      setError("Please enter a chassis number");
      return;
    }
    
    console.log('Starting search with chassisNo:', searchChassisNo);
    setLoading(true);
    try {
      const url = `/api/admin/invoice-management/VehicleSearch/${searchChassisNo}`;
      console.log('Fetching URL:', url);
      const response = await fetch(url);
      console.log('Response status:', response.status);
      if (!response.ok) {
        const errorData = await response.json();
        console.log('Error response data:', errorData);
        throw new Error(errorData.message || "Vehicle not found");
      }
      const result = await response.json();
      console.log('Success response data:', result);
      setVehicles([result.data]);
      setError("");
    } catch (err) {
      setError(err.message);
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  const addToCargo = (vehicle) => {
    fetch(`/api/admin/invoice-management/VehicleSearch/${vehicle.chassisNo}`)
      .then(response => {
        if (!response.ok) throw new Error("Failed to fetch vehicle status");
        return response.json();
      })
      .then(result => {
        const fullVehicle = result.data;
        if (fullVehicle.status === "Transport" || fullVehicle.status === "Inspection") {
          setCargoData(prev => {
            const newItemNo = prev.containerItemDetails.length + 1; // Sequential number starting from 1
            return {
              ...prev,
              containerItemDetails: [...prev.containerItemDetails, {
                itemNo: newItemNo.toString(), // Convert to string for consistency
                vehicleId: fullVehicle.id,
                chassisNo: fullVehicle.chassisNo,
                year: fullVehicle.year.toString(),
                color: fullVehicle.color,
                cc: fullVehicle.engineType,
                amount: 0,
              }],
            };
          });
          setVehicles([]);
          setSearchChassisNo("");
        } else {
          alert(`Cannot add vehicle. Current status: ${fullVehicle.status}`);
        }
      })
      .catch(err => {
        setError("Error checking vehicle status: " + err.message);
      });
  };

  const updateContainerDetail = (field, value) => {
    setCargoData(prev => ({
      ...prev,
      containerDetails: { ...prev.containerDetails, [field]: value },
    }));
  };

  const updateVehicleCargo = (index, field, value) => {
    const updatedItems = [...cargoData.containerItemDetails];
    updatedItems[index][field] = value;
    setCargoData(prev => ({ ...prev, containerItemDetails: updatedItems }));
  };

  const removeVehicle = (index) => {
    setCargoData(prev => {
      const updatedItems = prev.containerItemDetails
        .filter((_, i) => i !== index)
        .map((item, i) => ({
          ...item,
          itemNo: (i + 1).toString(), // Re-sequence itemNo after removal
        }));
      return { ...prev, containerItemDetails: updatedItems };
    });
  };

  const handleInputChange = (field, value) => {
    setCargoData(prev => ({ ...prev, [field]: value }));
    if (field === "receiptImage" && value) {
      const file = value[0];
      setImagePreview(file ? URL.createObjectURL(file) : null);
    }
    if (field === "containerImage" && value) {
      const file = value[0];
      setContainerImagePreview(file ? URL.createObjectURL(file) : null);
      setCargoData(prev => ({
        ...prev,
        containerDetails: { ...prev.containerDetails, imagePath: file ? URL.createObjectURL(file) : "" },
      }));
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
      
      let bookingImagePath = "";
      if (cargoData.receiptImage) {
        const base64Image = await convertToBase64(cargoData.receiptImage[0]);
        bookingImagePath = await uploadImageToServer(base64Image);
        if (!bookingImagePath) {
          throw new Error("Failed to upload booking receipt image");
        }
      }

      let containerImagePath = cargoData.containerDetails.imagePath;
      if (cargoData.containerDetails.imagePath && cargoData.containerDetails.imagePath.startsWith("blob:")) {
        const base64Image = await convertToBase64(cargoData.containerImage[0]);
        containerImagePath = await uploadImageToServer(base64Image);
        if (!containerImagePath) {
          throw new Error("Failed to upload container detail image");
        }
      }

      const payload = {
        actualShipper: cargoData.actualShipper,
        cyOpen: cargoData.cyOpen,
        bookingNo: cargoData.bookingNo,
        etd: cargoData.etd,
        cyCutOff: cargoData.cyCutOff,
        eta: cargoData.eta,
        volume: cargoData.volume,
        carrier: cargoData.carrier,
        vessel: cargoData.vessel,
        portOfLoading: cargoData.portOfLoading,
        portOfDischarge: cargoData.portOfDischarge,
        cargoMode: cargoData.cargoMode,
        placeOfIssue: cargoData.placeOfIssue,
        freightTerm: cargoData.freightTerm,
        shipperName: cargoData.shipperName,
        consignee: cargoData.consignee,
        descriptionOfGoods: cargoData.descriptionOfGoods,
        containerQuantity: parseInt(cargoData.containerQuantity) || 0,
        numbers: cargoData.numbers,
        imagePath: bookingImagePath || "",
        added_by: cargoData.added_by,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        containerDetails: [{
          consigneeName: cargoData.containerDetails.consigneeName,
          notifyParty: cargoData.containerDetails.notifyParty,
          shipperPer: cargoData.containerDetails.shipperPer,
          from: cargoData.containerDetails.from,
          to: cargoData.containerDetails.to,
          bookingNo: cargoData.bookingNo,
          note: cargoData.containerDetails.note,
          imagePath: containerImagePath || "",
          added_by: cargoData.containerDetails.added_by,
        }],
        containerItemDetails: cargoData.containerItemDetails.map(item => ({
          itemNo: item.itemNo,
          vehicleId: item.vehicleId,
          chassisNo: item.chassisNo,
          year: item.year,
          color: item.color,
          cc: item.cc,
          amount: parseFloat(item.amount) || 0,
        })),
      };

      console.log("Data to be submitted:", JSON.stringify(payload, null, 2));

      const response = await fetch("/api/admin/cargo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit cargo booking data");
      }

      alert("Cargo booking data submitted successfully!");
      setCargoData({
        actualShipper: "",
        cyOpen: "",
        bookingNo: "",
        etd: "",
        cyCutOff: "",
        eta: "",
        volume: "",
        carrier: "",
        vessel: "",
        portOfLoading: "",
        portOfDischarge: "",
        cargoMode: "",
        placeOfIssue: "",
        freightTerm: "",
        shipperName: "",
        consignee: "",
        descriptionOfGoods: "",
        containerQuantity: 0,
        numbers: "",
        imagePath: "",
        added_by: 0,
        containerDetails: {
          consigneeName: "",
          notifyParty: "",
          shipperPer: "",
          from: "",
          to: "",
          bookingNo: "",
          note: "",
          imagePath: "",
          added_by: 0,
        },
        containerItemDetails: [],
      });
      setImagePreview(null);
      setContainerImagePreview(null);
    } catch (error) {
      console.error("Error submitting cargo booking data:", error);
      alert(`Failed to submit: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col bg-[#f1f6f9] w-full h-full rounded p-4">
      <h1 className="text-3xl font-bold mb-4">New Cargo Booking</h1>

      <div className="p-4 border rounded-lg bg-white mb-4">
        <h2 className="text-xl font-semibold pb-2">Cargo Booking Details</h2>
        <div className="grid md:grid-cols-4 grid-cols-1 gap-4">
          <TextField
            label="Actual Shipper"
            variant="outlined"
            value={cargoData.actualShipper}
            onChange={(e) => handleInputChange("actualShipper", e.target.value)}
            fullWidth
          />
          <TextField
            label="CY Open"
            variant="outlined"
            value={cargoData.cyOpen}
            onChange={(e) => handleInputChange("cyOpen", e.target.value)}
            fullWidth
          />
          <TextField
            label="Booking No"
            variant="outlined"
            value={cargoData.bookingNo}
            onChange={(e) => handleInputChange("bookingNo", e.target.value)}
            fullWidth
          />
          <TextField
            type="date"
            label="ETD"
            variant="outlined"
            value={cargoData.etd}
            onChange={(e) => handleInputChange("etd", e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <TextField
            type="date"
            label="CY Cut Off"
            variant="outlined"
            value={cargoData.cyCutOff}
            onChange={(e) => handleInputChange("cyCutOff", e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <TextField
            type="date"
            label="ETA"
            variant="outlined"
            value={cargoData.eta}
            onChange={(e) => handleInputChange("eta", e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <TextField
            label="Volume"
            variant="outlined"
            value={cargoData.volume}
            onChange={(e) => handleInputChange("volume", e.target.value)}
            fullWidth
          />
          <TextField
            label="Carrier"
            variant="outlined"
            value={cargoData.carrier}
            onChange={(e) => handleInputChange("carrier", e.target.value)}
            fullWidth
          />
          <TextField
            label="Vessel"
            variant="outlined"
            value={cargoData.vessel}
            onChange={(e) => handleInputChange("vessel", e.target.value)}
            fullWidth
          />
          <FormControl fullWidth variant="outlined">
            <InputLabel>Port of Loading</InputLabel>
            <Select
              value={cargoData.portOfLoading}
              onChange={(e) => handleInputChange("portOfLoading", e.target.value)}
              label="Port of Loading"
            >
              <MenuItem value="">
                <em>Select Port</em>
              </MenuItem>
              {seaPorts.map((port) => (
                <MenuItem key={port.id} value={port.title || port.name}>
                  {port.title || port.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth variant="outlined">
            <InputLabel>Port of Discharge</InputLabel>
            <Select
              value={cargoData.portOfDischarge}
              onChange={(e) => handleInputChange("portOfDischarge", e.target.value)}
              label="Port of Discharge"
            >
              <MenuItem value="">
                <em>Select Port</em>
              </MenuItem>
              {seaPorts.map((port) => (
                <MenuItem key={port.id} value={port.title || port.name}>
                  {port.title || port.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Cargo Mode"
            variant="outlined"
            value={cargoData.cargoMode}
            onChange={(e) => handleInputChange("cargoMode", e.target.value)}
            fullWidth
          />
          <TextField
            label="Place of Issue"
            variant="outlined"
            value={cargoData.placeOfIssue}
            onChange={(e) => handleInputChange("placeOfIssue", e.target.value)}
            fullWidth
          />
          <TextField
            label="Freight Term"
            variant="outlined"
            value={cargoData.freightTerm}
            onChange={(e) => handleInputChange("freightTerm", e.target.value)}
            fullWidth
          />
          <TextField
            label="Shipper Name"
            variant="outlined"
            value={cargoData.shipperName}
            onChange={(e) => handleInputChange("shipperName", e.target.value)}
            fullWidth
          />
          <TextField
            label="Consignee"
            variant="outlined"
            value={cargoData.consignee}
            onChange={(e) => handleInputChange("consignee", e.target.value)}
            fullWidth
          />
          <TextField
            label="Description of Goods"
            variant="outlined"
            value={cargoData.descriptionOfGoods}
            onChange={(e) => handleInputChange("descriptionOfGoods", e.target.value)}
            fullWidth
          />
          <TextField
            type="number"
            label="Container Quantity"
            variant="outlined"
            value={cargoData.containerQuantity}
            onChange={(e) => handleInputChange("containerQuantity", e.target.value)}
            fullWidth
          />
          <TextField
            label="Numbers"
            variant="outlined"
            value={cargoData.numbers}
            onChange={(e) => handleInputChange("numbers", e.target.value)}
            fullWidth
          />
          <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-700 mb-1">Upload Receipt</label>
            <TextField
              type="file"
              variant="outlined"
              onChange={(e) => handleInputChange("receiptImage", e.target.files)}
              inputProps={{ accept: "image/*" }}
              fullWidth
            />
            {imagePreview && (
              <div className="mt-2">
                <img
                  src={imagePreview}
                  alt="Receipt Preview"
                  className="w-32 h-32 object-cover rounded-lg border"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 border rounded-lg bg-white mb-4">
        <h2 className="text-xl font-semibold pb-2">Container Details</h2>
        <div className="grid md:grid-cols-4 grid-cols-1 gap-4">
          <TextField
            label="Consignee Name"
            variant="outlined"
            value={cargoData.containerDetails.consigneeName}
            onChange={(e) => updateContainerDetail("consigneeName", e.target.value)}
            fullWidth
          />
          <TextField
            label="Notify Party"
            variant="outlined"
            value={cargoData.containerDetails.notifyParty}
            onChange={(e) => updateContainerDetail("notifyParty", e.target.value)}
            fullWidth
          />
          <TextField
            label="Shipper Per"
            variant="outlined"
            value={cargoData.containerDetails.shipperPer}
            onChange={(e) => updateContainerDetail("shipperPer", e.target.value)}
            fullWidth
          />
          <TextField
            label="From"
            variant="outlined"
            value={cargoData.containerDetails.from}
            onChange={(e) => updateContainerDetail("from", e.target.value)}
            fullWidth
          />
          <TextField
            label="To"
            variant="outlined"
            value={cargoData.containerDetails.to}
            onChange={(e) => updateContainerDetail("to", e.target.value)}
            fullWidth
          />
          <TextField
            label="Booking No"
            variant="outlined"
            value={cargoData.containerDetails.bookingNo}
            disabled
            fullWidth
          />
          <TextField
            label="Note"
            variant="outlined"
            value={cargoData.containerDetails.note}
            onChange={(e) => updateContainerDetail("note", e.target.value)}
            fullWidth
          />
          <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-700 mb-1">Container Image</label>
            <TextField
              type="file"
              variant="outlined"
              onChange={(e) => handleInputChange("containerImage", e.target.files)}
              inputProps={{ accept: "image/*" }}
              fullWidth
            />
            {containerImagePreview && (
              <div className="mt-2">
                <img
                  src={containerImagePreview}
                  alt="Container Image Preview"
                  className="w-32 h-32 object-cover rounded-lg border"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 border rounded-lg bg-white mb-4">
        <h2 className="text-xl font-semibold pb-2">Search Vehicle</h2>
        <div className="flex gap-4 items-center">
          <TextField
            label="Enter Chassis Number"
            variant="outlined"
            value={searchChassisNo}
            onChange={(e) => {
              console.log('Input value changed to:', e.target.value);
              setSearchChassisNo(e.target.value);
            }}
            fullWidth
          />
          <MuiButton
            variant="contained"
            color="success"
            onClick={searchVehicle}
            disabled={loading}
            startIcon={<Plus />}
          >
            {loading ? "Searching..." : "Search"}
          </MuiButton>
        </div>
        {error && <p className="text-red-500 mt-2">{error}</p>}
        {vehicles.map((vehicle, index) => (
          <div key={index} className="mt-4 p-2 border rounded flex justify-between items-center">
            <div>
              <p>Vehicle ID: {vehicle.id}</p>
              <p>Chassis No: {vehicle.chassisNo}</p>
              <p>Maker: {vehicle.maker}</p>
              <p>Year: {vehicle.year}</p>
            </div>
            <MuiButton
              variant="contained"
              color="success"
              onClick={() => addToCargo(vehicle)}
              startIcon={<Plus />}
            >
              Add to Cargo
            </MuiButton>
          </div>
        ))}
      </div>

      <div className="p-4 border rounded-lg bg-white">
        <h2 className="text-xl font-semibold pb-2">Container Items</h2>
        {cargoData.containerItemDetails.length === 0 ? (
          <p>No items added yet</p>
        ) : (
          <div className="grid md:grid-cols-8 grid-cols-1 gap-4 font-semibold mb-2">
            <span>Item No</span>
            <span>Vehicle ID</span>
            <span>Chassis No</span>
            <span>Year</span>
            <span>Color</span>
            <span>CC</span>
            <span>Amount</span>
            <span>Actions</span>
          </div>
        )}
        {cargoData.containerItemDetails.map((item, index) => (
          <div key={index} className="grid md:grid-cols-8 grid-cols-1 gap-4 mb-2 items-center">
            <span>{item.itemNo}</span>
            <span>{item.vehicleId}</span>
            <span>{item.chassisNo}</span>
            <span>{item.year}</span>
            <span>{item.color}</span>
            <span>{item.cc}</span>
            <TextField
              type="number"
              label="Amount"
              variant="outlined"
              value={item.amount}
              onChange={(e) => updateVehicleCargo(index, "amount", e.target.value)}
              fullWidth
            />
            <MuiButton
              variant="contained"
              color="error"
              onClick={() => removeVehicle(index)}
              startIcon={<Trash />}
            >
              Remove
            </MuiButton>
          </div>
        ))}
        {cargoData.containerItemDetails.length > 0 && (
          <div className="mt-4">
            <p className="text-lg font-semibold">
              Total Amount: {totalAmount.toFixed(2)}
            </p>
          </div>
        )}
      </div>

      <MuiButton
        variant="contained"
        color="success"
        onClick={handleSubmit}
        disabled={submitting || cargoData.containerItemDetails.length === 0}
        className="mt-4"
      >
        {submitting ? "Submitting..." : "Submit Cargo Booking"}
      </MuiButton>
    </div>
  );
}