'use client';

import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Pagination from '@mui/material/Pagination';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Typography from '@mui/material/Typography';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { type Order, OrderStatus } from '@/types/order';
import { formatNtd } from '@/utils/formatPrice';

type SortField = 'orderNo' | 'customerName' | 'totalPrice' | 'status' | 'expectedDeliveryMonth' | 'createdAt';

const STATUS_SX: Record<OrderStatus, { bgcolor: string; color: string }> = {
  [OrderStatus.DRAFT]:     { bgcolor: '#F3F4F6', color: '#4B5563' },
  [OrderStatus.CONFIRMED]: { bgcolor: '#DCFCE7', color: '#15803D' },
  [OrderStatus.CANCELLED]: { bgcolor: '#FEE2E2', color: '#DC2626' },
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

const ROWS_PER_PAGE = 10;

export default function OrderTable({ orders, onEdit, onDelete }: OrderTableProps) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('orderNo');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const handleDeleteClick  = (id: string) => setPendingDeleteId(id);
  const handleCancelDelete = () => setPendingDeleteId(null);
  const handleConfirmDelete = () => {
    if (pendingDeleteId != null) {
      onDelete(pendingDeleteId);
      setPendingDeleteId(null);
    }
  };

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
    setPage(1);
  };

  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      const aVal = a[sortField] ?? '';
      const bVal = b[sortField] ?? '';
      const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [orders, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sortedOrders.length / ROWS_PER_PAGE));
  const safePage   = Math.min(page, totalPages);
  const from       = sortedOrders.length === 0 ? 0 : (safePage - 1) * ROWS_PER_PAGE + 1;
  const to         = Math.min(safePage * ROWS_PER_PAGE, sortedOrders.length);
  const pageOrders = sortedOrders.slice((safePage - 1) * ROWS_PER_PAGE, safePage * ROWS_PER_PAGE);

  const cellSx = { py: 1 } as const;

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          overflow: 'hidden',
        }}
      >
        <TableContainer>
          <Table aria-label="order list">
            <TableHead>
              <TableRow>
                {(
                  [
                    { label: 'Order No.',      field: 'orderNo'               },
                    { label: 'Customer Name',  field: 'customerName'          },
                    { label: 'Vehicle Model',  field: null                    },
                    { label: 'Total Price',    field: 'totalPrice', align: 'right' },
                    { label: 'Status',         field: 'status'                },
                    { label: 'Delivery Month', field: 'expectedDeliveryMonth' },
                    { label: 'Created At',     field: 'createdAt'             },
                  ] as { label: string; field: SortField | null; align?: 'right' }[]
                ).map(({ label, field, align }) => (
                  <TableCell key={label} align={align}>
                    {field ? (
                      <TableSortLabel
                        active={sortField === field}
                        direction={sortField === field ? sortDir : 'desc'}
                        onClick={() => handleSort(field)}
                      >
                        {label}
                      </TableSortLabel>
                    ) : label}
                  </TableCell>
                ))}
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {pageOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 8, color: 'text.secondary' }}>
                    No orders found.
                  </TableCell>
                </TableRow>
              )}

              {pageOrders.map((order) => (
                <TableRow key={order.id} hover>
                  <TableCell sx={cellSx}>
                    <Box
                      component="span"
                      onClick={() => onEdit(order.id)}
                      sx={{
                        color: 'primary.main',
                        cursor: 'pointer',
                        fontFamily: 'monospace',
                        fontSize: '0.8rem',
                        '&:hover': { textDecoration: 'underline' },
                      }}
                    >
                      {order.orderNo}
                    </Box>
                  </TableCell>
                  <TableCell sx={cellSx}>{order.customerName}</TableCell>
                  <TableCell sx={cellSx}>{order.vehicleName ?? '—'}</TableCell>
                  <TableCell align="right" sx={cellSx}>{formatNtd(order.totalPrice)}</TableCell>
                  <TableCell sx={cellSx}>
                    <Chip
                      label={STATUS_LABEL[order.status]}
                      size="small"
                      sx={{ fontWeight: 600, fontSize: '0.75rem', ...STATUS_SX[order.status] }}
                    />
                  </TableCell>
                  <TableCell sx={cellSx}>{order.expectedDeliveryMonth}</TableCell>
                  <TableCell sx={cellSx}>
                    {new Date(order.createdAt).toLocaleDateString('zh-TW')}
                  </TableCell>
                  <TableCell align="center" sx={{ ...cellSx, whiteSpace: 'nowrap' }}>
                    <IconButton
                      size="small"
                      aria-label="edit order"
                      onClick={() => onEdit(order.id)}
                      sx={{ mx: 0.5 }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      aria-label="delete order"
                      color="error"
                      onClick={() => handleDeleteClick(order.id)}
                      sx={{ mx: 0.5 }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Footer */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            px: 2,
            py: 1.5,
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Showing {from} to {to} of {orders.length} orders
          </Typography>
          {totalPages > 1 && (
            <Pagination
              count={totalPages}
              page={safePage}
              onChange={(_, p) => setPage(p)}
              size="small"
              color="primary"
              shape="rounded"
            />
          )}
        </Box>
      </Paper>

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
