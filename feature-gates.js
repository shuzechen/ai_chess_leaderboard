// Feature Gates and A/B Testing System
// This simulates a real-world feature flag management system

class FeatureGateManager {
    constructor() {
        this.userId = this.getUserId();
        this.userGroup = this.determineUserGroup();
        this.featureFlags = this.loadFeatureFlags();

        console.log(`🔧 Feature Gates Initialized - User: ${this.userId}, Group: ${this.userGroup}`);
    }

    // Generate or retrieve user ID (in real apps, this comes from authentication)
    getUserId() {
        let userId = localStorage.getItem('tournament_user_id');
        if (!userId) {
            userId = 'user_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('tournament_user_id', userId);
        }
        return userId;
    }

    // Determine user group for A/B testing (consistent assignment)
    determineUserGroup() {
        const hash = this.hashCode(this.userId);
        const groups = ['control', 'test_a', 'test_b', 'premium'];
        return groups[Math.abs(hash) % groups.length];
    }

    // Simple hash function for consistent user group assignment
    hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash;
    }

    // Load feature flags (in production, this would come from a service)
    loadFeatureFlags() {
        // Simulating different feature flag configurations
        const baseFlags = {
            // Core features
            'advanced_analytics': { enabled: false, rollout: 0.3 },
            'real_time_updates': { enabled: false, rollout: 0.1 },
            'export_enhanced': { enabled: true, rollout: 1.0 },

            // UI/UX experiments
            'compact_table_view': { enabled: false, rollout: 0.5 },
            'animated_rankings': { enabled: false, rollout: 0.2 },
            'enhanced_charts': { enabled: false, rollout: 0.4 },

            // Premium features
            'detailed_statistics': { enabled: false, rollout: 0.1 },
            'custom_themes': { enabled: false, rollout: 0.05 },
            'ai_insights': { enabled: false, rollout: 0.02 },

            // A/B test features
            'new_ranking_algorithm': { enabled: false, rollout: 0.25 },
            'improved_search': { enabled: false, rollout: 0.5 },
            'social_features': { enabled: false, rollout: 0.15 }
        };

        // Apply group-specific overrides
        const groupOverrides = this.getGroupOverrides();

        return { ...baseFlags, ...groupOverrides };
    }

    // Group-specific feature overrides (A/B testing)
    getGroupOverrides() {
        const overrides = {};

        switch (this.userGroup) {
            case 'control':
                // Control group sees standard features
                break;

            case 'test_a':
                // Test A: Enhanced UI features
                overrides['compact_table_view'] = { enabled: true, rollout: 1.0 };
                overrides['animated_rankings'] = { enabled: true, rollout: 1.0 };
                break;

            case 'test_b':
                // Test B: Advanced analytics
                overrides['advanced_analytics'] = { enabled: true, rollout: 1.0 };
                overrides['enhanced_charts'] = { enabled: true, rollout: 1.0 };
                break;

            case 'premium':
                // Premium users get all features
                Object.keys(this.featureFlags).forEach(key => {
                    overrides[key] = { enabled: true, rollout: 1.0 };
                });
                break;
        }

        return overrides;
    }

    // Check if a feature is enabled for this user
    isFeatureEnabled(featureName) {
        const flag = this.featureFlags[featureName];
        if (!flag) return false;

        // If explicitly disabled, return false
        if (!flag.enabled) return false;

        // Check rollout percentage
        const userHash = Math.abs(this.hashCode(this.userId + featureName));
        const userRolloutValue = (userHash % 100) / 100;

        const isEnabled = userRolloutValue < flag.rollout;

        // Log for debugging
        console.log(`🎯 Feature "${featureName}": ${isEnabled ? 'ENABLED' : 'DISABLED'} (rollout: ${flag.rollout * 100}%, user: ${(userRolloutValue * 100).toFixed(1)}%)`);

        return isEnabled;
    }

    // Track feature usage (analytics)
    trackFeatureUsage(featureName, action = 'view') {
        const event = {
            feature: featureName,
            action: action,
            userId: this.userId,
            userGroup: this.userGroup,
            timestamp: new Date().toISOString()
        };

        // In production, send to analytics service
        console.log('📊 Feature Usage:', event);

        // Store locally for demo
        const usage = JSON.parse(localStorage.getItem('feature_usage') || '[]');
        usage.push(event);
        localStorage.setItem('feature_usage', JSON.stringify(usage.slice(-100))); // Keep last 100 events
    }

    // Get user's current experiment assignments
    getExperimentAssignments() {
        const assignments = {};

        // Check which A/B tests this user is part of
        Object.keys(this.featureFlags).forEach(feature => {
            if (this.isFeatureEnabled(feature)) {
                assignments[feature] = {
                    variant: this.userGroup,
                    enabled: true
                };
            }
        });

        return assignments;
    }

    // Admin panel data (for monitoring)
    getAdminData() {
        return {
            userId: this.userId,
            userGroup: this.userGroup,
            assignments: this.getExperimentAssignments(),
            usage: JSON.parse(localStorage.getItem('feature_usage') || '[]')
        };
    }

    // Simulate remote feature flag update (for demo)
    updateFeatureFlag(featureName, enabled, rollout = 1.0) {
        this.featureFlags[featureName] = { enabled, rollout };
        console.log(`🔄 Feature "${featureName}" updated: enabled=${enabled}, rollout=${rollout}`);

        // In production, this would sync with a remote service
        localStorage.setItem('feature_flags_override', JSON.stringify(this.featureFlags));
    }
}

// Business Metrics Tracker for A/B Testing
class MetricsTracker {
    constructor() {
        this.sessionId = 'session_' + Date.now();
        this.metrics = {
            pageViews: 0,
            playerDetailsViews: 0,
            promptViews: 0,
            comparisons: 0,
            exports: 0,
            searches: 0,
            timeOnPage: Date.now(),
            interactions: []
        };
    }

    // Track user interactions
    track(event, data = {}) {
        this.metrics.interactions.push({
            event,
            data,
            timestamp: Date.now(),
            sessionId: this.sessionId
        });

        // Update specific counters
        switch (event) {
            case 'player_details_view':
                this.metrics.playerDetailsViews++;
                break;
            case 'prompt_view':
                this.metrics.promptViews++;
                break;
            case 'comparison':
                this.metrics.comparisons++;
                break;
            case 'export':
                this.metrics.exports++;
                break;
            case 'search':
                this.metrics.searches++;
                break;
        }

        console.log(`📈 Metric tracked: ${event}`, data);
    }

    // Get conversion metrics for A/B testing
    getConversionMetrics() {
        const timeOnPage = (Date.now() - this.metrics.timeOnPage) / 1000;

        return {
            engagementScore: this.calculateEngagementScore(),
            timeOnPage: timeOnPage,
            interactionRate: this.metrics.interactions.length / Math.max(timeOnPage / 60, 1), // interactions per minute
            featureUsage: {
                playerDetails: this.metrics.playerDetailsViews,
                prompts: this.metrics.promptViews,
                comparisons: this.metrics.comparisons,
                exports: this.metrics.exports,
                searches: this.metrics.searches
            }
        };
    }

    // Calculate engagement score (business metric)
    calculateEngagementScore() {
        let score = 0;
        score += this.metrics.playerDetailsViews * 2; // Viewing details is valuable
        score += this.metrics.promptViews * 3; // Viewing prompts shows deep engagement
        score += this.metrics.comparisons * 5; // Comparisons are high-value actions
        score += this.metrics.exports * 10; // Exports indicate serious usage
        score += this.metrics.searches * 1; // Searches show exploration

        return Math.min(score, 100); // Cap at 100
    }
}

// Initialize global feature gate system
window.featureGates = new FeatureGateManager();
window.metricsTracker = new MetricsTracker();

// Expose admin functions for testing
window.adminPanel = {
    // View current feature assignments
    showExperiments: () => {
        console.table(window.featureGates.getExperimentAssignments());
    },

    // Toggle a feature for testing
    toggleFeature: (feature, enabled) => {
        window.featureGates.updateFeatureFlag(feature, enabled);
        location.reload(); // Reload to see changes
    },

    // View user metrics
    showMetrics: () => {
        console.table(window.metricsTracker.getConversionMetrics());
    },

    // Simulate being in different user group
    switchUserGroup: (group) => {
        localStorage.setItem('force_user_group', group);
        location.reload();
    },

    // Clear user data (start fresh)
    resetUser: () => {
        localStorage.removeItem('tournament_user_id');
        localStorage.removeItem('force_user_group');
        localStorage.removeItem('feature_usage');
        location.reload();
    }
};

console.log(`
🎯 Feature Gates & A/B Testing System Active!

Available Admin Commands:
- adminPanel.showExperiments()     // View active A/B tests
- adminPanel.showMetrics()         // View engagement metrics
- adminPanel.toggleFeature('name', true/false)  // Toggle features
- adminPanel.switchUserGroup('control'|'test_a'|'test_b'|'premium')
- adminPanel.resetUser()           // Start with new user ID

Your User Group: ${window.featureGates.userGroup}
`);