const AIAssistant = require('../services/aiAssistant');
const cache = require('../utils/cache');
const logger = require('../utils/logger');

class AIController {
    constructor() {
        this.assistant = new AIAssistant();
        this.cache = cache;
        this.retryAttempts = 3;
    }

    async generateTrainingContent(req, res) {
        const { module } = req.params;
        const userLevel = req.user?.trainingLevel || 'beginner';
        const cacheKey = `training:${module}:${userLevel}`;

        try {
            // Check cache first
            const cachedContent = await this.cache.get(cacheKey);
            if (cachedContent) {
                return res.json(cachedContent);
            }

            let trainingContent = await this.assistant.generateTrainingContent(module, userLevel);
            
            // Validate content
            if (!this.validateContent(trainingContent)) {
                trainingContent = await this.getFallbackWithRetry(module);
            }

            // Cache valid content
            await this.cache.set(cacheKey, trainingContent, 3600); // 1 hour

            res.json({
                module,
                content: trainingContent,
                difficulty: userLevel,
                metadata: {
                    generatedAt: new Date().toISOString(),
                    version: '1.0'
                }
            });

        } catch (error) {
            logger.error('AI Content Generation Error:', error);
            res.status(500).json(this.handleError(error));
        }
    }

    async generateScenario(req, res) {
        const { module, complexity } = req.params;
        
        try {
            const scenario = await this.assistant.provideProblemSolvingScenario(
                module, 
                complexity,
                req.user?.performanceMetrics
            );

            res.json({
                scenario,
                hints: await this.generateHints(scenario),
                timeEstimate: this.calculateTimeEstimate(scenario)
            });

        } catch (error) {
            logger.error('Scenario Generation Error:', error);
            res.status(500).json(this.handleError(error));
        }
    }

    async getFallbackWithRetry(module, attempts = 0) {
        if (attempts >= this.retryAttempts) {
            return this.assistant.getFallbackContent(module);
        }

        try {
            const content = await this.assistant.generateTrainingContent(module);
            return this.validateContent(content) ? 
                   content : 
                   this.getFallbackWithRetry(module, attempts + 1);
        } catch (error) {
            logger.warn(`Retry attempt ${attempts + 1} failed:`, error);
            return this.getFallbackWithRetry(module, attempts + 1);
        }
    }

    validateContent(content) {
        return content && 
               content.length >= 100 && 
               content.includes('objectives') &&
               !content.includes('inappropriate');
    }

    async generateHints(scenario) {
        try {
            return await this.assistant.generateHints(scenario);
        } catch (error) {
            logger.error('Hint Generation Error:', error);
            return ['Generic hint available'];
        }
    }

    calculateTimeEstimate(scenario) {
        const baseTime = 15;
        const complexityFactor = scenario.complexity || 1;
        return Math.round(baseTime * complexityFactor);
    }

    handleError(error) {
        return {
            error: 'AI Processing Error',
            message: error.message,
            code: error.code || 'INTERNAL_ERROR'
        };
    }
}

module.exports = new AIController();