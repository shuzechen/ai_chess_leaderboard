# AI Chess Tournament Leaderboard 🏆

A comprehensive, interactive web application displaying results from an AI chess tournament featuring 36 players with their unique AI configurations and strategies.

## 🌐 Live Demo

**🚀 [View Live Website](https://ai-chess-leaderboard.netlify.app)**

## ✨ Features

### 🎯 Core Functionality
- **Dynamic Rankings**: Switch between Final Standing, Win Rate, and Mu Rating
- **Interactive Leaderboard**: Sortable columns for detailed analysis
- **Real-time Search**: Find players instantly by name
- **Advanced Filtering**: Filter by performance categories
- **Player Comparison**: Multi-select players for side-by-side radar chart analysis
- **Data Export**: Download tournament data as CSV or JSON

### 🎨 User Interface
- **Professional Design**: Clean, modern tournament leaderboard
- **Dark/Light Theme**: Toggle between themes with persistent preference
- **Responsive Layout**: Perfect experience on desktop, tablet, and mobile
- **Visual Highlights**:
  - 🥇🥈🥉 Medal badges for top 3 players
  - Special highlighting for players with >80% win rate
  - Color-coded win rates and performance metrics

### 🤖 AI Configuration Display
- **Model Information**: View each player's AI provider and model
- **Prompt Analysis**: Dedicated modal for viewing system and step-wise prompts
- **YAML Configuration**: Custom parser for player configuration files

### 🔧 Advanced Features
- **Player Pinning**: Pin players to the top of leaderboard
- **Consistent Medal Logic**: Top 3 always get medals regardless of sorting
- **Combined Rating Display**: Elegant `μ ± σ` notation
- **Scrollable Modals**: Professional modal design with proper overflow handling

## 🏗️ Technical Stack

- **Frontend**: Pure HTML5, CSS3, JavaScript (ES6+)
- **Charts**: Chart.js for data visualization
- **Styling**: CSS Grid, Flexbox, Custom Properties (CSS Variables)
- **Data Processing**: Custom CSV parser and YAML configuration parser
- **Deployment**: Netlify with automatic GitHub integration

## 📊 Tournament Data

The tournament includes **36 players** with complete statistics:
- Tournament rankings and ELO ratings (μ and σ values)
- Win/Draw/Loss records and win rates
- Individual AI model configurations
- Detailed prompting strategies for each player

## 🚀 Getting Started

### Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/shuzechen/ai_chess_leaderboard.git
   cd ai_chess_leaderboard
   ```

2. **Start a local server**:
   ```bash
   # Using Python
   python3 -m http.server 8080

   # Using Node.js
   npx http-server -p 8080
   ```

3. **Open in browser**:
   ```
   http://localhost:8080
   ```

### File Structure

```
ai_chess_leaderboard/
├── index.html              # Main HTML file
├── styles.css              # Complete styling with themes
├── script.js               # All functionality and interactions
├── data/
│   ├── final_standings.csv # Tournament results
│   └── prompt_collection/  # Individual player YAML configs
└── README.md              # Project documentation
```

## 🎮 How to Use

### Basic Navigation
1. **View Rankings**: Use the dropdown to switch between ranking methods
2. **Search Players**: Type in the search box to filter by name
3. **Sort Data**: Click column headers to sort by different metrics
4. **Filter Results**: Use dropdown filters to focus on player categories

### Player Analysis
1. **View Stats**: Click player names for detailed performance statistics
2. **View Prompts**: Click "View Prompts" buttons to see AI configurations
3. **Compare Players**: Select checkboxes and click "Compare Selected"
4. **Pin Players**: Use pin buttons to keep specific players at the top

### Data Export
1. **Export Data**: Click "Export Data" to download current filtered results
2. **Choose Format**: Select CSV for spreadsheets or JSON for development

## 🏆 Tournament Highlights

- **Champion**: mutolovincent with perfect 12-0 record (100% win rate)
- **Rating Range**: 8.79 to 43.86 (μ values)
- **Models Used**: Various AI providers including OpenAI, Gemini
- **Strategy Diversity**: Unique prompting approaches from tactical to positional

## 🎨 Design Philosophy

- **Information Hierarchy**: Most important data (rank, player, rating) prominently displayed
- **Intuitive Interactions**: Only meaningful sorting options available
- **Professional Aesthetics**: Tournament-grade visual design
- **Accessibility**: High contrast, readable fonts, keyboard navigation
- **Performance**: Efficient rendering and smooth animations

## 🔄 Deployment

The website is automatically deployed to Netlify:
- **Production**: https://ai-chess-leaderboard.netlify.app
- **Auto-deploy**: Pushes to `main` branch trigger rebuilds
- **SSL Enabled**: HTTPS by default for security
- **Global CDN**: Fast loading worldwide

## 🤝 Contributing

This project was built as a comprehensive tournament display system. While primarily complete, suggestions for enhancements are welcome:

1. Fork the repository
2. Create a feature branch
3. Make your improvements
4. Submit a pull request

## 📄 License

MIT License - Feel free to use this code for your own tournament displays or adapt it for other competitive events.

## 🙏 Acknowledgments

- **Tournament Data**: Original chess tournament with AI participants
- **Design Inspiration**: Modern sports leaderboards and tournament websites
- **Technical Stack**: Built with vanilla web technologies for maximum compatibility

---

**🤖 Generated with [Claude Code](https://claude.ai/code)**

**Co-Authored-By: Claude <noreply@anthropic.com>**