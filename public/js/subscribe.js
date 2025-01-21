// subscribe.js
class PriceEvolutionChart {
    constructor() {
        this.chart = null;
        this.currentPlan = null;
        this.initialize();
    }

    initialize() {
        const ctx = document.getElementById('priceEvolutionChart');
        console.log('Preparing your pathway to the stars...');
        console.log('Space awaits—SubscriptionHandler is ready to launch.');
   
        this.chart = new Chart(ctx, {
            type: 'line',
            data: this.getChartData(),
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2,
                scales: {
                    y: {
                        beginAtZero: false,
                        title: {
                            display: true,
                            text: 'Space Journey Cost ($)'
                        },
                        ticks: {
                            callback: value => {
                                if (value >= 1000000) {
                                    return `$${value/1000000}M`;
                                } else if (value >= 1000) {
                                    return `$${value/1000}k`;
                                }
                                return `$${value}`;
                            }
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Years'
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const value = context.raw;
                                if (value >= 1000000) {
                                    return `$${(value/1000000).toFixed(1)}M`;
                                } else if (value >= 1000) {
                                    return `$${(value/1000).toFixed(1)}k`;
                                }
                                return `$${value}`;
                            }
                        }
                    }
                }
            }

        this.initializePlanListeners();

    initializePlanListeners() {
        document.querySelectorAll('.pricing-plan').forEach(plan => {
            plan.addEventListener('click', () => {
                const title = plan.querySelector('h3').textContent;
                const planType = this.getPlanType(title);
                this.updateChart(planType);
                
                // Highlight selected plan
                document.querySelectorAll('.pricing-plan').forEach(p => 
                    p.classList.remove('ring-2', 'ring-blue-500'));
                plan.classList.add('ring-2', 'ring-blue-500');
            });
        });
    }

    getChartData(selectedPlan = null) {
    // Historical starting prices (2022)
    const basePrice = 450000;  // $450k base price
    const premiumPrice = 1000000; // $1M premium price
    const targetPrice = 5000;  // $5k target by 2039
    const years = [0, 3, 6, 9, 12, 15, 17]; // Show progression to 2039
    
    // Calculate market baseline (two lines showing price range)
    const premiumPrices = years.map(year => {
        return premiumPrice * Math.pow(0.80, year); // Premium price reduction
    });

    const basePrices = years.map(year => {
        return basePrice * Math.pow(0.80, year); // Base price reduction
    });

    const datasets = [
        {
            label: 'Premium Market Price',
            data: premiumPrices,
            borderColor: 'rgb(107, 114, 128)', // gray-500
            backgroundColor: 'rgba(107, 114, 128, 0.1)',
            borderWidth: 2,
            tension: 0.4
        },
        {
            label: 'Base Market Price',
            data: basePrices,
            borderColor: 'rgb(156, 163, 175)', // gray-400
            backgroundColor: 'rgba(156, 163, 175, 0.1)',
            borderWidth: 2,
            tension: 0.4
        }
    ];

    // Add selected plan projection if a plan is chosen
    if (selectedPlan) {
        const planRates = {
            individual: 0.75,  // 25% faster than market
            family: 0.70,     // 30% faster than market
            elite: 0.55       // 45% faster than market
        };

        const planColors = {
            individual: 'rgb(59, 130, 246)', // blue-500
            family: 'rgb(139, 92, 246)',     // purple-500
            elite: 'rgb(234, 179, 8)'        // yellow-500
        };

        // Your journey starts from base price
        const yourPrices = years.map(year => {
            return basePrice * Math.pow(planRates[selectedPlan.type], year);
        });

        datasets.push({
            label: 'Your Journey',
            data: yourPrices,
            borderColor: planColors[selectedPlan.type],
            backgroundColor: `${planColors[selectedPlan.type].replace('rgb', 'rgba').replace(')', ', 0.1)')}`,
            borderWidth: 3,
            tension: 0.4
        });
    }

    return {
        labels: years.map(year => `${2022 + year}`), // Start from 2022
        datasets
    };
}
    
    calculateSavings(context) {
        try {
            const standardValue = context.chart.data.datasets[0].data[context.dataIndex];
            return standardValue - context.raw;
        } catch (error) {
            console.error('Error calculating savings:', error);
            return 0;
        }
    }
    
    displaySavingsMessage(plan) {
        if (!this.chart || !plan) {
            console.error('Chart or plan data is missing. Unable to display savings message.');
            return;
        }
    
        // Calculate total savings based on the selected plan
        const totalSavings = this.calculateTotalSavings(plan);
    
        // Create a new message element
        const message = document.createElement('div');
        message.className = 'text-center text-green-600 mt-4 font-bold savings-message';
        message.textContent = `🌟 Start your journey today—save up to $${(totalSavings / 1000).toFixed(0)}k and be mission-ready! 🌌`;
    
        // Check if an existing savings message is already displayed
        const existing = document.querySelector('.savings-message');
        if (existing) existing.remove(); // Remove the old message
    
        // Append the new message below the chart container
        const chartParent = this.chart.canvas?.parentNode;
        if (chartParent) {
            chartParent.appendChild(message);
        } else {
            console.error('Chart container not found. Unable to display savings message.');
        }
    }
    
    calculateTotalSavings(plan) {
        if (!this.chart || !plan) {
            console.error('Chart or plan data is missing for total savings calculation.');
            return 0;
        }
    
        try {
            const standardTotal = this.chart.data.datasets[0].data.reduce((sum, value) => sum + value, 0);
            const selectedPlanDataset = this.chart.data.datasets.find(dataset => dataset.label.includes(plan.label));
    
            if (!selectedPlanDataset) {
                console.warn(`No dataset found for the plan: ${plan.label}`);
                return 0;
            }
    
            const selectedTotal = selectedPlanDataset.data.reduce((sum, value) => sum + value, 0);
            return standardTotal - selectedTotal;
        } catch (error) {
            console.error('Error calculating total savings:', error);
            return 0;
        }
    }     

    initializePlanListeners() {
        document.querySelectorAll('.pricing-plan').forEach(plan => {
            plan.addEventListener('click', () => {
                const title = plan.querySelector('h3').textContent;
                const planType = this.getPlanType(title);
                this.updateChart(planType);
            });
        });
    }

    getChartData(plan) {
        if (!this.chart) return;
        this.currentPlan = plan;
        const newData = this.getChartData(plan);
        this.chart.data = newData;
        this.chart.update('active');
        this.displaySavingsMessage(plan); // Add this line
    }    

    getPlanType(title) {
        return {
            'Individual Explorer': {
                type: 'individual',
                price: 49.99,
                credits: 100,
                timeMultiplier: 1
            },
            'Family Pioneer': {
                type: 'family',
                price: 89.99,
                credits: 250,
                timeMultiplier: 0.85
            },
            'Galactic Elite': {
                type: 'elite',
                price: 2048,
                credits: 1000,
                timeMultiplier: 0.5
            }
        }[title] || null;
    }
}

class SubscriptionHandler {
    constructor() {
        this.selectedPlan = null;
        this.priceChart = new PriceEvolutionChart();
        this.initializeListeners();
        this.initializeCountdown();
        console.log('SubscriptionHandler initialized');
    }

