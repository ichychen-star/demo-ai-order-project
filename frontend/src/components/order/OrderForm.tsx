'use client';

import { Controller } from 'react-hook-form';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { OrderStatus } from '@/types/order';
import { useOrderForm, type OrderFormValues } from '@/features/orders/useOrderForm';

interface OrderFormProps {
  defaultValues?: Partial<OrderFormValues>;
  onSubmit?: (values: OrderFormValues) => void | Promise<void>;
}

export default function OrderForm({ defaultValues, onSubmit }: OrderFormProps) {
  const { form, vehicles, vehiclesLoading } = useOrderForm(defaultValues);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = form;

  return (
    <Box
      component="form"
      noValidate
      onSubmit={handleSubmit((values) => onSubmit?.(values))}
    >
      {/* 客戶資訊 */}
      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
        客戶資訊
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          gap: 2,
          mb: 4,
        }}
      >
        <TextField
          {...register('customerName')}
          label="客戶名稱"
          required
          error={!!errors.customerName}
          helperText={errors.customerName?.message}
        />
        <TextField
          {...register('customerPhone')}
          label="客戶電話"
          required
          error={!!errors.customerPhone}
          helperText={errors.customerPhone?.message}
        />
        <TextField
          {...register('customerEmail')}
          label="客戶電子郵件"
          type="email"
          error={!!errors.customerEmail}
          helperText={errors.customerEmail?.message}
          sx={{ gridColumn: { sm: 'span 2' } }}
        />
      </Box>

      {/* 車款與顏色 */}
      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
        車款與顏色
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          gap: 2,
          mb: 4,
        }}
      >
        <Controller
          name="vehicleId"
          control={control}
          render={({ field }) => (
            <FormControl required error={!!errors.vehicleId} sx={{ gridColumn: { sm: 'span 2' } }}>
              <InputLabel>車款</InputLabel>
              <Select
                {...field}
                label="車款"
                disabled={vehiclesLoading}
                startAdornment={
                  vehiclesLoading ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null
                }
              >
                {vehicles.map((v) => (
                  <MenuItem key={v.id} value={v.id}>
                    {v.brand} {v.model}
                  </MenuItem>
                ))}
              </Select>
              {errors.vehicleId && (
                <FormHelperText>{errors.vehicleId.message}</FormHelperText>
              )}
            </FormControl>
          )}
        />
        <TextField
          {...register('exteriorColor')}
          label="外裝顏色"
          required
          error={!!errors.exteriorColor}
          helperText={errors.exteriorColor?.message}
        />
        <TextField
          {...register('interiorColor')}
          label="內裝顏色"
          required
          error={!!errors.interiorColor}
          helperText={errors.interiorColor?.message}
        />
      </Box>

      {/* 交車與狀態 */}
      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
        交車與狀態
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          gap: 2,
        }}
      >
        <TextField
          {...register('expectedDeliveryMonth')}
          label="預計交車月份"
          type="month"
          required
          InputLabelProps={{ shrink: true }}
          error={!!errors.expectedDeliveryMonth}
          helperText={errors.expectedDeliveryMonth?.message}
        />
        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <FormControl>
              <InputLabel>狀態</InputLabel>
              <Select {...field} label="狀態">
                <MenuItem value={OrderStatus.DRAFT}>Draft</MenuItem>
                <MenuItem value={OrderStatus.CONFIRMED}>Confirmed</MenuItem>
                <MenuItem value={OrderStatus.CANCELLED}>Cancelled</MenuItem>
              </Select>
            </FormControl>
          )}
        />
      </Box>
    </Box>
  );
}
