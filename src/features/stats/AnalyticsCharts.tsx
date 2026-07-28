import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { cardShadow, useTheme } from '@/core/theme/ThemeContext';
import { PressableMotion } from '@/core/ui/PressableMotion';
import { Reveal } from '@/core/ui/Reveal';
import type { RentalWithRelations } from '@/data/types';

interface AnalyticsChartsProps {
  rentals: RentalWithRelations[];
  onRefresh?: () => void;
  onDownloadReport?: () => void;
}

function AnimatedBar({ value, max, delay }: { value: number; max: number; delay: number }) {
  const height = useRef(new Animated.Value(0)).current;
  const target = Math.max(4, (value / max) * 100);

  useEffect(() => {
    height.setValue(0);
    Animated.spring(height, {
      toValue: target,
      delay,
      useNativeDriver: false,
      tension: 60,
      friction: 10,
    }).start();
  }, [target, delay, height]);

  return (
    <Animated.View
      style={[
        styles.barFill,
        {
          height: height.interpolate({
            inputRange: [0, 100],
            outputRange: ['0%', '100%'],
          }),
        },
      ]}
    />
  );
}

export function AnalyticsCharts({ rentals, onRefresh, onDownloadReport }: AnalyticsChartsProps) {
  const { mode, theme } = useTheme();
  const isDark = mode === 'dark';

  const [activeTab, setActiveTab] = useState<'overview' | 'sales' | 'expenses'>('overview');
  const [period, setPeriod] = useState<'monthly' | 'weekly' | 'annual'>('monthly');

  const metrics = React.useMemo(() => {
    let paidTotal = 0;
    let pendingTotal = 0;
    const totalOps = rentals.length;

    rentals.forEach((r) => {
      const amt = r.amount ?? 0;
      if (r.payment_status === 'realizado') paidTotal += amt;
      else pendingTotal += amt;
    });

    const netProfit = paidTotal - Math.round(pendingTotal * 0.15);
    return {
      revenue: paidTotal > 0 ? paidTotal : 228441,
      expenses: pendingTotal > 0 ? pendingTotal : 25108,
      salesCount: totalOps > 0 ? totalOps : 458,
      profit: netProfit > 0 ? netProfit : 203133,
    };
  }, [rentals]);

  const barData = [
    { label: '01', value: 30 },
    { label: '02', value: 52 },
    { label: '03', value: 35 },
    { label: '04', value: 18 },
    { label: '05', value: 44 },
    { label: '06', value: 24 },
    { label: '07', value: 26 },
    { label: '08', value: 31 },
    { label: '09', value: 10 },
    { label: '10', value: 44 },
    { label: '11', value: 38 },
    { label: '12', value: 32 },
  ];

  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const lineDataPaid = [2, 14, 8, 13, 14, 9, 18, 18, 20, 16, 21, 15];
  const lineDataPending = [1, 10, 12, 13, 8, 9, 12, 10, 5, 11, 18, 12];
  const maxBarValue = 60;
  const maxLineValue = 25;

  const kpis = [
    {
      label: 'Revenue',
      value: `$${metrics.revenue.toLocaleString('es-AR')} US$`,
      badge: 'up' as const,
      pct: '3.3%',
    },
    {
      label: 'Expenses',
      value: `$${metrics.expenses.toLocaleString('es-AR')} US$`,
      badge: 'down' as const,
      pct: '3.3%',
    },
    { label: 'Sales', value: `${metrics.salesCount}`, badge: 'up' as const, pct: '3.3%' },
    {
      label: 'Profit',
      value: `$${metrics.profit.toLocaleString('es-AR')} US$`,
      badge: 'up' as const,
      pct: '4.1%',
    },
  ];

  return (
    <View style={styles.dashboardContainer}>
      <Reveal delay={40}>
        <View style={styles.topToolbar}>
          <View
            style={[
              styles.navTabsPill,
              { backgroundColor: isDark ? '#161B22' : '#EFF2F5', borderColor: theme.surfaceBorder },
            ]}
          >
            {(
              [
                { key: 'overview', label: 'Overview' },
                { key: 'sales', label: 'Ventas' },
                { key: 'expenses', label: 'Gastos' },
              ] as const
            ).map((tab) => (
              <PressableMotion
                key={tab.key}
                pressScale={0.96}
                hoverScale={1.03}
                hoverShadow
                onPress={() => setActiveTab(tab.key)}
                contentStyle={[styles.navTabItem, activeTab === tab.key && styles.navTabItemActive]}
              >
                <Text style={[styles.navTabText, activeTab === tab.key && styles.navTabTextActive]}>{tab.label}</Text>
              </PressableMotion>
            ))}
          </View>

          <View style={styles.rightActionsGroup}>
            <PressableMotion
              pressScale={0.94}
              hoverScale={1.06}
              hoverShadow
              onPress={onRefresh}
              contentStyle={[
                styles.iconActionCircle,
                { backgroundColor: isDark ? '#1C2128' : '#FFFFFF', borderColor: theme.surfaceBorder },
              ]}
            >
              <Feather name="refresh-cw" size={14} color={theme.text} />
            </PressableMotion>

            <PressableMotion
              pressScale={0.97}
              hoverScale={1.03}
              hoverShadow
              onPress={() => setPeriod((p) => (p === 'monthly' ? 'weekly' : p === 'weekly' ? 'annual' : 'monthly'))}
              contentStyle={[
                styles.periodSelectorPill,
                { backgroundColor: isDark ? '#1C2128' : '#FFFFFF', borderColor: theme.surfaceBorder },
              ]}
            >
              <Feather name="calendar" size={13} color={theme.textMuted} style={{ marginRight: 6 }} />
              <Text style={[styles.periodText, { color: theme.text }]}>
                {period === 'monthly' ? 'Mensual' : period === 'weekly' ? 'Semanal' : 'Anual'}
              </Text>
              <Feather name="chevron-down" size={13} color={theme.textMuted} style={{ marginLeft: 6 }} />
            </PressableMotion>

            <PressableMotion
              pressScale={0.96}
              hoverScale={1.04}
              hoverShadow
              onPress={onDownloadReport}
              contentStyle={styles.downloadBtn}
            >
              <Feather name="download" size={14} color="#22C55E" style={{ marginRight: 6 }} />
              <Text style={styles.downloadBtnText}>Descargar</Text>
            </PressableMotion>
          </View>
        </View>
      </Reveal>

      <View style={styles.kpiGrid}>
        {kpis.map((kpi, index) => (
          <Reveal key={kpi.label} delay={90 + index * 75} style={styles.kpiReveal}>
            <PressableMotion
              pressScale={0.985}
              hoverScale={1.02}
              hoverShadow
              contentStyle={[
                styles.kpiCard,
                {
                  backgroundColor: isDark ? '#161B22' : '#FFFFFF',
                  borderColor: theme.surfaceBorder,
                },
                !isDark ? cardShadow('light') : null,
              ]}
            >
              <Text style={[styles.kpiLabel, { color: theme.textMuted }]}>{kpi.label}</Text>
              <View style={styles.kpiValueRow}>
                <Text style={[styles.kpiValue, { color: theme.text }]}>{kpi.value}</Text>
                <View style={kpi.badge === 'up' ? styles.badgeSuccess : styles.badgeDanger}>
                  <Feather
                    name={kpi.badge === 'up' ? 'arrow-up' : 'arrow-down'}
                    size={11}
                    color={kpi.badge === 'up' ? '#22C55E' : '#EF4444'}
                  />
                  <Text style={kpi.badge === 'up' ? styles.badgeSuccessText : styles.badgeDangerText}>{kpi.pct}</Text>
                </View>
              </View>
            </PressableMotion>
          </Reveal>
        ))}
      </View>

      <View style={styles.chartsGridRow}>
        <Reveal delay={380} style={styles.chartReveal}>
          <View
            style={[
              styles.chartCard,
              { backgroundColor: isDark ? '#161B22' : '#FFFFFF', borderColor: theme.surfaceBorder },
              !isDark ? cardShadow('light') : null,
            ]}
          >
            <View style={styles.chartHeader}>
              <Text style={[styles.chartTitle, { color: theme.text }]}>Sales Performance</Text>
              <PressableMotion
                pressScale={0.97}
                hoverScale={1.03}
                hoverShadow
                contentStyle={[styles.filterDropdownPill, { backgroundColor: isDark ? '#21262D' : '#F1F5F9' }]}
              >
                <Text style={[styles.filterDropdownText, { color: theme.text }]}>Last 2 weeks</Text>
                <Feather name="chevron-down" size={12} color={theme.textMuted} style={{ marginLeft: 4 }} />
              </PressableMotion>
            </View>

            <View style={styles.salesSubMetricsRow}>
              <View style={styles.subMetricCol}>
                <View style={styles.subMetricValRow}>
                  <Text style={[styles.subMetricVal, { color: theme.text }]}>28.441 US$</Text>
                  <View style={styles.badgeSuccessSmall}>
                    <Text style={styles.badgeSuccessText}>↑ 3.3%</Text>
                  </View>
                </View>
                <Text style={[styles.subMetricLabel, { color: theme.textMuted }]}>Weekly Sales</Text>
              </View>
              <View style={styles.subMetricCol}>
                <View style={styles.subMetricValRow}>
                  <Text style={[styles.subMetricVal, { color: theme.text }]}>4063 US$</Text>
                  <View style={styles.badgeSuccessSmall}>
                    <Text style={styles.badgeSuccessText}>↑ 3.3%</Text>
                  </View>
                </View>
                <Text style={[styles.subMetricLabel, { color: theme.textMuted }]}>Daily Sales</Text>
              </View>
            </View>

            <View style={styles.totalSalesSummary}>
              <View style={styles.subMetricValRow}>
                <Text style={[styles.totalSalesVal, { color: theme.text }]}>278</Text>
                <View style={styles.badgeSuccessSmall}>
                  <Text style={styles.badgeSuccessText}>↑ 3.3%</Text>
                </View>
              </View>
              <Text style={[styles.subMetricLabel, { color: theme.textMuted }]}>Total Sales</Text>
            </View>

            <View style={styles.barChartContainer}>
              <View style={styles.yAxisLabels}>
                <Text style={[styles.axisText, { color: theme.textMuted }]}>60</Text>
                <Text style={[styles.axisText, { color: theme.textMuted }]}>40</Text>
                <Text style={[styles.axisText, { color: theme.textMuted }]}>20</Text>
                <Text style={[styles.axisText, { color: theme.textMuted }]}>0</Text>
              </View>
              <View style={styles.barsPlotArea}>
                <View style={[styles.gridLine, { top: '0%' }]} />
                <View style={[styles.gridLine, { top: '33.3%' }]} />
                <View style={[styles.gridLine, { top: '66.6%' }]} />
                <View style={[styles.gridLine, { top: '100%' }]} />
                <View style={styles.barsRow}>
                  {barData.map((b, idx) => (
                    <View key={idx} style={styles.barColItem}>
                      <View style={styles.barTrack}>
                        <AnimatedBar value={b.value} max={maxBarValue} delay={440 + idx * 45} />
                      </View>
                      <Text style={[styles.barXLabel, { color: theme.textMuted }]}>{b.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </View>
        </Reveal>

        <Reveal delay={500} style={styles.chartReveal}>
          <View
            style={[
              styles.chartCard,
              { backgroundColor: isDark ? '#161B22' : '#FFFFFF', borderColor: theme.surfaceBorder },
              !isDark ? cardShadow('light') : null,
            ]}
          >
            <View style={styles.chartHeader}>
              <Text style={[styles.chartTitle, { color: theme.text }]}>Traffic Source</Text>
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#0084FF' }]} />
                  <Text style={[styles.legendText, { color: theme.textMuted }]}>Organic</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#38BDF8' }]} />
                  <Text style={[styles.legendText, { color: theme.textMuted }]}>Paid Ads</Text>
                </View>
                <Ionicons name="ellipsis-vertical" size={16} color={theme.textMuted} style={{ marginLeft: 8 }} />
              </View>
            </View>

            <View style={styles.trafficMainMetric}>
              <Text style={[styles.trafficVal, { color: theme.text }]}>231,856</Text>
              <Text style={[styles.subMetricLabel, { color: theme.textMuted }]}>Sessions</Text>
            </View>

            <View style={styles.lineChartContainer}>
              <View style={styles.yAxisLabels}>
                <Text style={[styles.axisText, { color: theme.textMuted }]}>20k</Text>
                <Text style={[styles.axisText, { color: theme.textMuted }]}>10k</Text>
                <Text style={[styles.axisText, { color: theme.textMuted }]}>5k</Text>
                <Text style={[styles.axisText, { color: theme.textMuted }]}>0</Text>
              </View>
              <View style={styles.linePlotArea}>
                <View style={[styles.gridLine, { top: '0%' }]} />
                <View style={[styles.gridLine, { top: '33.3%' }]} />
                <View style={[styles.gridLine, { top: '66.6%' }]} />
                <View style={[styles.gridLine, { top: '100%' }]} />
                <View style={styles.lineSeriesWrapper}>
                  {months.map((m, idx) => {
                    const bottomPaid = `${(lineDataPaid[idx] / maxLineValue) * 100}%`;
                    const bottomPending = `${(lineDataPending[idx] / maxLineValue) * 100}%`;
                    return (
                      <Reveal key={m} delay={540 + idx * 35} fromY={10} style={{ flex: 1 }}>
                        <View style={styles.lineColItem}>
                          <View style={styles.linePlotTrack}>
                            <View style={[styles.lineDot, { bottom: bottomPaid as any, backgroundColor: '#0084FF' }]} />
                            <View
                              style={[styles.lineDot, { bottom: bottomPending as any, backgroundColor: '#38BDF8' }]}
                            />
                          </View>
                          <Text style={[styles.barXLabel, { color: theme.textMuted }]}>{m}</Text>
                        </View>
                      </Reveal>
                    );
                  })}
                </View>
              </View>
            </View>
          </View>
        </Reveal>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dashboardContainer: { marginBottom: 20, gap: 16 },
  topToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  navTabsPill: { flexDirection: 'row', borderRadius: 24, padding: 3, borderWidth: 1 },
  navTabItem: { paddingHorizontal: 18, paddingVertical: 7, borderRadius: 20 },
  navTabItemActive: { backgroundColor: '#0084FF' },
  navTabText: { fontSize: 13, fontWeight: '500', color: '#8B949E' },
  navTabTextActive: { color: '#FFFFFF', fontWeight: '700' },
  rightActionsGroup: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconActionCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  periodSelectorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  periodText: { fontSize: 13, fontWeight: '600' },
  downloadBtn: {
    flexDirection: 'row',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 18,
    height: 36,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  downloadBtnText: { color: '#22C55E', fontSize: 13, fontWeight: '700' },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  kpiReveal: { flex: 1, minWidth: 180 },
  kpiCard: { flex: 1, minWidth: 180, padding: 16, borderRadius: 16, borderWidth: 1 },
  kpiLabel: { fontSize: 13, fontWeight: '500', marginBottom: 6 },
  kpiValueRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  kpiValue: { fontSize: 20, fontWeight: '800' },
  badgeSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeSuccessText: { color: '#22C55E', fontSize: 12, fontWeight: '700', marginLeft: 2 },
  badgeDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeDangerText: { color: '#EF4444', fontSize: 12, fontWeight: '700', marginLeft: 2 },
  chartsGridRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  chartReveal: { flex: 1, minWidth: 340 },
  chartCard: { flex: 1, minWidth: 340, padding: 20, borderRadius: 16, borderWidth: 1 },
  chartHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  chartTitle: { fontSize: 16, fontWeight: '800' },
  filterDropdownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  filterDropdownText: { fontSize: 12, fontWeight: '600' },
  salesSubMetricsRow: { flexDirection: 'row', gap: 20, marginBottom: 10 },
  subMetricCol: { gap: 2 },
  subMetricValRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  subMetricVal: { fontSize: 16, fontWeight: '800' },
  badgeSuccessSmall: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  subMetricLabel: { fontSize: 12 },
  totalSalesSummary: { marginBottom: 16 },
  totalSalesVal: { fontSize: 18, fontWeight: '800' },
  barChartContainer: { flexDirection: 'row', height: 170, alignItems: 'flex-end' },
  yAxisLabels: { height: 140, justifyContent: 'space-between', paddingRight: 10, marginBottom: 20 },
  axisText: { fontSize: 11 },
  barsPlotArea: { flex: 1, height: 170, position: 'relative', justifyContent: 'flex-end' },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(128, 128, 128, 0.12)',
  },
  barsRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 140 },
  barColItem: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  barTrack: { width: 14, height: '100%', justifyContent: 'flex-end' },
  barFill: { width: '100%', backgroundColor: '#0084FF', borderRadius: 6 },
  barXLabel: { fontSize: 10, marginTop: 8 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, fontWeight: '600' },
  trafficMainMetric: { marginBottom: 16 },
  trafficVal: { fontSize: 22, fontWeight: '800' },
  lineChartContainer: { flexDirection: 'row', height: 170, alignItems: 'flex-end' },
  linePlotArea: { flex: 1, height: 170, position: 'relative', justifyContent: 'flex-end' },
  lineSeriesWrapper: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 140 },
  lineColItem: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  linePlotTrack: { width: 10, height: '100%', position: 'relative' },
  lineDot: { position: 'absolute', left: 1, width: 8, height: 8, borderRadius: 4 },
});
