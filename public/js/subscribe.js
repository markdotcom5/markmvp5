// subscribe.js
class PriceEvolutionChart {
    constructor() {
        this.chart = null;
        this.currentPlan = null;
        this.initialize();
    }

    initialize() {
        const ctx = document.getElementById('priceEvolutionChart');
        if (!ctx) {
            console.error('Chart canvas not found');
            return;
        }

        console.log('Initializing price evolution chart...');
        
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
                            text: 'Space Journey Cost ($)',
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
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
                            text: 'Timeline (Years)',
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleFont: { size: 13 },
                        bodyFont: { size: 12 },
                        padding: 12,
                        callbacks: {
                            label: context => {
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
        });

        this.initializePlanListeners();
    }
    getChartData(selectedPlan = null) {
        // Historical starting prices (2022)
        const basePrice = 450000;  // $450k starting price
        const targetPrice = 5000;  // $5k target by 2039
        const years = [2022, 2025, 2030, 2035, 2039];
        
        // Calculate market baseline
        const marketPrices = years.map(year => {
            const yearsFromStart = year - 2022;
            return basePrice * Math.pow(0.85, yearsFromStart); // 15% reduction per year
        });
    
        const datasets = [{
            label: 'Market Price',
            data: marketPrices,
            borderColor: 'rgb(107, 114, 128)',
            backgroundColor: 'rgba(107, 114, 128, 0.1)',
            borderWidth: 2,
            tension: 0.4
        }];
    
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
    
            const personalPrices = years.map(year => {
                const yearsFromStart = year - 2022;
                return basePrice * Math.pow(planRates[selectedPlan.type], yearsFromStart);
            });
    
            datasets.push({
                label: 'Your Journey',
                data: personalPrices,
                borderColor: planColors[selectedPlan.type],
                backgroundColor: `${planColors[selectedPlan.type].replace('rgb', 'rgba').replace(')', ', 0.1)')}`,
                borderWidth: 3,
                tension: 0.4
            });
        }
    
