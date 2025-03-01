"use client";
import { useState, useEffect } from "react";

const VehiclesList = () => {
  const [vehicles, setVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  // Fetch Data from API
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await fetch("/api/admin/invoice-management");
        if (!response.ok) {
          throw new Error("Failed to fetch vehicles");
        }
        const data = await response.json();
        console.log("API response:", data);

        // Flatten the nested addVehicles from invoices
        const flattenedVehicles = (data.data || []).flatMap(invoice => 
          invoice.addVehicles.map(vehicle => ({
            ...vehicle,
            invoice: { // Include invoice data for modal
              id: invoice.id,
              number: invoice.number,
              date: invoice.date,
              status: invoice.status,
            }
          }))
        );
        console.log("Flattened vehicles:", flattenedVehicles);

        setVehicles(flattenedVehicles);
        setFilteredVehicles(flattenedVehicles);
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
      (vehicle.sendingPort || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredVehicles(filtered);
    setCurrentPage(1); // Reset to first page when searching
  }, [searchQuery, vehicles]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage);
  const paginatedVehicles = filteredVehicles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-lg text-gray-600">Loading vehicles...</p>
        </div>
      </div>
    );
  }
  if (error) return <p className="text-center text-red-500">{error}</p>;

  return (
    <div className="max-w-6xl mx-auto bg-white shadow-lg rounded-lg p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mt-0 mb-4">Vehicles List</h2>

      {/* Search Input */}
      <div className="relative mb-4">
        <input
          type="text"
          placeholder="Search by Chassis No, Maker, or Sending Port..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
          >
            ✖
          </button>
        )}
      </div>

      {/* Vehicles Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300 rounded-lg">
          <thead className="bg-gray-200">
            <tr className="text-gray-700">
              <th className="border p-3 text-left bg-[#F5F5F5]">#</th>
              <th className="border p-3 text-left bg-[#F5F5F5]">Chassis No</th>
              <th className="border p-3 text-left bg-[#F5F5F5]">Maker</th>
              <th className="border p-3 text-left bg-[#F5F5F5]">Year</th>
              <th className="border p-3 text-left bg-[#F5F5F5]">Color</th>
              <th className="border p-3 text-left bg-[#F5F5F5]">Sending Port</th>
              <th className="border p-3 text-left bg-[#F5F5F5]">Total Amount</th>
              <th className="border p-3 text-left bg-[#F5F5F5]">Status</th>
              <th className="border p-3 text-left bg-[#F5F5F5]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedVehicles.length > 0 ? (
              paginatedVehicles.map((vehicle, index) => (
                <tr key={vehicle.id} className="border-b hover:bg-gray-100 transition">
                  <td className="p-3">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                  <td className="p-3">{vehicle.chassisNo}</td>
                  <td className="p-3">{vehicle.maker}</td>
                  <td className="p-3">{vehicle.year}</td>
                  <td className="p-3">{vehicle.color}</td>
                  <td className="p-3">{vehicle.sendingPort}</td>
                  <td className="p-3 font-semibold">${(vehicle.totalAmount ? parseFloat(vehicle.totalAmount) : 0).toFixed(2)}</td>
                  <td
                    className={`p-3 font-medium ${
                      vehicle.status === "COMPLETED" ? "text-green-600" : "text-yellow-600"
                    }`}
                  >
                    {vehicle.status}
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => setSelectedVehicle(vehicle)}
                      className="bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="border p-4 text-center text-gray-500">
                  No vehicles found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-6">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded-md ${
              currentPage === 1 ? "bg-gray-300 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            Prev
          </button>

          {Array.from({ length: totalPages }, (_, index) => (
            <button
              key={index + 1}
              onClick={() => setCurrentPage(index + 1)}
              className={`px-3 py-2 rounded-md ${
                currentPage === index + 1
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-700"
              }`}
            >
              {index + 1}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className={`px-4 py-2 rounded-md ${
              currentPage === totalPages ? "bg-gray-300 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            Next
          </button>
        </div>
      )}

      {/* Vehicle Modal */}
      {selectedVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[32rem]">
            <h3 className="text-lg font-semibold mb-4">Vehicle Details</h3>
            <div className="space-y-2">
              <p><strong>Vehicle ID:</strong> {selectedVehicle.id}</p>
              <p><strong>Chassis No:</strong> {selectedVehicle.chassisNo}</p>
              <p><strong>Maker:</strong> {selectedVehicle.maker}</p>
              <p><strong>Year:</strong> {selectedVehicle.year}</p>
              <p><strong>Color:</strong> {selectedVehicle.color}</p>
              <p><strong>Sending Port:</strong> {selectedVehicle.sendingPort}</p>
              <p><strong>Total Amount:</strong> ${(selectedVehicle.totalAmount ? parseFloat(selectedVehicle.totalAmount) : 0).toFixed(2)}</p>
              <p><strong>Status:</strong> {selectedVehicle.status}</p>
              <p><strong>Invoice Number:</strong> {selectedVehicle.invoice.number}</p>
              <p><strong>Invoice Date:</strong> {new Date(selectedVehicle.invoice.date).toLocaleDateString()}</p>
              <p><strong>Invoice Status:</strong> {selectedVehicle.invoice.status}</p>
              {selectedVehicle.vehicleImages && selectedVehicle.vehicleImages.length > 0 && (
                <div className="mt-4">
                  <strong>Images:</strong>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    {selectedVehicle.vehicleImages.map((image, idx) => (
                      <div key={idx} className="bg-gray-100 p-2 rounded-lg">
                        <a href={image.imagePath} target="_blank" className="text-blue-500 hover:underline block truncate">
                          {image.imagePath}
                        </a>
                        <img
                          src={image.imagePath}
                          alt={`Vehicle Image ${idx + 1}`}
                          className="mt-2 w-full h-32 object-cover rounded-md"
                          onError={(e) => (e.target.src = "https://via.placeholder.com/150?text=Image+Not+Found")}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => setSelectedVehicle(null)}
              className="mt-6 bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehiclesList;