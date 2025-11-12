// Tournament data storage
let tournamentData = [];
let filteredData = [];
let currentSort = { column: null, direction: null };
let selectedPlayers = new Set();
let currentRanking = 'rank'; // 'rank', 'winrate', 'rating'
let pinnedPlayer = null;
let playerConfigs = {}; // Cache for player configuration data

// Load and parse CSV data
async function loadTournamentData() {
    try {
        const response = await fetch('data/final_standings.csv');
        const csvText = await response.text();

        // Parse CSV
        const lines = csvText.trim().split('\n');
        const headers = lines[0].split(',');

        tournamentData = lines.slice(1).map(line => {
            const values = parseCSVLine(line);
            const player = {};

            headers.forEach((header, index) => {
                const value = values[index];

                // Convert numeric values
                if (['Rank', 'Wins', 'Draws', 'Losses', 'Games'].includes(header)) {
                    player[header] = parseInt(value);
                } else if (['Rating_Mu', 'Rating_Sigma', 'Win_Rate'].includes(header)) {
                    player[header] = parseFloat(value);
                } else {
                    player[header] = value;
                }
            });

            return player;
        });

        // Initialize filtered data
        filteredData = [...tournamentData];

        // Display data and create charts
        displayLeaderboard();
        createCharts();
        updateFooterStats();
        setupEventListeners();

    } catch (error) {
        console.error('Error loading tournament data:', error);
        document.getElementById('leaderboard-body').innerHTML =
            '<tr><td colspan="10" class="loading">Error loading tournament data</td></tr>';
    }
}

// Parse CSV line handling commas within quoted fields
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    result.push(current.trim());
    return result;
}