        return {
            labels: years,
            datasets
        };
    }

    updateChart(planType) {
        if (!this.chart) {
            console.error('Chart not initialized');
            return;
        }

        console.log('Updating chart with plan:', planType);
        const newData = this.getChartData({ type: planType });
        this.chart.data = newData;
        this.chart.update('active');

        // Show and update personal countdown
        const personalCountdown = document.getElementById('personal-countdown');
        if (personalCountdown) {
            personalCountdown.style.display = 'block';
            this.updatePersonalCountdown(planType);
        }
    }
    updateCountdown(selectedPlan) {
        // Base countdown (stays constant)
        const baselineElements = {
            years: document.querySelector('[data-baseline="years"]'),
            months: document.querySelector('[data-baseline="months"]'),
            days: document.querySelector('[data-baseline="days"]'),
            hours: document.querySelector('[data-baseline="hours"]'),
            minutes: document.querySelector('[data-baseline="minutes"]'),
            seconds: document.querySelector('[data-baseline="seconds"]')
        };
    
        // Your accelerated countdown
        const countdownElements = {
            years: document.querySelector('[data-countdown="years"]'),
            months: document.querySelector('[data-countdown="months"]'),
            days: document.querySelector('[data-countdown="days"]'),
            hours: document.querySelector('[data-countdown="hours"]'),
            minutes: document.querySelector('[data-countdown="minutes"]'),
            seconds: document.querySelector('[data-countdown="seconds"]')
        };
    
        // Calculate accelerated time based on plan
        const planMultipliers = {
            individual: 0.6,  // 40% faster
            family: 0.4,     // 60% faster
            elite: 0.1       // 90% faster
        };
    
        const updateTimer = () => {
            const now = new Date();
            const baseTarget = new Date('2039-01-01');
            let timeLeft = baseTarget - now;
    
            // Update baseline countdown
            if (baselineElements.years) {
                const years = Math.floor(timeLeft / (1000 * 60 * 60 * 24 * 365));
                baselineElements.years.textContent = years.toString().padStart(2, '0');
                // ... similar for other units ...
            }
    
            // Update accelerated countdown if plan selected
            if (selectedPlan && countdownElements.years) {
                const multiplier = planMultipliers[selectedPlan.type] || 1;
                timeLeft *= multiplier;
                
                const years = Math.floor(timeLeft / (1000 * 60 * 60 * 24 * 365));
                countdownElements.years.textContent = years.toString().padStart(2, '0');
                // ... similar for other units ...
            }
        };
    
        // Initial update
        updateTimer();
        // Update every second
        return setInterval(updateTimer, 1000);
    }
    updatePersonalCountdown(planType) {
        const accelerationRates = {
            individual: 0.25, // 25% faster
            family: 0.40,    // 40% faster
            elite: 0.80      // 80% faster
        };

        const baseYears = 17; // Years to 2039 from now
        const reduction = accelerationRates[planType] || 0;
        const adjustedYears = baseYears * (1 - reduction);

        // Update acceleration display
        const accelerationEl = document.querySelector('.acceleration-percentage');
        if (accelerationEl) {
            accelerationEl.textContent = `${Math.round(reduction * 100)}`;
        }

        // Calculate target date
        const targetDate = new Date();
        targetDate.setFullYear(targetDate.getFullYear() + adjustedYears);
        this.startPersonalCountdown(targetDate);
    }

    startPersonalCountdown(targetDate) {
        console.log('Starting personal countdown to:', targetDate);
    
        const updateTimer = () => {
            const now = new Date();
            const difference = targetDate - now;
    
            if (difference <= 0) {
                clearInterval(this.personalCountdownInterval);
                console.log('Countdown completed!');
                return;
            }
    
            const timeUnits = {
                years: Math.floor(difference / (1000 * 60 * 60 * 24 * 365)),
                months: Math.floor((difference % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30.44)),
                days: Math.floor((difference % (1000 * 60 * 60 * 24 * 30.44)) / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((difference % (1000 * 60)) / 1000)
            };
    
            // Update the countdown timer values dynamically
            Object.entries(timeUnits).forEach(([unit, value]) => {
                const element = document.querySelector(`[data-personal-countdown="${unit}"]`);
                if (element) {
                    const formattedValue = value.toString().padStart(2, '0');
                    if (element.textContent !== formattedValue) {
                        element.textContent = formattedValue;
                        element.classList.add('number-changed');
                        setTimeout(() => element.classList.remove('number-changed'), 300);
                    }
                } else {
                    console.error(`Element for personal countdown unit "${unit}" not found!`);
                }
            });
        };
    
        // Clear any existing interval
        if (this.personalCountdownInterval) {
            clearInterval(this.personalCountdownInterval);
        }
    
        // Start the countdown
        updateTimer();
        this.personalCountdownInterval = setInterval(updateTimer, 1000);
    }
    
    handlePlanSelection(planDetails) {
        console.log('Handling plan selection:', planDetails);
    
        // Store selected plan
        this.selectedPlan = planDetails;
    
        // Update the chart
        this.updateChart(planDetails);
    
        // Reset and activate the personal countdown
        document.querySelectorAll('[data-personal-countdown]').forEach(el => {
            el.textContent = '--'; // Reset values to "--"
            el.classList.remove('text-gray-400');
            el.classList.add('text-blue-800');
        });
    
        // Calculate and start the countdown
        if (planDetails.type) {
            const targetDate = new Date();
            const accelerationRates = {
                individual: 0.75, // 25% faster
                family: 0.6,      // 40% faster
                elite: 0.3        // 70% faster
            };
    
            const yearsToTarget = 17 * (accelerationRates[planDetails.type] || 1);
            console.log('Calculated target date for plan:', planDetails.type, 'is', targetDate);
            targetDate.setFullYear(targetDate.getFullYear() + yearsToTarget);
    
            this.startPersonalCountdown(targetDate); // Start countdown
        } else {
            console.error('No valid plan type selected!');
        }
    }
    
    initializePlanListeners() {
        document.querySelectorAll('[data-plan]').forEach(button => {
            button.addEventListener('click', (e) => {
                const planType = button.getAttribute('data-plan');
                if (planType) {
                    console.log('Plan selected:', planType);
                    this.handlePlanSelection({ type: planType });
                }
            });
        });
    }
    
// Base Countdown Timer functionality
class BaseCountdown {
    constructor() {
        this.targetDate = new Date('2039-01-01');
        this.start();
    }

    start() {
        const updateTimer = () => {
            const now = new Date();
            const difference = this.targetDate - now;

            const timeUnits = {
                years: Math.floor(difference / (1000 * 60 * 60 * 24 * 365)),
                months: Math.floor((difference % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30.44)),
                days: Math.floor((difference % (1000 * 60 * 60 * 24 * 30.44)) / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((difference % (1000 * 60)) / 1000)
            };

            Object.entries(timeUnits).forEach(([unit, value]) => {
                const element = document.querySelector(`[data-base-countdown="${unit}"]`);
                if (element) {
                    const formattedValue = value.toString().padStart(2, '0');
                    if (element.textContent !== formattedValue) {
                        element.textContent = formattedValue;
                        element.classList.add('number-changed');
                        setTimeout(() => element.classList.remove('number-changed'), 300);
                    }
                }
            });
        };

        // Update immediately and then every second
        updateTimer();
        setInterval(updateTimer, 1000);
    }
}

// Initialize everything when document loads
document.addEventListener('DOMContentLoaded', () => {
    new PriceEvolutionChart();
    new BaseCountdown();
});