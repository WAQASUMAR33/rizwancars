'use client';

import { toast, ToastContainer } from 'react-toastify';
import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PencilIcon, TrashIcon, PlusIcon, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader } from 'lucide-react';
import 'react-toastify/dist/ReactToastify.css';
import { useSelector } from 'react-redux';

const fetchPaymentRequests = async () => {
  const response = await fetch('/api/admin/payment-requests'); // Updated to match your GET API endpoint
  if (!response.ok) {
    throw new Error('Failed to fetch payment requests');
  }
  return response.json();
};

export default function PaymentRequestManagement() {
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [filteredPaymentRequests, setFilteredPaymentRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [paymentImage, setPaymentImage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [date1, setDate1] = useState('');
  const [date2, setDate2] = useState('');
  const [dialogMode, setDialogMode] = useState(null); // 'view', 'add', 'edit'
  const [formData, setFormData] = useState({
    admin_id: '', // Changed from userid to admin_id
    transactionno: '',
    amount: '',
    img_url: '',
    status: 'Pending',
    verified_by: '',
  });
  const username = useSelector((state) => state.user.username);

  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim() === '') {
      setFilteredPaymentRequests(paymentRequests);
      return;
    }
    console.log("The query is : ", query);

    const filtered = paymentRequests.filter((req) =>
      req.transactionno?.toLowerCase().includes(query.toLowerCase()) ||
      req.Admin?.fullname?.toLowerCase().includes(query.toLowerCase()) || // Changed from Users.name to Admin.fullname
      req.status.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredPaymentRequests(filtered);
  };

  useEffect(() => {
    fetchPaymentRequests()
      .then((data) => {
        setPaymentRequests(data);
        setFilteredPaymentRequests(data); // Set filtered data initially
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleImageChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target.result;
        setPaymentImage(imageData);
        setFormData((prev) => ({ ...prev, img_url: imageData }));
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleApprove = async () => {
    setLoadingAction('approve');
    try {
      const payload = {
        ...selectedRequest,
        status: 'Approved',
        verified_by: username,
      };

      const response = await fetch(`/api/admin/payment-requests/approve/${selectedRequest.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(result.message || 'Payment request approved successfully!');
        setDialogMode(null);

        // Optimistically update the payment request status in the state
        setPaymentRequests((prev) =>
          prev.map((req) =>
            req.id === selectedRequest.id ? { ...req, status: 'Approved', verified_by: username } : req
          )
        );
        setLoadingAction('');
      } else {
        toast.error(result.message || 'Failed to approve payment request.');
        setLoadingAction('');
      }
    } catch (err) {
      toast.error(`Error: ${err.message}`);
      setLoadingAction('');
    }
  };

  const handleReject = async () => {
    setLoadingAction('reject');
    try {
      const payload = { ...selectedRequest, status: 'Rejected', verified_by: username };
      const response = await fetch(
        `/api/admin/payment-requests/reject/${selectedRequest.id}`, // Updated endpoint
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) throw new Error('Failed to reject payment request.');

      toast.success('Payment request rejected successfully!');
      setDialogMode(null);

      // Optimistically update the payment request status in the state
      setPaymentRequests((prev) =>
        prev.map((req) =>
          req.id === selectedRequest.id ? { ...req, status: 'Rejected', verified_by: username } : req
        )
      );
      setLoadingAction('');
    } catch (err) {
      toast.error(err.message);
      setLoadingAction('');
    }
  };

  const handleAction = async () => {
    try {
      const payload = { ...formData, verified_by: username };
      const response = await fetch(
        `/api/admin/payment-requests${dialogMode === 'edit' ? `/${formData.id}` : ''}`, // Updated endpoint
        {
          method: dialogMode === 'add' ? 'POST' : 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      if (!response.ok) throw new Error('Failed to submit payment request');

      toast.success(
        `Payment request ${dialogMode === 'add' ? 'added' : 'updated'} successfully!`
      );
      setDialogMode(null);
      setFormData({ admin_id: '', transactionno: '', amount: '', img_url: '', status: 'Pending' });

      // Optimistically update the payment request in the state
      if (dialogMode === 'edit') {
        setPaymentRequests((prev) =>
          prev.map((req) =>
            req.id === formData.id ? { ...req, ...formData } : req
          )
        );
      } else {
        setPaymentRequests((prev) => [payload, ...prev]);
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`/api/admin/payment-requests/${id}`, { // Updated endpoint
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete payment request');

      toast.success('Payment request deleted successfully!');

      // Optimistically remove the payment request from the state
      setPaymentRequests((prev) => prev.filter((req) => req.id !== id));
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDownloadImage = (req) => {
    const imageUrl = `${process.env.NEXT_PUBLIC_IMAGE_UPLOAD_PATH}/${req.img_url}`;
    const filename = `${req.transactionno}.jpg`;
    const apiUrl = `/api/download-image?imageUrl=${encodeURIComponent(imageUrl)}&filename=${encodeURIComponent(filename)}`;
    window.location.href = apiUrl;
  };

  const filterByDate = () => {
    if (!date1 || !date2) {
      toast.error('Please select both start and end dates.');
      return;
    }

    const start = new Date(date1);
    const end = new Date(date2);

    const filtered = paymentRequests.filter((entry) => {
      const entryDate = new Date(entry.created_at);
      return entryDate >= start && entryDate <= end;
    });

    setFilteredPaymentRequests(filtered);

    if (filtered.length === 0) {
      toast.info('No entries found for the selected date range.');
    }
  };

  return (
    <div>
      <ToastContainer />
      <div className="p-6">
        <div className="mb-6 flex justify-between items-center">
          <Input
            type="text"
            placeholder="Search payment requests..."
            value={searchQuery}
            onChange={(e) => handleSearch(e)}
            className="pl-10 w-auto"
          />
          <div className="flex space-x-4 justify-end items-center mr-4">
            <input
              type="date"
              value={date1}
              onChange={(e) => setDate1(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2"
            />
            <input
              type="date"
              value={date2}
              onChange={(e) => setDate2(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2"
            />
            <button
              onClick={filterByDate}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              Filter
            </button>
          </div>
        </div>
        {isLoading ? (
          <div className="flex justify-center">
            <Loader className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="overflow-auto max-h-[72vh]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No.</TableHead>
                  <TableHead>Admin ID</TableHead> {/* Changed from UserId */}
                  <TableHead>Admin</TableHead> {/* Changed from User */}
                  <TableHead>Image</TableHead>
                  <TableHead>Transaction No</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPaymentRequests.map((req, index) => (
                  <TableRow key={req.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{req.admin_id}</TableCell> {/* Changed from userid */}
                    <TableCell>{req.Admin?.fullname || 'Unknown'}</TableCell> {/* Changed from Users.name */}
                    <TableCell>
                      {req.img_url ? (
                        <img
                          src={`${process.env.NEXT_PUBLIC_IMAGE_UPLOAD_PATH}/${req.img_url}`}
                          className="w-12 h-12"
                          alt="Payment"
                        />
                      ) : (
                        <img
                          src="/logo/logo1.jpg"
                          className="w-24 h-24"
                          alt="Default"
                        />
                      )}
                    </TableCell>
                    <TableCell>{req.transactionno}</TableCell>
                    <TableCell>{req.amount}</TableCell>
                    <TableCell>{req.status}</TableCell>
                    <TableCell className="flex space-x-2">
                      <Button
                        onClick={() => {
                          setSelectedRequest(req);
                          setDialogMode('view');
                        }}
                        variant="ghost"
                        className="text-indigo-600"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {/* <Button
                        onClick={() => handleDelete(req.id)}
                        variant="ghost"
                        className="text-red-600"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button> */}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={!!dialogMode} onOpenChange={() => setDialogMode(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'view' && 'Payment Request Details'}
              {dialogMode === 'add' && 'Add Payment Request'}
              {dialogMode === 'edit' && 'Edit Payment Request'}
            </DialogTitle>
          </DialogHeader>
          {dialogMode === 'view' && selectedRequest && (
            <>
              <div className='flex w-full'>
                <div className="w-1/2 space-y-4">
                  <div>
                    <strong>Admin ID:</strong> {selectedRequest.admin_id} {/* Changed from UserId */}
                  </div>
                  <div>
                    <strong>Transaction No:</strong> {selectedRequest.transactionno}
                  </div>
                  <div>
                    <strong>Amount:</strong> {selectedRequest.amount}
                  </div>
                  <div>
                    <strong>Status:</strong> {selectedRequest.status}
                  </div>
                </div>
                <div className='w-1/2'>
                  <img
                    src={`${process.env.NEXT_PUBLIC_IMAGE_UPLOAD_PATH}/${selectedRequest.img_url}`}
                    alt="Payment"
                    className="w-full h-80 object-contain"
                  />
                </div>
              </div>
              <div className="mt-4 flex w-full">
                {selectedRequest.status !== 'Approved' && (
                  <div className='flex justify-between w-full'>
                    <div className='space-x-4'>
                      <Button onClick={handleApprove}>
                        {loadingAction === 'approve' ? <Loader className='animate-spin' /> : 'Approve'}
                      </Button>
                      <Button onClick={handleReject} className="bg-red-600">
                        {loadingAction === 'reject' ? <Loader className='animate-spin' /> : 'Reject'}
                      </Button>
                    </div>
                    <div>
                      <Button
                        onClick={() => handleDownloadImage(selectedRequest)}
                        className="text-green-600 bg-white hover:bg-gray-100 border-green-600 border"
                      >
                        Download Image
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
          {dialogMode === 'add' || dialogMode === 'edit' ? (
            <div className="space-y-4">
              <Input
                label="Admin ID" // Changed from UserId
                name="admin_id" // Changed from userid
                value={formData.admin_id}
                onChange={handleInputChange}
              />
              <Input
                label="Transaction No"
                name="transactionno"
                value={formData.transactionno}
                onChange={handleInputChange}
              />
              <Input
                label="Amount"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
              />
              <div>
                <input
                  type="file"
                  accept="image/*"
                  name="img_url"
                  onChange={handleImageChange}
                  className="mt-2"
                />
              </div>
              <div className="mt-4">
                <Button onClick={handleAction} className="w-full bg-green-600">
                  {dialogMode === 'edit' ? 'Update' : 'Add'}
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}