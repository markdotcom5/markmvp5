const User = require('../models/User');

const cache = {
    data: new Map(),
    timeout: 5 * 60 * 1000 // 5 minutes
};

class RankingService {
    static async calculateGlobalRanking(user) {
        try {
            if (!user?.spaceReadinessScore) throw new Error('Invalid user data');

            const cacheKey = `global_${user.id}_${user.spaceReadinessScore}`;
            const cached = this.getCache(cacheKey);
            if (cached) return cached;

            const [totalUsers, higherScores] = await Promise.all([
                User.countDocuments(),
                User.countDocuments({ spaceReadinessScore: { $gt: user.spaceReadinessScore } })
            ]);

            const ranking = this.calculateRankingMetrics(higherScores + 1, totalUsers);
            this.setCache(cacheKey, ranking);

            return ranking;
        } catch (error) {
            throw new Error('Failed to calculate global ranking');
        }
    }

    static async calculateLocalRanking(user, radiusMiles = 50, location) {
        try {
            const radiusMeters = radiusMiles * 1609.34;
            const query = {
                'location.coordinates': {
                    $geoWithin: {
                        $centerSphere: [location.coordinates, radiusMeters / 6378100]
                    }
                }
            };

            const [nearbyUsers, totalLocal] = await Promise.all([
                User.find(query).select('spaceReadinessScore').lean(),
                User.countDocuments(query)
            ]);

            const higherScores = nearbyUsers.filter(u => u.spaceReadinessScore > user.spaceReadinessScore).length;

            return {
                ...this.calculateRankingMetrics(higherScores + 1, totalLocal),
                radius: radiusMiles,
                nearbyCount: totalLocal
            };
        } catch (error) {
            throw new Error('Failed to calculate local ranking');
        }
    }

    static async getRankings(type, options = { page: 1, limit: 10 }) {
        try {
            const skip = (options.page - 1) * options.limit;
            const cacheKey = `rankings_${type}_${options.page}_${options.limit}`;
            const cached = this.getCache(cacheKey);
            if (cached) return cached;
    
            let query = {};
            if (type === 'state') {
                if (!options.state) throw new Error('State parameter required');
                query['location.state'] = options.state;
            }
    
            const [rankings, totalCount] = await Promise.all([
                User.find(query)
                    .select('username spaceReadinessScore location achievements')
                    .sort({ spaceReadinessScore: -1 })
                    .skip(skip)
                    .limit(options.limit)
                    .lean(),
                User.countDocuments(query)
            ]);
    
            const formattedRankings = rankings.map((user, index) => ({
                ...user,
                rank: skip + index + 1,
                quintile: this.getQuintileLabel(skip + index + 1, totalCount)
            }));
    
            this.setCache(cacheKey, formattedRankings);
            return formattedRankings;
        } catch (error) {
            throw new Error(`Failed to get ${type} rankings`);
        }
    }

    static calculateRankingMetrics(rank, total) {
        if (total === 0) return { rank: 0, percentile: 0 };
        const percentile = ((total - rank) / total) * 100;
        return {
            rank,
            total,
            percentile: Math.round(percentile * 10) / 10,
            label: this.getQuintileLabel(rank, total)
        };
    }

    static getQuintileLabel(rank, total) {
        const percentile = ((total - rank) / total) * 100;
        if (percentile >= 95) return 'Pioneer Elite';
        if (percentile >= 80) return 'Star Explorer';
        if (percentile >= 60) return 'Skilled Voyager';
        if (percentile >= 40) return 'Rising Cadet';
        if (percentile >= 20) return 'Aspiring Explorer';
        return 'Rookie Explorer';
    }

    static getCache(key) {
        const cached = cache.data.get(key);
        if (cached && Date.now() - cached.timestamp < cache.timeout) {
            return cached.data;
        }
        return null;
    }

    static setCache(key, data) {
        cache.data.set(key, { data, timestamp: Date.now() });
    }

    static clearCache() {
        cache.data.clear();
    }
}

setInterval(() => {
    const now = Date.now();
    for (const [key, value] of cache.data.entries()) {
        if (now - value.timestamp > cache.timeout) {
            cache.data.delete(key);
        }
    }
}, cache.timeout);

module.exports = RankingService;