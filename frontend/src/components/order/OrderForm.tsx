'use client';

import React from 'react';
import { Controller } from 'react-hook-form';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import CardGiftcardOutlinedIcon from '@mui/icons-material/CardGiftcardOutlined';
import DirectionsCarOutlinedIcon from '@mui/icons-material/DirectionsCarOutlined';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { OrderStatus } from '@/types/order';
import { useOrderForm, type OrderFormValues } from '@/features/orders/useOrderForm';
import { formatNtd } from '@/utils/formatPrice';
import { getHighlightSx } from '@/utils/highlightAiFields';

const COLOR_OPTIONS = ['白', '黑', '藍', '棕', '灰', '紅', '銀'] as const;

interface SectionHeaderProps {
  icon: React.ReactNode;
  label: string;
  iconColor?: string;
}

function SectionHeader({ icon, label, iconColor = 'primary.main' }: SectionHeaderProps) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 2 }}>
      <Box sx={{ color: iconColor, display: 'flex' }}>{icon}</Box>
      <Typography variant="subtitle1" fontWeight={800}>{label}</Typography>
    </Box>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
        minHeight: '100%',
        borderColor: 'rgba(12, 31, 59, 0.10)',
        boxShadow: '0 10px 28px rgba(15, 23, 42, 0.06)',
      }}
    >
      {children}
    </Paper>
  );
}

interface OrderFormProps {
  defaultValues?: Partial<OrderFormValues>;
  initialOptionIds?: string[];
  onSubmit?: (values: OrderFormValues) => void | Promise<void>;
  actions?: React.ReactNode;
  leftFooter?: React.ReactNode | ((context: { vehicleName: string | null }) => React.ReactNode);
}

