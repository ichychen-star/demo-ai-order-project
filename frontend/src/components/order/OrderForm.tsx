'use client';

import React from 'react';
import { Controller } from 'react-hook-form';
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { OrderStatus } from '@/types/order';
import { useOrderForm, type OrderFormValues } from '@/features/orders/useOrderForm';
import { formatNtd } from '@/utils/formatPrice';

const COLOR_OPTIONS = ['白', '黑', '藍', '棕', '灰', '紅', '銀'] as const;

interface OrderFormProps {
  defaultValues?: Partial<OrderFormValues>;
  initialOptionIds?: string[];
  onSubmit?: (values: OrderFormValues) => void | Promise<void>;
  actions?: React.ReactNode;
}

export default function OrderForm({
  defaultValues,
  initialOptionIds,
  onSubmit,
  actions,
}: OrderFormProps) {
  const {
    form,
    vehicles,
    vehiclesLoading,
    options,
    optionsLoading,
    selectedOptionIds,
    toggleOption,
    calculatedPrice,
  } = useOrderForm(defaultValues, initialOptionIds);

  const {
    register,
    handleSubmit,
    control,
    setValue,
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
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, '');
            setValue('customerPhone', digits, { shouldValidate: true, shouldDirty: true });
          }}
          inputProps={{ inputMode: 'numeric', maxLength: 10 }}
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
        <Controller
          name="exteriorColor"
          control={control}
          render={({ field }) => (
            <FormControl required error={!!errors.exteriorColor}>
              <InputLabel>外裝顏色</InputLabel>
              <Select {...field} label="外裝顏色">
                {COLOR_OPTIONS.map((color) => (
                  <MenuItem key={color} value={color}>{color}</MenuItem>
                ))}
              </Select>
              {errors.exteriorColor && (
                <FormHelperText>{errors.exteriorColor.message}</FormHelperText>
              )}
            </FormControl>
          )}
        />
        <Controller
          name="interiorColor"
          control={control}
          render={({ field }) => (
            <FormControl required error={!!errors.interiorColor}>
              <InputLabel>內裝顏色</InputLabel>
              <Select {...field} label="內裝顏色">
                {COLOR_OPTIONS.map((color) => (
                  <MenuItem key={color} value={color}>{color}</MenuItem>
                ))}
              </Select>
              {errors.interiorColor && (
                <FormHelperText>{errors.interiorColor.message}</FormHelperText>
              )}
            </FormControl>
          )}
        />
      </Box>

      {/* 選配加購 */}
      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
        選配加購
      </Typography>
      <Box sx={{ mb: 4 }}>
        {optionsLoading ? (
          <CircularProgress size={24} />
        ) : (
          <FormGroup row>
            {options.map((opt) => (
              <FormControlLabel
                key={opt.id}
                control={
                  <Checkbox
                    checked={selectedOptionIds.includes(opt.id)}
                    onChange={() => toggleOption(opt.id)}
                  />
                }
                label={`${opt.name}（+${formatNtd(opt.price)}）`}
                sx={{ width: { xs: '100%', sm: '50%' } }}
              />
            ))}
          </FormGroup>
        )}
      </Box>

      {/* 費用明細 */}
      {calculatedPrice && (
        <>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
            費用明細
          </Typography>
          <Box
            sx={{
              bgcolor: 'grey.50',
              border: '1px solid',
              borderColor: 'grey.200',
              borderRadius: 1,
              px: 3,
              py: 2,
              mb: 4,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">車款售價</Typography>
              <Typography variant="body2">{formatNtd(calculatedPrice.vehicleBasePrice)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">選配合計</Typography>
              <Typography variant="body2">{formatNtd(calculatedPrice.optionsTotalPrice)}</Typography>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body1" fontWeight="bold">總金額</Typography>
              <Typography variant="body1" fontWeight="bold" color="primary">
                {formatNtd(calculatedPrice.totalPrice)}
              </Typography>
            </Box>
          </Box>
        </>
      )}

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

      {actions && <Box sx={{ mt: 4 }}>{actions}</Box>}
    </Box>
  );
}