// Display leaderboard table
function displayLeaderboard() {
    const tbody = document.getElementById('leaderboard-body');

    if (filteredData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="12" class="loading">No players match current filters</td></tr>';
        return;
    }

    // Apply dynamic ranking and handle pinned player
    let displayData = applyDynamicRanking([...filteredData]);

    // Move pinned player to top if exists and is in filtered data
    if (pinnedPlayer) {
        const pinnedIndex = displayData.findIndex(p => p.Player === pinnedPlayer);
        if (pinnedIndex > 0) {
            const pinned = displayData.splice(pinnedIndex, 1)[0];
            displayData.unshift(pinned);
        }
    }

    tbody.innerHTML = displayData.map((player, index) => {
        const winRateClass = getWinRateClass(player.Win_Rate);
        const isSelected = selectedPlayers.has(player.Player);
        const isPinned = player.Player === pinnedPlayer;

        // Calculate effective display index (excluding pinned players from medal calculation)
        let effectiveIndex = index;
        if (pinnedPlayer && !isPinned) {
            effectiveIndex = index - 1; // Adjust for pinned player at top
        }

        // Determine row classes for visual highlighting
        let rowClasses = [];
        if (isPinned) rowClasses.push('pinned');

        // Top 3 highlighting based on effective display position (not pinned)
        if (!isPinned) {
            if (effectiveIndex === 0) rowClasses.push('top-1');
            else if (effectiveIndex === 1) rowClasses.push('top-2');
            else if (effectiveIndex === 2) rowClasses.push('top-3');
        }

        // High win rate highlighting (>80%)
        if (player.Win_Rate > 0.8) rowClasses.push('high-winrate');

        const rankDisplay = getRankDisplay(player, effectiveIndex, isPinned);

        return `
            <tr class="${rowClasses.join(' ')}" onclick="showPlayerDetails('${player.Player}')" data-player="${player.Player}">
                <td onclick="event.stopPropagation()">
                    <input type="checkbox" ${isSelected ? 'checked' : ''}
                           onchange="togglePlayerSelection('${player.Player}', this.checked)">
                </td>
                <td>${rankDisplay}</td>
                <td>${player.Player}</td>
                <td>${player.Rating_Mu.toFixed(2)} ± ${player.Rating_Sigma.toFixed(2)}</td>
                <td>${player.Wins}</td>
                <td>${player.Draws}</td>
                <td>${player.Losses}</td>
                <td>${player.Games}</td>
                <td class="${winRateClass}">${(player.Win_Rate * 100).toFixed(1)}%</td>
                <td onclick="event.stopPropagation()">
                    <button class="prompt-btn" onclick="showPlayerPrompts('${player.Player}')">
                        View Prompts
                    </button>
                </td>
                <td onclick="event.stopPropagation()">
                    <button class="pin-btn ${isPinned ? 'pinned' : ''}"
                            onclick="togglePin('${player.Player}')">
                        ${isPinned ? 'Unpin' : 'Pin'}
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    updateSelectAllCheckbox();
}

// Apply dynamic ranking based on current ranking mode
function applyDynamicRanking(data) {
    if (currentSort.column) return data; // Don't re-rank if user is sorting manually

    switch (currentRanking) {
        case 'winrate':
            return data.sort((a, b) => b.Win_Rate - a.Win_Rate);
        case 'rating':
            return data.sort((a, b) => b.Rating_Mu - a.Rating_Mu);
        default: // 'rank'
            return data.sort((a, b) => a.Rank - b.Rank);
    }
}

// Get rank display with appropriate styling
function getRankDisplay(player, displayIndex, isPinned) {
    if (isPinned) {
        return `<span class="rank-badge">📌 ${player.Rank}</span>`;
    }

    let badge = '';
    let rankClass = '';

    // Show medals based on current display position (top 3)
    if (displayIndex === 0) {
        badge = '🥇';
        rankClass = 'gold';
    } else if (displayIndex === 1) {
        badge = '🥈';
        rankClass = 'silver';
    } else if (displayIndex === 2) {
        badge = '🥉';
        rankClass = 'bronze';
    }

    // Determine what rank value to show based on current context
    let rankValue = player.Rank; // Default: original tournament rank
    let additionalInfo = '';

    if (currentRanking === 'winrate') {
        additionalInfo = `<br><span class="dynamic-rank">Original Rank: ${player.Rank}</span>`;
        // For win rate ranking, show the position in win rate order
        if (currentSort.column === null) {
            rankValue = displayIndex + 1;
        }
    } else if (currentRanking === 'rating') {
        additionalInfo = `<br><span class="dynamic-rank">Original Rank: ${player.Rank}</span>`;
        // For rating ranking, show the position in rating order
        if (currentSort.column === null) {
            rankValue = displayIndex + 1;
        }
    } else if (currentSort.column !== null) {
        // Manual sorting is active - show position in sorted order
        additionalInfo = `<br><span class="dynamic-rank">Original Rank: ${player.Rank}</span>`;
        rankValue = displayIndex + 1;
    }

    // Adjust rank value for pinned players
    if (!isPinned && pinnedPlayer && rankValue > 1) {
        // Don't adjust the rank value display, but medals are already handled correctly
        // by effectiveIndex calculation
    }

    return `<span class="rank-badge ${rankClass}">${badge} ${rankValue}</span>${additionalInfo}`;
}

// Toggle pin functionality
function togglePin(playerName) {
    if (pinnedPlayer === playerName) {
        pinnedPlayer = null;
    } else {
        pinnedPlayer = playerName;
    }
    displayLeaderboard();
}

// Change ranking mode
function changeRanking(rankingType) {
    currentRanking = rankingType;
    currentSort = { column: null, direction: null }; // Reset manual sorting
    updateSortArrows();
    displayLeaderboard();
}

// Get CSS class for win rate styling
function getWinRateClass(winRate) {
    if (winRate >= 0.7) return 'win-rate-high';
    if (winRate >= 0.5) return 'win-rate-medium';
    return 'win-rate-low';
}

// Escape HTML to prevent XSS and preserve formatting
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Search functionality
function searchPlayers(query) {
    if (!query) {
        filteredData = [...tournamentData];
    } else {
        const lowerQuery = query.toLowerCase();
        filteredData = tournamentData.filter(player =>
            player.Player.toLowerCase().includes(lowerQuery)
        );
    }
    displayLeaderboard();
}

// Filter functionality
function filterPlayers(filterType) {
    switch (filterType) {
        case 'all':
            filteredData = [...tournamentData];
            break;
        case 'top10':
            filteredData = tournamentData.slice(0, 10);
            break;
        case 'high-winrate':
            filteredData = tournamentData.filter(p => p.Win_Rate >= 0.7);
            break;
        case 'medium-winrate':
            filteredData = tournamentData.filter(p => p.Win_Rate >= 0.5 && p.Win_Rate < 0.7);
            break;
        case 'low-winrate':
            filteredData = tournamentData.filter(p => p.Win_Rate < 0.5);
            break;
    }
    displayLeaderboard();
}

// Sort functionality
function sortTable(column) {
    let direction = 'asc';

    if (currentSort.column === column && currentSort.direction === 'asc') {
        direction = 'desc';
    }

    filteredData.sort((a, b) => {
        let aVal = a[column];
        let bVal = b[column];

        if (typeof aVal === 'string') {
            aVal = aVal.toLowerCase();
            bVal = bVal.toLowerCase();
        }

        if (direction === 'asc') {
            return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        } else {
            return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
        }
    });

    currentSort = { column, direction };
    updateSortArrows();
    displayLeaderboard();
}

// Update sort arrows
function updateSortArrows() {
    document.querySelectorAll('.sortable').forEach(th => {
        th.classList.remove('sorted', 'asc', 'desc');
        if (th.dataset.column === currentSort.column) {
            th.classList.add('sorted', currentSort.direction);
        }
    });
}

// Player selection for comparison
function togglePlayerSelection(playerName, isSelected) {
    if (isSelected) {
        selectedPlayers.add(playerName);
    } else {
        selectedPlayers.delete(playerName);
    }

    updateCompareButton();
    updateSelectAllCheckbox();
}

function updateCompareButton() {
    const compareBtn = document.getElementById('compare-btn');
    compareBtn.disabled = selectedPlayers.size < 2;
}

function updateSelectAllCheckbox() {
    const selectAllCheckbox = document.getElementById('select-all');
    const visiblePlayers = filteredData.map(p => p.Player);
    const selectedVisiblePlayers = visiblePlayers.filter(p => selectedPlayers.has(p));

    if (selectedVisiblePlayers.length === 0) {
        selectAllCheckbox.indeterminate = false;
        selectAllCheckbox.checked = false;
    } else if (selectedVisiblePlayers.length === visiblePlayers.length) {
        selectAllCheckbox.indeterminate = false;
        selectAllCheckbox.checked = true;
    } else {
        selectAllCheckbox.indeterminate = true;
        selectAllCheckbox.checked = false;
    }
}

function toggleSelectAll() {
    const selectAllCheckbox = document.getElementById('select-all');
    const visiblePlayers = filteredData.map(p => p.Player);

    if (selectAllCheckbox.checked) {
        visiblePlayers.forEach(player => selectedPlayers.add(player));
    } else {
        visiblePlayers.forEach(player => selectedPlayers.delete(player));
    }

    displayLeaderboard();
    updateCompareButton();
}

// Player comparison
function showPlayerComparison() {
    if (selectedPlayers.size < 2) return;

    const players = Array.from(selectedPlayers).map(name =>
        tournamentData.find(p => p.Player === name)
    );

    const modal = document.getElementById('comparison-modal');
    const detailsDiv = document.getElementById('comparison-details');

    detailsDiv.innerHTML = `
        <div class="comparison-grid">
            ${players.map(player => `
                <div class="player-comparison">
                    <h3>${player.Player}</h3>
                    <div class="player-stats">
                        <div class="stat-item">
                            <div class="stat-value">#${player.Rank}</div>
                            <div class="stat-label">Rank</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${player.Rating_Mu.toFixed(2)}</div>
                            <div class="stat-label">Rating (μ)</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${(player.Win_Rate * 100).toFixed(1)}%</div>
                            <div class="stat-label">Win Rate</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${player.Wins}</div>
                            <div class="stat-label">Wins</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${player.Losses}</div>
                            <div class="stat-label">Losses</div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
        <div class="comparison-chart">
            <canvas id="comparisonChart"></canvas>
        </div>
    `;

    modal.style.display = 'block';

    // Create comparison chart
    setTimeout(() => createComparisonChart(players), 100);
}

function createComparisonChart(players) {
    const ctx = document.getElementById('comparisonChart').getContext('2d');

    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Rating', 'Win Rate', 'Games Played', 'Wins', 'Consistency'],
            datasets: players.map((player, index) => {
                const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6'];
                const color = colors[index % colors.length];

                return {
                    label: player.Player,
                    data: [
                        (player.Rating_Mu / 50) * 100, // Normalize rating to 0-100
                        player.Win_Rate * 100,
                        (player.Games / 12) * 100, // Normalize games to 0-100
                        (player.Wins / 12) * 100, // Normalize wins to 0-100
                        Math.max(0, 100 - (player.Rating_Sigma * 10)) // Lower sigma = higher consistency
                    ],
                    backgroundColor: color + '40',
                    borderColor: color,
                    borderWidth: 2
                };
            })
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

// Export functionality
function showExportModal() {
    document.getElementById('export-modal').style.display = 'block';
}

function exportToCSV() {
    const headers = ['Rank', 'Player', 'Rating_Mu', 'Rating_Sigma', 'Wins', 'Draws', 'Losses', 'Games', 'Win_Rate'];
    const csvContent = [
        headers.join(','),
        ...filteredData.map(player =>
            headers.map(header => {
                const value = player[header];
                return typeof value === 'string' ? `"${value}"` : value;
            }).join(',')
        )
    ].join('\n');

    downloadFile(csvContent, 'tournament_data.csv', 'text/csv');
}

function exportToJSON() {
    const jsonContent = JSON.stringify(filteredData, null, 2);
    downloadFile(jsonContent, 'tournament_data.json', 'application/json');
}

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Theme toggle
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    const themeIcon = document.querySelector('.theme-icon');
    themeIcon.textContent = newTheme === 'dark' ? '☀️' : '🌙';
}

// Initialize theme
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    const themeIcon = document.querySelector('.theme-icon');
    themeIcon.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
}

// Create all charts
function createCharts() {
    createWinRateChart();
    createRatingChart();
    createGamesChart();
    createTopPlayersChart();
}

// Win Rate Distribution Chart
function createWinRateChart() {
    const ctx = document.getElementById('winRateChart').getContext('2d');

    // Create win rate bins
    const bins = [0, 0.2, 0.4, 0.6, 0.8, 1.0];
    const binCounts = new Array(bins.length - 1).fill(0);
    const binLabels = ['0-20%', '20-40%', '40-60%', '60-80%', '80-100%'];

    tournamentData.forEach(player => {
        for (let i = 0; i < bins.length - 1; i++) {
            if (player.Win_Rate >= bins[i] && player.Win_Rate < bins[i + 1]) {
                binCounts[i]++;
                break;
            }
        }
    });

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: binLabels,
            datasets: [{
                label: 'Number of Players',
                data: binCounts,
                backgroundColor: 'rgba(52, 152, 219, 0.8)',
                borderColor: 'rgba(52, 152, 219, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// Rating Distribution Chart
function createRatingChart() {
    const ctx = document.getElementById('ratingChart').getContext('2d');

    const ratings = tournamentData.map(player => player.Rating_Mu);
    const minRating = Math.min(...ratings);
    const maxRating = Math.max(...ratings);
    const binSize = (maxRating - minRating) / 8;

    const bins = [];
    const binLabels = [];

    for (let i = 0; i < 8; i++) {
        const binStart = minRating + (i * binSize);
        const binEnd = binStart + binSize;
        bins.push(binStart);
        binLabels.push(`${binStart.toFixed(0)}-${binEnd.toFixed(0)}`);
    }
    bins.push(maxRating);

    const binCounts = new Array(binLabels.length).fill(0);

    ratings.forEach(rating => {
        for (let i = 0; i < bins.length - 1; i++) {
            if (rating >= bins[i] && (i === bins.length - 2 || rating < bins[i + 1])) {
                binCounts[i]++;
                break;
            }
        }
    });

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: binLabels,
            datasets: [{
                label: 'Number of Players',
                data: binCounts,
                backgroundColor: 'rgba(155, 89, 182, 0.2)',
                borderColor: 'rgba(155, 89, 182, 1)',
                borderWidth: 2,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// Games Statistics Chart (Wins, Draws, Losses)
function createGamesChart() {
    const ctx = document.getElementById('gamesChart').getContext('2d');

    const totalWins = tournamentData.reduce((sum, player) => sum + player.Wins, 0);
    const totalDraws = tournamentData.reduce((sum, player) => sum + player.Draws, 0);
    const totalLosses = tournamentData.reduce((sum, player) => sum + player.Losses, 0);

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Wins', 'Draws', 'Losses'],
            datasets: [{
                data: [totalWins, totalDraws, totalLosses],
                backgroundColor: [
                    'rgba(39, 174, 96, 0.8)',
                    'rgba(241, 196, 15, 0.8)',
                    'rgba(231, 76, 60, 0.8)'
                ],
                borderColor: [
                    'rgba(39, 174, 96, 1)',
                    'rgba(241, 196, 15, 1)',
                    'rgba(231, 76, 60, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Top 10 Players Win Rates Chart
function createTopPlayersChart() {
    const ctx = document.getElementById('topPlayersChart').getContext('2d');

    const top10 = tournamentData.slice(0, 10);

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: top10.map(player => player.Player),
            datasets: [{
                label: 'Win Rate %',
                data: top10.map(player => (player.Win_Rate * 100).toFixed(1)),
                backgroundColor: 'rgba(46, 204, 113, 0.8)',
                borderColor: 'rgba(46, 204, 113, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                },
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            }
        }
    });
}

// Load player configuration data
async function loadPlayerConfig(playerName) {
    if (playerConfigs[playerName]) {
        return playerConfigs[playerName];
    }

    // Map of known config files (based on the glob results)
    const configFiles = {
        'agrawalom': 'agrawalom_737988_25383356_config_v13.yml',
        'aoorange': 'aoorange_722540_25372279_config-2.yml',
        'chenyufei': 'chenyufei_662534_25342365_config.yml',
        'davidmatteo': 'davidmatteo_749038_25383022_config.yml',
        'enchristopher': 'enchristopher_602285_25348856_config.yml',
        'fangyuan': 'fangyuan_LATE_736625_25402497_config.yml',
        'huangziyu': 'huangziyu_600639_25345415_config.yml',
        'linjiayi': 'linjiayi_742390_25311749_config.yml',
        'listeven': 'listeven_736587_25386131_config.yml',
        'litvakron': 'litvakron_LATE_721981_25391228_Config.yml',
        'liuwenxuan': 'liuwenxuan_LATE_749142_25390122_config.yml',
        'lunamugicajose': 'lunamugicajose_722218_25384298_config_JML.yml',
        'mutolovincent': 'mutolovincent_660111_25380863_config.yml',
        'niruichen': 'niruichen_749387_25381152_config.yml',
        'pengjinjun': 'pengjinjun_657484_25363213_config.yml',
        'schuettmaximilian': 'schuettmaximilian_742091_25384969_config.yml',
        'shanzhihao': 'shanzhihao_733390_25385717_config.yml',
        'singhsanjeevan': 'singhsanjeevan_806110_25385314_config.yml',
        'srivastavaaayush': 'srivastavaaayush_LATE_732701_25389500_config.yml',
        'sunclaire': 'sunclaire_733356_25370888_config.yml',
        'venkatanarayanannaveen': 'venkatanarayanannaveen_764261_25385794_config.yml',
        'wanganda': 'wanganda_736635_25292697_config.yml',
        'wangarabella': 'wangarabella_736620_25345819_config.yml',
        'wangsherry': 'wangsherry_738330_25385663_config.yml',
        'wangyuan': 'wangyuan_736533_25383342_config.yml',
        'xiaoyue': 'xiaoyue_736540_25350835_config.yml',
        'yangganxiang': 'yangganxiang_737248_25349835_config-6.yml',
        'yenaimeng': 'yenaimeng_LATE_605475_25475845_yenaimeng_LATE_605475_25474277_config.yml',
        'yujiehang': 'yujiehang_596718_25359060_config.yml',
        'zhangjingwen': 'zhangjingwen_412991_25379656_config.yml',
        'zhangkarina': 'zhangkarina_666586_25359184_config.yml',
        'zhaoweiliang': 'zhaoweiliang_668422_25383613_config.yml',
        'zhenggary': 'zhenggary_736563_25357709_config.yml',
        'zhouevan': 'zhouevan_663610_25377311_congfig.yml',
        'zhuruby': 'zhuruby_736383_25337304_config_1013.yml',
        'zhutianlei': 'zhutianlei_732667_25376948_config.yml'
    };

    const configFileName = configFiles[playerName.toLowerCase()];

    if (!configFileName) {
        console.warn(`No config file found for player: ${playerName}`);
        return null;
    }

    try {
        const configResponse = await fetch(`data/prompt_collection/${configFileName}`);
        if (!configResponse.ok) {
            throw new Error(`HTTP ${configResponse.status}`);
        }

        const configText = await configResponse.text();
        const config = parseYAMLConfig(configText);
        console.log(`Parsed config for ${playerName}:`, config); // Debug log
        playerConfigs[playerName] = config;
        return config;

    } catch (error) {
        console.error(`Error loading config for ${playerName}:`, error);
        return null;
    }
}

// Parse YAML configuration (simple parser for our use case)
function parseYAMLConfig(yamlText) {
    const lines = yamlText.split('\n');
    const config = { agents: [] };

    let currentAgent = null;
    let currentSection = null;
    let collectingPrompt = null;
    let promptContent = [];
    let baseIndent = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // Skip comments and empty lines when not collecting prompts
        if (!collectingPrompt && (trimmed.startsWith('#') || trimmed === '')) continue;

        const match = line.match(/^(\s*)/);
        const currentIndent = match ? match[1].length : 0;

        // Handle agent sections
        if (trimmed.startsWith('agent')) {
            // Finish any collecting prompt
            if (collectingPrompt && currentAgent) {
                currentAgent.prompts[collectingPrompt] = promptContent.join('\n').trim();
                collectingPrompt = null;
                promptContent = [];
            }

            currentAgent = { model: {}, prompts: {} };
            config.agents.push(currentAgent);
            currentSection = null;
        }
        // Handle model section
        else if (currentAgent && trimmed.startsWith('model:')) {
            if (collectingPrompt) {
                currentAgent.prompts[collectingPrompt] = promptContent.join('\n').trim();
                collectingPrompt = null;
                promptContent = [];
            }
            currentSection = 'model';
        }
        // Handle prompts section
        else if (currentAgent && trimmed.startsWith('prompts:')) {
            if (collectingPrompt) {
                currentAgent.prompts[collectingPrompt] = promptContent.join('\n').trim();
                collectingPrompt = null;
                promptContent = [];
            }
            currentSection = 'prompts';
        }
        // Handle model properties
        else if (currentAgent && currentSection === 'model' && trimmed.includes(':') && !collectingPrompt) {
            const [key, ...valueParts] = trimmed.split(':');
            const value = valueParts.join(':').trim();

            if (key.trim() === 'provider') {
                currentAgent.model.provider = value.replace(/['"]/g, '');
            } else if (key.trim() === 'name') {
                currentAgent.model.name = value.replace(/['"]/g, '');
            }
        }
        // Handle prompt starts
        else if (currentAgent && currentSection === 'prompts') {
            if (trimmed.startsWith('system_prompt: |')) {
                if (collectingPrompt) {
                    currentAgent.prompts[collectingPrompt] = promptContent.join('\n').trim();
                }
                collectingPrompt = 'system_prompt';
                promptContent = [];
                baseIndent = currentIndent + 2; // Expected base indent for prompt content
            } else if (trimmed.startsWith('step_wise_prompt: |')) {
                if (collectingPrompt) {
                    currentAgent.prompts[collectingPrompt] = promptContent.join('\n').trim();
                }
                collectingPrompt = 'step_wise_prompt';
                promptContent = [];
                baseIndent = currentIndent + 2; // Expected base indent for prompt content
            }
            // Collect prompt content
            else if (collectingPrompt) {
                // For empty lines or lines with proper indentation, add to prompt content
                if (trimmed === '' || currentIndent >= baseIndent) {
                    // Remove base indentation but preserve relative indentation
                    let contentLine = '';
                    if (currentIndent >= baseIndent) {
                        contentLine = line.substring(baseIndent);
                    } else if (trimmed === '') {
                        contentLine = '';
                    }
                    promptContent.push(contentLine);
                } else {
                    // End of prompt content - finish collecting
                    currentAgent.prompts[collectingPrompt] = promptContent.join('\n').trim();
                    collectingPrompt = null;
                    promptContent = [];
                    i--; // Reprocess this line
                }
            }
        }
        // Continue collecting prompts if we're in the middle of one
        else if (collectingPrompt) {
            if (trimmed === '' || currentIndent >= baseIndent) {
                let contentLine = '';
                if (currentIndent >= baseIndent) {
                    contentLine = line.substring(baseIndent);
                } else if (trimmed === '') {
                    contentLine = '';
                }
                promptContent.push(contentLine);
            } else {
                // End of prompt content
                currentAgent.prompts[collectingPrompt] = promptContent.join('\n').trim();
                collectingPrompt = null;
                promptContent = [];
                i--; // Reprocess this line
            }
        }
    }

    // Finish any remaining prompt collection
    if (collectingPrompt && currentAgent) {
        currentAgent.prompts[collectingPrompt] = promptContent.join('\n').trim();
    }

    return config;
}

// Show player prompts in dedicated modal
async function showPlayerPrompts(playerName) {
    const player = tournamentData.find(p => p.Player === playerName);
    if (!player) return;

    const modal = document.getElementById('prompt-modal');
    const detailsDiv = document.getElementById('prompt-details');

    // Show loading state first
    detailsDiv.innerHTML = `
        <h2>📝 ${player.Player} - AI Prompts</h2>
        <div class="loading">Loading player configuration...</div>
    `;
    modal.style.display = 'block';

    // Load player configuration
    const config = await loadPlayerConfig(playerName);

    // Build prompt info
    let modelInfo = '<div class="config-section"><h3>🤖 Model Information</h3><p>Configuration not available</p></div>';
    let promptsInfo = '<div class="config-section"><h3>📝 Prompts</h3><p>Configuration not available</p></div>';

    if (config && config.agents && config.agents.length > 0) {
        const agent = config.agents[0]; // Use first agent

        if (agent.model) {
            modelInfo = `
                <div class="config-section">
                    <h3>🤖 Model Information</h3>
                    <div class="model-info">
                        <div class="model-item">
                            <strong>Provider:</strong> ${agent.model.provider || 'Unknown'}
                        </div>
                        <div class="model-item">
                            <strong>Model:</strong> ${agent.model.name || 'Unknown'}
                        </div>
                    </div>
                </div>
            `;
        }

        if (agent.prompts) {
            const systemPrompt = agent.prompts.system_prompt ? escapeHtml(agent.prompts.system_prompt) : '';
            const stepPrompt = agent.prompts.step_wise_prompt ? escapeHtml(agent.prompts.step_wise_prompt) : '';

            promptsInfo = `
                <div class="config-section">
                    <h3>📝 AI Prompts</h3>
                    ${systemPrompt ? `
                        <div class="prompt-section">
                            <h4>System Prompt:</h4>
                            <div class="prompt-content">${systemPrompt}</div>
                        </div>
                    ` : ''}
                    ${stepPrompt ? `
                        <div class="prompt-section">
                            <h4>Step-wise Prompt:</h4>
                            <div class="prompt-content">${stepPrompt}</div>
                        </div>
                    ` : ''}
                    ${!systemPrompt && !stepPrompt ? '<p>No prompts found in configuration</p>' : ''}
                </div>
            `;
        }
    }

    detailsDiv.innerHTML = `
        <h2>📝 ${player.Player} - AI Configuration</h2>
        ${modelInfo}
        ${promptsInfo}
    `;
}

// Show player details modal with model and prompt information
async function showPlayerDetails(playerName) {
    const player = tournamentData.find(p => p.Player === playerName);
    if (!player) return;

    const modal = document.getElementById('player-modal');
    const detailsDiv = document.getElementById('player-details');

    const winRateClass = getWinRateClass(player.Win_Rate);

    // Show loading state first
    detailsDiv.innerHTML = `
        <h2>${player.Player}</h2>
        <div class="loading">Loading player configuration...</div>
    `;
    modal.style.display = 'block';

    // Load player configuration
    const config = await loadPlayerConfig(playerName);

    // Build model info
    let modelInfo = '<div class="config-section"><h3>🤖 Model Information</h3><p>Configuration not available</p></div>';

    if (config && config.agents && config.agents.length > 0) {
        const agent = config.agents[0]; // Use first agent

        if (agent.model) {
            modelInfo = `
                <div class="config-section">
                    <h3>🤖 Model Information</h3>
                    <div class="model-info">
                        <div class="model-item">
                            <strong>Provider:</strong> ${agent.model.provider || 'Unknown'}
                        </div>
                        <div class="model-item">
                            <strong>Model:</strong> ${agent.model.name || 'Unknown'}
                        </div>
                    </div>
                </div>
            `;
        }
    }

    detailsDiv.innerHTML = `
        <h2>${player.Player}</h2>

        <div class="player-stats">
            <div class="stat-item">
                <div class="stat-value">#${player.Rank}</div>
                <div class="stat-label">Rank</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${player.Rating_Mu.toFixed(2)}</div>
                <div class="stat-label">Rating (μ)</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${player.Rating_Sigma.toFixed(2)}</div>
                <div class="stat-label">Rating (σ)</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${player.Games}</div>
                <div class="stat-label">Games Played</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${player.Wins}</div>
                <div class="stat-label">Wins</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${player.Draws}</div>
                <div class="stat-label">Draws</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${player.Losses}</div>
                <div class="stat-label">Losses</div>
            </div>
            <div class="stat-item">
                <div class="stat-value ${winRateClass}">${(player.Win_Rate * 100).toFixed(1)}%</div>
                <div class="stat-label">Win Rate</div>
            </div>
        </div>

        ${modelInfo}
    `;
}

// Update footer statistics
function updateFooterStats() {
    document.getElementById('total-players').textContent = tournamentData.length;
}

// Setup event listeners
function setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('player-search');
    const searchClear = document.getElementById('search-clear');

    searchInput.addEventListener('input', (e) => {
        searchPlayers(e.target.value);
    });

    searchClear.addEventListener('click', () => {
        searchInput.value = '';
        searchPlayers('');
    });

    // Filter functionality
    const filterSelect = document.getElementById('filter-select');
    filterSelect.addEventListener('change', (e) => {
        filterPlayers(e.target.value);
    });

    // Ranking functionality
    const rankingSelect = document.getElementById('ranking-select');
    rankingSelect.addEventListener('change', (e) => {
        changeRanking(e.target.value);
    });

    // Sort functionality
    document.querySelectorAll('.sortable').forEach(th => {
        th.addEventListener('click', () => {
            sortTable(th.dataset.column);
        });
    });

    // Select all checkbox
    const selectAllCheckbox = document.getElementById('select-all');
    selectAllCheckbox.addEventListener('change', toggleSelectAll);

    // Compare and export buttons
    const compareBtn = document.getElementById('compare-btn');
    const exportBtn = document.getElementById('export-btn');

    compareBtn.addEventListener('click', showPlayerComparison);
    exportBtn.addEventListener('click', showExportModal);

    // Export modal buttons
    document.getElementById('export-csv').addEventListener('click', () => {
        exportToCSV();
        document.getElementById('export-modal').style.display = 'none';
    });

    document.getElementById('export-json').addEventListener('click', () => {
        exportToJSON();
        document.getElementById('export-modal').style.display = 'none';
    });

    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.addEventListener('click', toggleTheme);

    // Modal close functionality
    const modals = document.querySelectorAll('.modal');
    const closeBtns = document.querySelectorAll('.close');

    closeBtns.forEach(btn => {
        btn.onclick = function() {
            btn.closest('.modal').style.display = 'none';
        };
    });

    window.onclick = function(event) {
        modals.forEach(modal => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    };
}

// Initialize everything
document.addEventListener('DOMContentLoaded', function() {
    initializeTheme();
    loadTournamentData();
});

// Handle keyboard navigation
document.addEventListener('keydown', function(event) {
    const openModal = document.querySelector('.modal[style*="block"]');
    if (event.key === 'Escape' && openModal) {
        openModal.style.display = 'none';
    }
});