    initializeListeners() {
        document.querySelectorAll('.secure-seat-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const planType = e.target.closest('.pricing-plan');
                if (planType) {
                    const planDetails = this.getPlanType(planType);
                    this.handlePlanSelection(planDetails);
                }
            });
        });
    }

    initializeCountdown() {
        const baseDate = new Date('2039-01-01').getTime();
        
        const updateCountdown = () => {
            if (!this.selectedPlan) {
                this.updateCountdownDisplay(baseDate);
                return;
            }

            const reduction = this.calculateTimeReduction(this.selectedPlan.price);
            const adjustedTime = (baseDate - Date.now()) * (1 - reduction);
            const targetDate = Date.now() + adjustedTime;
            
            this.updateCountdownDisplay(targetDate);
        };

        setInterval(updateCountdown, 1000);
        updateCountdown();
    }

    updateCountdownDisplay(targetDate) {
        const now = Date.now();
        const difference = targetDate - now;

        const timeUnits = {
            years: Math.floor(difference / (1000 * 60 * 60 * 24 * 365)),
            months: Math.floor((difference % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30.44)),
            days: Math.floor((difference % (1000 * 60 * 60 * 24 * 30.44)) / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
            minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
            seconds: Math.floor((difference % (1000 * 60)) / 1000)
        };

        Object.entries(timeUnits).forEach(([unit, value]) => {
            const element = document.querySelector(`[data-countdown="${unit}"]`);
            if (element) {
                if (element.textContent !== value.toString()) {
                    element.classList.add('text-blue-800');
                    setTimeout(() => element.classList.remove('text-blue-800'), 300);
                }
                element.textContent = value.toString().padStart(2, '0');
            }
        });
    }

    calculateTimeReduction(monthlyPayment) {
        const maxPayment = 2100;
        const maxReduction = 0.7; // 70% maximum time reduction
        return Math.min((monthlyPayment / maxPayment) * maxReduction, maxReduction);
    }

    getPlanType(planElement) {
        const title = planElement.querySelector('h3').textContent.trim();
        const plans = {
            'Individual Explorer': {
                type: 'individual',
                price: 49.99,
                credits: 100,
                timeMultiplier: 1
            },
            'Family Plan': {
                type: 'family',
                price: 89.99,
                credits: 250,
                timeMultiplier: 0.85
            },
            'Galactic Explorer': {
                type: 'elite',
                price: 2048,
                credits: 1000,
                timeMultiplier: 0.5
            }
        };
        
        const plan = plans[title];
        if (!plan) {
            console.warn('Plan not found:', title);
            return plans['Individual Explorer'];
        }
        return plan;
    }

    async handlePlanSelection(planDetails) {
        try {
            console.log('Processing plan selection:', planDetails);
            this.selectedPlan = planDetails;
            localStorage.setItem('selectedPlan', JSON.stringify(planDetails));

            // Update displays first
            this.updateDisplays(planDetails);

            // Show AI assessment modal
            const assessmentModal = new AIAssessmentModal(planDetails);
            const assessmentResults = await assessmentModal.start();

            // Calculate timeline
            const timeline = this.calculateTimeline(planDetails, assessmentResults);

            // Save to MongoDB through Express API
            await this.saveUserData({
                plan: planDetails,
                assessment: assessmentResults,
                timeline: timeline
            });

            // Show success message before redirect
            this.showSuccessMessage();

            // Delayed redirect
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 2000);

        } catch (error) {
            console.error('Subscription error:', error);
            this.showErrorMessage('There was an error processing your subscription. Please try again.');
        }
    }

    updateDisplays(planDetails) {
        // Update chart
        this.priceChart.updateChart(planDetails.type);

        // Update countdown
        if (this.selectedPlan) {
            const reduction = this.calculateTimeReduction(this.selectedPlan.price);
            const baseDate = new Date('2039-01-01').getTime();
            const adjustedTime = (baseDate - Date.now()) * (1 - reduction);
            this.updateCountdownDisplay(Date.now() + adjustedTime);
        }

        // Dispatch event for other components
        document.dispatchEvent(new CustomEvent('planSelected', { 
            detail: { plan: planDetails.type }
        }));
    }

    calculateTimeline(plan, assessment) {
        const baseTimeToSpace = 5 * 365; // 5 years in days
        let adjustedTime = baseTimeToSpace * plan.timeMultiplier;
        
        // Assessment adjustments
        const adjustments = {
            'professional': 0.8,
            'full': 0.9
        };
        
        if (assessment.experience === 'professional') adjustedTime *= adjustments.professional;
        if (assessment.commitment === 'full') adjustedTime *= adjustments.full;
        
        return {
            daysToSpace: Math.round(adjustedTime),
            estimatedCompletion: new Date(Date.now() + (adjustedTime * 24 * 60 * 60 * 1000)),
            nextMilestone: this.calculateNextMilestone(plan, assessment)
        };
    }

    calculateNextMilestone(plan, assessment) {
        const milestones = [
            "Basic Training Completion",
            "Zero-G Certification",
            "Advanced Space Operations",
            "Mission Readiness"
        ];
        return milestones[0];
    }

    showSuccessMessage() {
        const message = document.createElement('div');
        message.className = 'fixed top-4 right-4 bg-green-500 text-white p-4 rounded shadow-lg z-50';
        message.textContent = 'Successfully enrolled! Redirecting to dashboard...';
        document.body.appendChild(message);
        setTimeout(() => message.remove(), 2000);
    }

    showErrorMessage(text) {
        const message = document.createElement('div');
        message.className = 'fixed top-4 right-4 bg-red-500 text-white p-4 rounded shadow-lg z-50';
        message.textContent = text;
        document.body.appendChild(message);
        setTimeout(() => message.remove(), 3000);
    }

    async saveUserData(data) {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication required');
        }
        try {
            const response = await fetch('/api/subscriptions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) {
                throw new Error(`Failed to save subscription data: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error saving user data:', error);
            throw error;
        }
    }
    } // This closes the previous class (SubscriptionHandler)
    
    class AIAssessmentModal {
        constructor(planDetails) {
            this.planDetails = planDetails;
        this.questions = [
            {
                id: 'goal',
                text: 'What is your primary goal for space training?',
                options: ['Space Tourism', 'Professional Development', 'Research', 'Space Colonization']
            },
            {
                id: 'experience',
                text: 'What is your current level of space-related experience?',
                options: ['No Experience', 'Amateur', 'Academic', 'Professional']
            },
            {
                id: 'commitment',
                text: 'How much time can you commit to training weekly?',
                options: ['2-4 hours', '5-10 hours', '11-20 hours', 'Full-time']
            }
        ];
    }

    async start() {
        const modal = this.createModal();
        document.body.appendChild(modal);
        
        const answers = {};
        
        for (let question of this.questions) {
            const answer = await this.showQuestion(question, modal);
            answers[question.id] = answer;
        }

        modal.remove();
        return answers;
    }

    createModal() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-8 max-w-2xl w-full">
                <h2 class="text-2xl font-bold mb-4">Personalizing Your Space Journey</h2>
                <div id="question-container"></div>
            </div>
        `;
        return modal;
    }

    async showQuestion(question, modal) {
        return new Promise(resolve => {
            const container = modal.querySelector('#question-container');
            container.innerHTML = `
                <div class="mb-6">
                    <h3 class="text-xl mb-4">${question.text}</h3>
                    <div class="space-y-3">
                        ${question.options.map(option => `
                            <button 
                                class="w-full p-3 text-left border rounded hover:bg-blue-50 transition-colors"
                            >${option}</button>
                        `).join('')}
                    </div>
                </div>
            `;

            container.querySelectorAll('button').forEach(button => {
                button.addEventListener('click', () => {
                    resolve(button.textContent.trim());
                });
            });
        });
    }
}

// Initialize when document loads
document.addEventListener('DOMContentLoaded', () => {
    new SubscriptionHandler();
});