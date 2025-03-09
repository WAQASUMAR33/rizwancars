'use client';

import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import { Visibility as Eye } from '@mui/icons-material';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import html2canvas from 'html2canvas';

// Fetch Ledger Entries from API
const fetchLedgerEntries = async () => {
  const response = await fetch('/api/admin/ledger');
  if (!response.ok) {
    throw new Error('Failed to fetch ledger entries');
  }
  return response.json();
};

const LedgerManagement = () => {
  const [dialogMode, setDialogMode] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [date1, setDate1] = useState('');
  const [date2, setDate2] = useState('');

  useEffect(() => {
    fetchLedgerEntries()
      .then((entries) => {
        setLedgerEntries(entries);
        setFilteredEntries(entries);
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredEntries(ledgerEntries);
    } else {
      const filtered = ledgerEntries.filter((entry) =>
        (entry.Admin?.fullname?.toLowerCase().includes(query) ||
         entry.description?.toLowerCase().includes(query) ||
         entry.type?.toLowerCase().includes(query))
      );
      setFilteredEntries(filtered);
    }
  };

  useEffect(() => {
    console.log("Selected Entry", selectedEntry);
  }, [selectedEntry]);

  const printDialogContent = async () => {
    const printArea = document.getElementById('print-section');

    if (!printArea) {
      console.error('Print section not found');
      return;
    }

    try {
      const canvas = await html2canvas(printArea, { useCORS: true });
      const imageData = canvas.toDataURL('image/png');
      const printWindow = window.open('', '', 'width=800,height=600');

      if (printWindow) {
        printWindow.document.write('<html><head><title>Print</title></head><body style="margin:0; display:flex; justify-content:center; align-items:center;">');
        printWindow.document.write(`<img src="${imageData}" style="max-width:100%; max-height:100vh;" onload="window.print(); window.close();"/>`);
        printWindow.document.write('</body></html>');
        printWindow.document.close();

        setTimeout(() => {
          if (printWindow) {
            printWindow.print();
            printWindow.close();
          }
        }, 3000);
      }
    } catch (error) {
      console.error('Failed to capture screenshot for printing:', error);
    }
  };

  // Calculate total debit and credit
  const totalDebit = ledgerEntries.reduce((total, entry) => total + (entry.amount_in || 0), 0);
  const totalCredit = ledgerEntries.reduce((total, entry) => total + (entry.amount_out || 0), 0);

  const filterByDate = () => {
    if (!date1 || !date2) {
      toast.error('Please select both start and end dates.');
      return;
    }

    const start = new Date(date1);
    const end = new Date(date2);

    const filtered = ledgerEntries.filter((entry) => {
      const entryDate = new Date(entry.date);
      return entryDate >= start && entryDate <= end;
    });

    setFilteredEntries(filtered);

    if (filtered.length === 0) {
      toast.info('No entries found for the selected date range.');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <ToastContainer />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <TextField
          label="Search"
          variant="outlined"
          value={searchQuery}
          onChange={handleSearch}
          placeholder="Search by agent name, description, or type..."
          sx={{ width: 'auto', minWidth: 200 }}
        />
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            type="date"
            value={date1}
            onChange={(e) => setDate1(e.target.value)}
            variant="outlined"
            InputLabelProps={{ shrink: true }}
            label="Start Date"
          />
          <TextField
            type="date"
            value={date2}
            onChange={(e) => setDate2(e.target.value)}
            variant="outlined"
            InputLabelProps={{ shrink: true }}
            label="End Date"
          />
          <Button
            variant="contained"
            color="primary"
            onClick={filterByDate}
          >
            Filter
          </Button>
        </Box>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ maxHeight: '72vh', overflow: 'auto' }}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead sx={{ backgroundColor: '#1976d2' }}>
                <TableRow>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>No.</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Name</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Type</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Amount In</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Amount Out</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Balance</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Description</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Transaction Date</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredEntries.map((entry, index) => (
                  <TableRow key={entry.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{entry.Admin?.fullname || 'Unknown'}</TableCell>
                    <TableCell>{entry.role || 'N/A'}</TableCell>
                    <TableCell>{entry.debit || 0}</TableCell>
                    <TableCell>{entry.credit || 0}</TableCell>
                    <TableCell>{entry.balance || 0}</TableCell>
                    <TableCell>{entry.description || '-'}</TableCell>
                    <TableCell>{new Date(entry.updated_at).toLocaleString()}</TableCell>
                    <TableCell>
                      <Button
                        variant="text"
                        color="primary"
                        onClick={() => {
                          setSelectedEntry(entry);
                          setDialogMode(true);
                        }}
                      >
                        <Eye />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="h6">Total Debit: {totalDebit.toFixed(2)}</Typography>
            <Typography variant="h6">Total Credit: {totalCredit.toFixed(2)}</Typography>
          </Box>
        </Box>
      )}

      <Dialog open={dialogMode} onClose={() => setDialogMode(false)} maxWidth="lg" fullWidth>
        <DialogTitle>{selectedEntry?.type || 'Ledger Entry'}</DialogTitle>
        <DialogContent>
          <Box id="print-section" sx={{ width: '100%' }}>
            <TableContainer component={Paper}>
              <Table>
                <TableHead sx={{ backgroundColor: '#1976d2' }}>
                  <TableRow>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Name</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Type</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Amount In</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Amount Out</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Balance</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Description</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Transaction Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedEntry && (
                    <TableRow>
                      <TableCell>{selectedEntry.Admin?.fullname || 'Unknown'}</TableCell>
                      <TableCell>{selectedEntry.role || 'N/A'}</TableCell>
                      <TableCell>{selectedEntry.debit || 0}</TableCell>
                      <TableCell>{selectedEntry.credit || 0}</TableCell>
                      <TableCell>{selectedEntry.balance || 0}</TableCell>
                      <TableCell>{selectedEntry.description || '-'}</TableCell>
                      <TableCell>{new Date(selectedEntry.updated_at).toLocaleString()}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
          <Button
            variant="contained"
            color="primary"
            onClick={printDialogContent}
            sx={{ mt: 2, width: 120 }}
          >
            Print
          </Button>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default LedgerManagement;