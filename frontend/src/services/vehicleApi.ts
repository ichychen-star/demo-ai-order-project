import apiClient from './apiClient';
import type { Vehicle, VehicleOption } from '@/types/vehicle';

export const vehicleApi = {
  listVehicles: (): Promise<Vehicle[]> =>
    apiClient.get<Vehicle[]>('/api/vehicles').then((r) => r.data),

  listOptions: (): Promise<VehicleOption[]> =>
    apiClient.get<VehicleOption[]>('/api/options').then((r) => r.data),
};