export default function OrderForm({
  defaultValues,
  initialOptionIds,
  onSubmit,
  actions,
  leftFooter,
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
    aiHighlightedFields,
  } = useOrderForm(defaultValues, initialOptionIds);
  const selectedVehicleId = form.watch('vehicleId');
  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);
  const vehicleName = selectedVehicle ? `${selectedVehicle.brand} ${selectedVehicle.model}` : null;

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
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
          gap: 1.5,
          alignItems: 'stretch',
        }}
      >
        <SectionCard>
          <SectionHeader icon={<PersonOutlinedIcon />} label="客戶資訊" />
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 2,
            }}
          >
            <TextField
              {...register('customerName')}
              label="客戶名稱"
              placeholder="請輸入客戶名稱"
              InputLabelProps={{ shrink: true }}
              required
              error={!!errors.customerName}
              helperText={errors.customerName?.message}
              sx={getHighlightSx('customerName', aiHighlightedFields)}
            />
            <TextField
              {...register('customerPhone')}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '');
                setValue('customerPhone', digits, { shouldValidate: true, shouldDirty: true });
              }}
              inputProps={{ inputMode: 'numeric', maxLength: 10 }}
              label="客戶電話"
              placeholder="請輸入客戶電話"
              InputLabelProps={{ shrink: true }}
              required
              error={!!errors.customerPhone}
              helperText={errors.customerPhone?.message}
              sx={getHighlightSx('customerPhone', aiHighlightedFields)}
            />
            <TextField
              {...register('customerEmail')}
              label="客戶電子郵件"
              placeholder="請輸入客戶電子郵件"
              type="email"
              InputLabelProps={{ shrink: true }}
              error={!!errors.customerEmail}
              helperText={errors.customerEmail?.message}
              sx={{ gridColumn: { sm: 'span 2' }, ...getHighlightSx('customerEmail', aiHighlightedFields) }}
            />
          </Box>
        </SectionCard>

        <SectionCard>
          <SectionHeader icon={<DirectionsCarOutlinedIcon />} label="車款與顏色" />
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' },
              gap: 2,
            }}
          >
            <Controller
              name="vehicleId"
              control={control}
              render={({ field }) => (
                <FormControl required error={!!errors.vehicleId} sx={getHighlightSx('vehicleId', aiHighlightedFields)}>
                  <InputLabel>車款</InputLabel>
                  <Select {...field} label="車款" disabled={vehiclesLoading}>
                    <MenuItem value="" disabled>
                      {vehiclesLoading ? '載入中...' : '請選擇車款'}
                    </MenuItem>
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
                <FormControl required error={!!errors.exteriorColor} sx={getHighlightSx('exteriorColor', aiHighlightedFields)}>
                  <InputLabel>外裝顏色</InputLabel>
                  <Select {...field} label="外裝顏色">
                    <MenuItem value="" disabled>請選擇外裝顏色</MenuItem>
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
                <FormControl required error={!!errors.interiorColor} sx={getHighlightSx('interiorColor', aiHighlightedFields)}>
                  <InputLabel>內裝顏色</InputLabel>
                  <Select {...field} label="內裝顏色">
                    <MenuItem value="" disabled>請選擇內裝顏色</MenuItem>
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
        </SectionCard>

        <SectionCard>
          <SectionHeader icon={<CardGiftcardOutlinedIcon />} label="選配加購" iconColor="secondary.main" />
          {optionsLoading ? (
            <CircularProgress size={24} />
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 0.25 }}>
              {options.map((opt) => (
                <FormControlLabel
                  key={opt.id}
                  control={
                    <Checkbox
                      checked={selectedOptionIds.includes(opt.id)}
                      onChange={() => toggleOption(opt.id)}
                      sx={{ py: 0.5 }}
                    />
                  }
                  label={`${opt.name}  (+${formatNtd(opt.price)})`}
                  sx={{ mr: 0, '& .MuiFormControlLabel-label': { fontSize: '0.95rem' } }}
                />
              ))}
            </Box>
          )}
        </SectionCard>

        <SectionCard>
          <SectionHeader icon={<CalendarMonthOutlinedIcon />} label="交車與狀態" iconColor="success.main" />
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1.25fr' },
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
              sx={getHighlightSx('expectedDeliveryMonth', aiHighlightedFields)}
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
        </SectionCard>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '2fr 1.05fr' },
          gap: 1.5,
          mt: 1.5,
          alignItems: 'stretch',
        }}
      >
        {typeof leftFooter === 'function' ? leftFooter({ vehicleName }) : leftFooter}
        <Paper
          variant="outlined"
          sx={{
            p: 2.5,
            bgcolor: 'rgba(34, 197, 94, 0.08)',
            borderColor: 'rgba(34, 197, 94, 0.16)',
            boxShadow: '0 10px 28px rgba(15, 23, 42, 0.06)',
          }}
        >
          <SectionHeader icon={<ArticleOutlinedIcon />} label="費用明細" iconColor="success.main" />
          <Paper variant="outlined" sx={{ overflow: 'hidden', bgcolor: 'background.paper' }}>
            <Box sx={{ px: 2.5, py: 1.5, display: 'grid', gap: 1.25 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                <Typography variant="body2">車款售價</Typography>
                <Typography variant="body2">{calculatedPrice ? formatNtd(calculatedPrice.vehicleBasePrice) : '—'}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                <Typography variant="body2">選配合計</Typography>
                <Typography variant="body2">{calculatedPrice ? formatNtd(calculatedPrice.optionsTotalPrice) : '—'}</Typography>
              </Box>
            </Box>
            <Divider />
            <Box sx={{ px: 2.5, py: 1.5, display: 'flex', justifyContent: 'space-between', gap: 2 }}>
              <Typography variant="subtitle1" fontWeight={800}>總金額</Typography>
              <Typography variant="h6" fontWeight={900} color="success.main">
                {calculatedPrice ? formatNtd(calculatedPrice.totalPrice) : '—'}
              </Typography>
            </Box>
          </Paper>
        </Paper>
      </Box>

      {actions && <Box sx={{ mt: 2 }}>{actions}</Box>}
    </Box>
  );
}
