import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { COLORS } from '../constants/theme';
import { fetchProgressData, fetchProgressPhotos } from '../store/slices/progressSlice';
import Card from './Card';
import StatCard from './StatCard';
import ProgressBar from './ProgressBar';

const { width } = Dimensions.get('window');

const ProgressDashboard = () => {
  const dispatch = useDispatch();
  const { progressData, progressPhotos, loading, error } = useSelector(state => state.progress);
  const { user } = useSelector(state => state.auth);

  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('weight');

  const timeframes = [
    { key: '7d', label: '7 Days' },
    { key: '30d', label: '30 Days' },
    { key: '90d', label: '90 Days' },
    { key: '1y', label: '1 Year' }
  ];

  const metrics = [
    { key: 'weight', label: 'Weight', icon: 'scale' },
    { key: 'bodyFat', label: 'Body Fat', icon: 'body' },
    { key: 'muscleMass', label: 'Muscle Mass', icon: 'fitness' },
    { key: 'measurements', label: 'Measurements', icon: 'resize' }
  ];

  useEffect(() => {
    if (user) {
      dispatch(fetchProgressData({ userId: user.id, timeframe: selectedTimeframe }));
      dispatch(fetchProgressPhotos({ userId: user.id }));
    }
  }, [dispatch, user, selectedTimeframe]);

  const getProgressPercentage = (current, target) => {
    if (!current || !target) return 0;
    const percentage = ((current - target) / target) * 100;
    return Math.min(Math.max(percentage, 0), 100);
  };

  const getProgressTrend = (data) => {
    if (!data || data.length < 2) return 'stable';
    const first = data[0];
    const last = data[data.length - 1];
    return last > first ? 'increasing' : last < first ? 'decreasing' : 'stable';
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'increasing': return 'trending-up';
      case 'decreasing': return 'trending-down';
      default: return 'remove';
    }
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'increasing': return COLORS.success;
      case 'decreasing': return COLORS.error;
      default: return COLORS.text.secondary;
    }
  };

  const formatChartData = (data, metric) => {
    if (!data || data.length === 0) return [];
    
    return data.map((entry, index) => ({
      x: index,
      y: entry[metric] || 0,
      label: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }));
  };

  const renderWeightChart = () => {
    const chartData = formatChartData(progressData?.weightData, 'weight');
    
    if (chartData.length === 0) {
      return (
        <View style={styles.noDataContainer}>
          <Ionicons name="analytics" size={48} color={COLORS.text.secondary} />
          <Text style={styles.noDataText}>No weight data available</Text>
        </View>
      );
    }

    return (
      <LineChart
        data={{
          labels: chartData.map(d => d.label),
          datasets: [{
            data: chartData.map(d => d.y)
          }]
        }}
        width={width - 32}
        height={220}
        chartConfig={{
          backgroundColor: COLORS.background.primary,
          backgroundGradientFrom: COLORS.background.primary,
          backgroundGradientTo: COLORS.background.primary,
          decimalPlaces: 1,
          color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          style: {
            borderRadius: 16
          },
          propsForDots: {
            r: "6",
            strokeWidth: "2",
            stroke: COLORS.accent.primary
          }
        }}
        bezier
        style={styles.chart}
      />
    );
  };

  const renderBodyCompositionChart = () => {
    const currentData = progressData?.currentMetrics;
    if (!currentData) return null;

    const chartData = [
      {
        name: 'Body Fat',
        population: currentData.bodyFat || 0,
        color: COLORS.error,
        legendFontColor: COLORS.text.primary,
      },
      {
        name: 'Muscle Mass',
        population: currentData.muscleMass || 0,
        color: COLORS.success,
        legendFontColor: COLORS.text.primary,
      },
      {
        name: 'Other',
        population: 100 - (currentData.bodyFat || 0) - (currentData.muscleMass || 0),
        color: COLORS.text.secondary,
        legendFontColor: COLORS.text.primary,
      }
    ];

    return (
      <PieChart
        data={chartData}
        width={width - 32}
        height={220}
        chartConfig={{
          color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
        }}
        accessor="population"
        backgroundColor="transparent"
        paddingLeft="15"
        style={styles.chart}
      />
    );
  };

  const renderMeasurementsChart = () => {
    const measurements = progressData?.measurements;
    if (!measurements) return null;

    const chartData = {
      labels: ['Chest', 'Arms', 'Waist', 'Hips', 'Thighs'],
      datasets: [{
        data: [
          measurements.chest || 0,
          measurements.arms || 0,
          measurements.waist || 0,
          measurements.hips || 0,
          measurements.thighs || 0
        ]
      }]
    };

    return (
      <BarChart
        data={chartData}
        width={width - 32}
        height={220}
        chartConfig={{
          backgroundColor: COLORS.background.primary,
          backgroundGradientFrom: COLORS.background.primary,
          backgroundGradientTo: COLORS.background.primary,
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          style: {
            borderRadius: 16
          }
        }}
        style={styles.chart}
      />
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading progress data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Timeframe Selector */}
      <Card style={styles.timeframeCard}>
        <Text style={styles.sectionTitle}>Time Period</Text>
        <View style={styles.timeframeContainer}>
          {timeframes.map(timeframe => (
            <TouchableOpacity
              key={timeframe.key}
              style={[
                styles.timeframeButton,
                selectedTimeframe === timeframe.key && styles.selectedTimeframeButton
              ]}
              onPress={() => setSelectedTimeframe(timeframe.key)}
            >
              <Text style={[
                styles.timeframeButtonText,
                selectedTimeframe === timeframe.key && styles.selectedTimeframeButtonText
              ]}>
                {timeframe.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      {/* Progress Summary */}
      <View style={styles.statsContainer}>
        <StatCard
          title="Current Weight"
          value={`${progressData?.currentMetrics?.weight || 0} kg`}
          icon="scale"
          trend={getProgressTrend(progressData?.weightData?.map(d => d.weight))}
        />
        <StatCard
          title="Body Fat"
          value={`${progressData?.currentMetrics?.bodyFat || 0}%`}
          icon="body"
          trend={getProgressTrend(progressData?.bodyFatData?.map(d => d.bodyFat))}
        />
        <StatCard
          title="Muscle Mass"
          value={`${progressData?.currentMetrics?.muscleMass || 0} kg`}
          icon="fitness"
          trend={getProgressTrend(progressData?.muscleMassData?.map(d => d.muscleMass))}
        />
      </View>

      {/* Goal Progress */}
      {user?.fitnessGoals && (
        <Card style={styles.goalsCard}>
          <Text style={styles.sectionTitle}>Goal Progress</Text>
          
          {user.fitnessGoals.map((goal, index) => (
            <View key={index} style={styles.goalItem}>
              <View style={styles.goalHeader}>
                <Text style={styles.goalTitle}>{goal.type}</Text>
                <Text style={styles.goalValue}>
                  {progressData?.currentMetrics?.[goal.metric] || 0} / {goal.target}
                </Text>
              </View>
              <ProgressBar
                progress={getProgressPercentage(
                  progressData?.currentMetrics?.[goal.metric],
                  goal.target
                )}
                color={COLORS.accent.primary}
                style={styles.goalProgress}
              />
            </View>
          ))}
        </Card>
      )}

      {/* Metric Selector */}
      <Card style={styles.metricCard}>
        <Text style={styles.sectionTitle}>Metrics</Text>
        <View style={styles.metricContainer}>
          {metrics.map(metric => (
            <TouchableOpacity
              key={metric.key}
              style={[
                styles.metricButton,
                selectedMetric === metric.key && styles.selectedMetricButton
              ]}
              onPress={() => setSelectedMetric(metric.key)}
            >
              <Ionicons 
                name={metric.icon} 
                size={20} 
                color={selectedMetric === metric.key ? COLORS.white : COLORS.text.primary} 
              />
              <Text style={[
                styles.metricButtonText,
                selectedMetric === metric.key && styles.selectedMetricButtonText
              ]}>
                {metric.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      {/* Charts */}
      <Card style={styles.chartCard}>
        <Text style={styles.sectionTitle}>
          {selectedMetric === 'weight' && 'Weight Progress'}
          {selectedMetric === 'bodyFat' && 'Body Composition'}
          {selectedMetric === 'muscleMass' && 'Muscle Mass Progress'}
          {selectedMetric === 'measurements' && 'Body Measurements'}
        </Text>
        
        {selectedMetric === 'weight' && renderWeightChart()}
        {selectedMetric === 'bodyFat' && renderBodyCompositionChart()}
        {selectedMetric === 'muscleMass' && renderWeightChart()}
        {selectedMetric === 'measurements' && renderMeasurementsChart()}
      </Card>

      {/* Progress Photos */}
      {progressPhotos && progressPhotos.length > 0 && (
        <Card style={styles.photosCard}>
          <Text style={styles.sectionTitle}>Progress Photos</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {progressPhotos.map((photo, index) => (
              <View key={index} style={styles.photoContainer}>
                <Text style={styles.photoDate}>
                  {new Date(photo.date).toLocaleDateString()}
                </Text>
                {/* Photo component would go here */}
                <View style={styles.photoPlaceholder}>
                  <Ionicons name="image" size={32} color={COLORS.text.secondary} />
                </View>
              </View>
            ))}
          </ScrollView>
        </Card>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.text.secondary,
  },
  timeframeCard: {
    margin: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 16,
  },
  timeframeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeframeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  selectedTimeframeButton: {
    backgroundColor: COLORS.accent.primary,
    borderColor: COLORS.accent.primary,
  },
  timeframeButtonText: {
    fontSize: 14,
    color: COLORS.text.primary,
  },
  selectedTimeframeButtonText: {
    color: COLORS.white,
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  goalsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
  },
  goalItem: {
    marginBottom: 16,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalTitle: {
    fontSize: 16,
    color: COLORS.text.primary,
  },
  goalValue: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  goalProgress: {
    height: 8,
    borderRadius: 4,
  },
  metricCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
  },
  metricContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
  },
  selectedMetricButton: {
    backgroundColor: COLORS.accent.primary,
    borderColor: COLORS.accent.primary,
  },
  metricButtonText: {
    fontSize: 14,
    color: COLORS.text.primary,
  },
  selectedMetricButtonText: {
    color: COLORS.white,
  },
  chartCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  noDataContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 16,
    color: COLORS.text.secondary,
    marginTop: 8,
  },
  photosCard: {
    marginHorizontal: 16,
    marginBottom: 32,
    padding: 20,
  },
  photoContainer: {
    marginRight: 16,
    alignItems: 'center',
  },
  photoDate: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginBottom: 8,
  },
  photoPlaceholder: {
    width: 80,
    height: 120,
    backgroundColor: COLORS.background.secondary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});

export default ProgressDashboard;
