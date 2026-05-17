'use client';

import { useState } from 'react';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { type Order, OrderStatus } from '@/types/order';
import { formatNtd } from '@/utils/formatPrice';

const STATUS_COLOR: Record<OrderStatus, 'default' | 'success' | 'error'> = {
  [OrderStatus.DRAFT]:     'default',
  [OrderStatus.CONFIRMED]: 'success',
  [OrderStatus.CANCELLED]: 'error',
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  [OrderStatus.DRAFT]:     'Draft',
  [OrderStatus.CONFIRMED]: 'Confirmed',
  [OrderStatus.CANCELLED]: 'Cancelled',
};

interface OrderTableProps {
  orders: Order[];
  onEdit:   (id: string) => void;
  onDelete: (id: string) => void;
}

export default function OrderTable({ orders, onEdit, onDelete }: OrderTableProps) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const handleDeleteClick  = (id: string) => setPendingDeleteId(id);
  const handleCancelDelete = () => setPendingDeleteId(null);
  const handleConfirmDelete = () => {
    if (pendingDeleteId != null) {
      onDelete(pendingDeleteId);
      setPendingDeleteId(null);
    }
  };

  return (
    <>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small" aria-label="order list">
          <TableHead>
            <TableRow>
              <TableCell>Order No</TableCell>
              <TableCell>Customer Name</TableCell>
              <TableCell>Vehicle Model</TableCell>
              <TableCell align="right">Total Price</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Delivery Month</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {orders.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  No orders found.
                </TableCell>
              </TableRow>
            )}

            {orders.map((order) => (
              <TableRow key={order.id} hover>
                <TableCell sx={{ fontFamily: 'monospace' }}>{order.orderNo}</TableCell>
                <TableCell>{order.customerName}</TableCell>
                <TableCell>{order.vehicleName ?? '—'}</TableCell>
                <TableCell align="right">{formatNtd(order.totalPrice)}</TableCell>
                <TableCell>
                  <Chip
                    label={STATUS_LABEL[order.status]}
                    color={STATUS_COLOR[order.status]}
                    size="small"
                  />
                </TableCell>
                <TableCell>{order.expectedDeliveryMonth}</TableCell>
                <TableCell>
                  {new Date(order.createdAt).toLocaleDateString('zh-TW')}
                </TableCell>
                <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                  <IconButton
                    size="small"
                    aria-label="edit order"
                    onClick={() => onEdit(order.id)}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    aria-label="delete order"
                    color="error"
                    onClick={() => handleDeleteClick(order.id)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={pendingDeleteId != null} onClose={handleCancelDelete}>
        <DialogTitle>Delete Order</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This action cannot be undone. Are you sure you want to delete this order?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
