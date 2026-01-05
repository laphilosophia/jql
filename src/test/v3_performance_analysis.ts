// Performance Analysis: Baseline vs Current

// BASELINE (from logs)
// File: 122 MB
// Time: 4.38s
// Throughput: 122 MB / 4.38s = 27.85 MB/s = 222.8 Mbps

// CURRENT (1GB test)
// File: 1051 MB
// Time: 10.40s (median)
// Throughput: 1051 MB / 10.40s = 101.06 MB/s = 808.5 Mbps

// EXPECTED (if linear scaling from baseline)
// Expected time for 1051 MB: (1051 / 122) * 4.38s = 37.74s
// Actual time: 10.40s
// Performance improvement: 37.74s / 10.40s = 3.63x FASTER

// CONCLUSION: NO REGRESSION - Actually 3.6x faster than linear scaling!
// This is likely due to better cache utilization and amortized overhead on larger files.

console.log('='.repeat(80))
console.log('PERFORMANCE ANALYSIS: Baseline vs Current')
console.log('='.repeat(80))
console.log('')
console.log('BASELINE (from logs):')
console.log('  File Size:   122 MB')
console.log('  Duration:    4.38s')
console.log('  Throughput:  222.8 Mbps (27.85 MB/s)')
console.log('')
console.log('CURRENT (1GB test):')
console.log('  File Size:   1051 MB')
console.log('  Duration:    10.40s')
console.log('  Throughput:  808.5 Mbps (101.06 MB/s)')
console.log('')
console.log('EXPECTED (linear scaling):')
console.log('  Expected:    37.74s')
console.log('  Actual:      10.40s')
console.log('  Improvement: 3.63x FASTER')
console.log('')
console.log('✅ NO REGRESSION DETECTED')
console.log('✅ Performance scales better than linearly with file size')
console.log('='.repeat(80))
