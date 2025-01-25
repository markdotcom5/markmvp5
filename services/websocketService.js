// services/ServiceIntegrator.js
const WebSocketService = require('./websocketService');
const rankingService = require('./rankingService');
const stripeService = require('./stripeService');

class ServiceIntegrator {
    constructor(server) {
        this.ws = new WebSocketService(server);
        
        // Integrate with ranking updates
        rankingService.on('rankUpdate', (data) => {
            this.ws.broadcast({
                type: 'rank_update',
                data
            });
        });

        // Integrate with subscription updates
        stripeService.on('subscriptionUpdate', (data) => {
            this.ws.broadcast({
                type: 'subscription_update',
                data
            });
        });
    }
}

module.exports = ServiceIntegrator;