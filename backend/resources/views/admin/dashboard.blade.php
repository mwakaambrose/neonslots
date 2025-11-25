<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Admin Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>body{font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;padding:16px}</style>
</head>
<body>
    <h1>Neon Slots — Admin Dashboard</h1>
    <div style="display:flex;gap:24px;flex-wrap:wrap">
        <div><strong>DAU:</strong> {{ $dau }}</div>
        <div><strong>MAU:</strong> {{ $mau }}</div>
        <div><strong>Total Spins:</strong> {{ $totalSpins }}</div>
        <div><strong>Total Bets:</strong> {{ $totalBets }}</div>
        <div><strong>Total Payouts:</strong> {{ $totalPayouts }}</div>
        <div><strong>Observed RTP:</strong> {{ number_format($observedRtp * 100, 2) }}%</div>
        <div><strong>Net Revenue:</strong> {{ $netRevenue }}</div>
        <div><strong>Avg Session (s):</strong> {{ round($avgSessionLengthSeconds, 1) }}</div>
        <div><strong>Avg Spins/Session:</strong> {{ round($avgSpinsPerSession, 2) }}</div>
    </div>

    <h2>Trends</h2>
    <canvas id="rtpChart" width="600" height="200"></canvas>

    <script>
    // Placeholder chart. In future, fetch /api/admin/metrics for time series
    const ctx = document.getElementById('rtpChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['7d','6d','5d','4d','3d','2d','today'],
            datasets: [{
                label: 'Observed RTP',
                data: [{{ round($observedRtp * 100, 2) }}, {{ round($observedRtp * 100, 2) }}, {{ round($observedRtp * 100, 2) }}, {{ round($observedRtp * 100, 2) }}, {{ round($observedRtp * 100, 2) }}, {{ round($observedRtp * 100, 2) }}, {{ round($observedRtp * 100, 2) }}],
                borderColor: '#4f46e5',
                backgroundColor: 'rgba(79,70,229,0.1)'
            }]
        }
    });
    </script>
</body>
</html>
