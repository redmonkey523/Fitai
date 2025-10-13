/**
 * Weight management hooks
 * Handles weight logs, profile, calculations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '../../../storage/db';
import eventService from '../../../services/events';

export interface WeightLog {
  id: string;
  date: string;
  weight_kg: number;
  source: 'manual' | 'device' | 'import';
  note?: string;
}

export interface WeightSummary {
  currentWeight: number | null;
  delta30d: number | null;
  points7d: Array<{ date: string; weight_kg: number }>;
  hasRecentWeightLog: boolean;
  deviceWeightAvailable: boolean;
  unit: 'kg' | 'lb';
}

// Unit conversions
export const kgToLb = (kg: number) => kg * 2.20462;
export const lbToKg = (lb: number) => lb * 0.45359237;

export function convertWeight(weight: number, from: 'kg' | 'lb', to: 'kg' | 'lb'): number {
  if (from === to) return weight;
  if (from === 'kg' && to === 'lb') return kgToLb(weight);
  return lbToKg(weight);
}

// Hook: Get weight summary
export function useWeightSummary() {
  return useQuery({
    queryKey: ['weight-summary'],
    queryFn: async (): Promise<WeightSummary> => {
      try {
        // Get profile for unit preference
        const profileRows = await db.execute('SELECT weight_unit FROM profile WHERE id = ?', ['me']);
        const unit = profileRows?.[0]?.weight_unit || 'kg';

        // Get weight logs from last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

        const logs = await db.execute<WeightLog>(
          'SELECT * FROM weight_logs WHERE date >= ? ORDER BY date ASC',
          [thirtyDaysAgoStr]
        );

        const weightLogs = logs || [];

        // Current weight = most recent log
        const currentWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight_kg : null;

        // 30-day delta
        const delta30d = weightLogs.length >= 2
          ? weightLogs[weightLogs.length - 1].weight_kg - weightLogs[0].weight_kg
          : null;

        // 7-day points (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

        const points7d = weightLogs
          .filter((log) => log.date >= sevenDaysAgoStr)
          .map((log) => ({ date: log.date, weight_kg: log.weight_kg }));

        // Check if any recent logs from devices
        const deviceLogs = weightLogs.filter((log) => log.source === 'device');

        return {
          currentWeight,
          delta30d,
          points7d,
          hasRecentWeightLog: weightLogs.length > 0,
          deviceWeightAvailable: deviceLogs.length > 0,
          unit,
        };
      } catch (error) {
        console.error('[useWeightSummary] Error:', error);
        return {
          currentWeight: null,
          delta30d: null,
          points7d: [],
          hasRecentWeightLog: false,
          deviceWeightAvailable: false,
          unit: 'kg',
        };
      }
    },
    staleTime: 30000, // 30s
  });
}

// Hook: Add weight
export function useAddWeight() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { date: string; weight: number; unit: 'kg' | 'lb'; note?: string }) => {
      const id = `weight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Convert to kg for storage
      const weight_kg = input.unit === 'lb' ? lbToKg(input.weight) : input.weight;

      // Validate range: 25-400 kg (55-880 lb)
      if (weight_kg < 25 || weight_kg > 400) {
        throw new Error('Weight out of valid range (25-400 kg / 55-880 lb)');
      }

      // Insert into SQLite
      await db.execute(
        `INSERT INTO weight_logs (id, date, weight_kg, source, note)
         VALUES (?, ?, ?, ?, ?)`,
        [id, input.date, weight_kg, 'manual', input.note || null]
      );

      eventService.emit('weight_add', {
        source: 'manual',
        weight_kg,
        unitShown: input.unit,
      });

      return { id, weight_kg };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weight-summary'] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}

// Hook: Get profile
export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      try {
        const rows = await db.execute('SELECT * FROM profile WHERE id = ?', ['me']);
        return rows?.[0] || null;
      } catch (error) {
        console.error('[useProfile] Error:', error);
        return null;
      }
    },
  });
}

// Hook: Calculate BMI
export function calculateBMI(weight_kg: number, height_cm: number): number {
  const height_m = height_cm / 100;
  return weight_kg / (height_m * height_m);
}

