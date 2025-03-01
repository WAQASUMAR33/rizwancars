'use client';

import { toast, ToastContainer } from 'react-toastify';
import { useState, useEffect } from 'react';
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
} from '@heroicons/react/24/solid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Loader } from 'lucide-react';
import 'react-toastify/dist/ReactToastify.css';

// Fetch all bank accounts
const fetchBankAccounts = async () => {
  const response = await fetch('/api/admin/bank-account');
  if (!response.ok) {
    throw new Error('Failed to fetch bank accounts');
  }
  return response.json();
};

// Add a new bank account
const addBankAccount = async (account) => {
  const response = await fetch('/api/admin/bank-account', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(account),
  });
  if (!response.ok) {
    throw new Error('Failed to add bank account');
  }
  return response.json();
};

// Update an existing bank account
const updateBankAccount = async (account) => {
  const response = await fetch(`/api/admin/bank-account/${account.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(account),
  });
  if (!response.ok) {
    throw new Error('Failed to update bank account');
  }
  return response.json();
};

// Delete a bank account
const deleteBankAccount = async (id) => {
  const response = await fetch(`/api/admin/bank-account/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw new Error('Failed to delete bank account');
  }
  return true;
};

export default function BankAccountManagement() {
  const [accounts, setAccounts] = useState([]);
  const [filteredAccounts, setFilteredAccounts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentAccount, setCurrentAccount] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(null);

  useEffect(() => {
    fetchBankAccounts()
      .then(setAccounts)
      .catch((err) => toast.error(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    setFilteredAccounts(
      accounts.filter(
        (account) =>
          account.bank_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          account.account_title.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [accounts, searchTerm]);

  const handleAddAccount = () => {
    setCurrentAccount(null);
    setIsModalOpen(true);
  };

  const handleUpdateAccount = (account) => {
    setCurrentAccount(account);
    setIsModalOpen(true);
  };

  const handleDeleteAccount = async (id) => {
    if (window.confirm('Are you sure you want to delete this account?')) {
      setLoadingAction(id);
      try {
        await deleteBankAccount(id);
        const updatedAccounts = await fetchBankAccounts();
        setAccounts(updatedAccounts);
        toast.success('Account deleted successfully');
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
    const accountData = Object.fromEntries(formData.entries());

    setLoadingAction('form');
    try {
      if (currentAccount) {
        await updateBankAccount({ ...currentAccount, ...accountData });
        toast.success('Account updated successfully');
      } else {
        await addBankAccount(accountData);
        toast.success('Account added successfully');
      }
      const updatedAccounts = await fetchBankAccounts();
      setAccounts(updatedAccounts);
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div>
      <ToastContainer />
      <div className="p-6">
        <div className="mb-6 flex justify-between items-center">
          <Input
            type="text"
            placeholder="Search accounts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-auto"
          />
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAddAccount} className="bg-indigo-600">
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Account
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>{currentAccount ? 'Update Account' : 'Add Account'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {['bank_title', 'account_title', 'account_no'].map((field) => (
                    <div key={field}>
                      <label htmlFor={field} className="block text-sm font-medium">
                        {field.replace('_', ' ').toUpperCase()}
                      </label>
                      <Input
                        type="text"
                        name={field}
                        defaultValue={currentAccount?.[field]}
                      />
                    </div>
                  ))}
                </div>
                <Button type="submit" className="w-full" disabled={loadingAction === 'form'}>
                  {loadingAction === 'form' && <Loader className="mr-2 animate-spin" />}
                  {currentAccount ? 'Update' : 'Add'} Account
                </Button>
              </form>
            </DialogContent>
          </Dialog>
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
                  <TableHead>Bank Title</TableHead>
                  <TableHead>Account Title</TableHead>
                  <TableHead>Account No</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Updated At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccounts.map((account, index) => (
                  <TableRow key={account.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{account.bank_title}</TableCell>
                    <TableCell>{account.account_title}</TableCell>
                    <TableCell>{account.account_no}</TableCell>
                    <TableCell>{account.created_at}</TableCell>
                    <TableCell>{account.updated_at}</TableCell>
                    <TableCell>
                      <Button onClick={() => handleUpdateAccount(account)} variant="ghost">
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleDeleteAccount(account.id)}
                        variant="ghost"
                        className="text-red-600"
                        disabled={loadingAction === account.id}
                      >
                        {loadingAction === account.id ? (
                          <Loader className="h-4 w-4 animate-spin" />
                        ) : (
                          <TrashIcon className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
