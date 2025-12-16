
// FILE: js/app.js 

// Main app initialization
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize wallet
    initWalletButtons();
    
    // Check if we're on the app page
    if (window.location.pathname.includes('app.html')) {
        // Wait for wallet connection
        await checkWalletConnection();
        
        // If not connected, redirect to home
        if (!userAddress) {
            window.location.href = 'index.html';
            return;
        }
        
        // Check if contract is initialized
        if (!salvaContract) {
            console.error('❌ Contract not initialized after wallet connection!');
            showNotification('Failed to initialize contract. Please refresh.', 'error');
            return;
        }
        
        console.log('✅ Contract initialized:', salvaContract.address);
        console.log('✅ User connected:', userAddress);
        
        // Initialize event handlers
        initEventHandlers();
        
        // Load tokens first (needed for dropdowns)
        try {
            await loadWhitelistedTokens();
        } catch (error) {
            console.error('Error loading tokens:', error);
        }
        
        // Then load plans
        try {
            await loadUserPlansFromEvents();
        } catch (error) {
            console.error('Error loading plans:', error);
        }
        
        // Finally update balance (only after plans are loaded)
        try {
            // Small delay to ensure plans are rendered
            setTimeout(async () => {
                await updateTotalBalance();
            }, 500);
        } catch (error) {
            console.error('Error updating balance:', error);
        }
    }
});

// Load all user plans from blockchain events
async function loadUserPlansFromEvents() {
    try {
        showLoading('Loading your commitments...');
        
        // Get all planCreated events for this user
        const filter = salvaContract.filters.planCreated(userAddress);
        const events = await salvaContract.queryFilter(filter);
        
        console.log('Found events:', events.length);
        
        if (events.length === 0) {
            hideLoading();
            const container = document.getElementById('plansContainer');
            if (container) {
                container.innerHTML = '<p class="empty-state">No active plans. Create your first commitment!</p>';
            }
            return;
        }
        
        // Clear old localStorage data
        const plans = JSON.parse(localStorage.getItem('salvaPlans') || '{}');
        plans[userAddress] = [];
        
        // Process each event
        for (const event of events) {
            const planId = event.args._planID.toString();
            console.log('Processing plan ID:', planId);
            
            // Try to fetch as time-based first
            try {
                const timePlan = await salvaContract.viewTimeBasedPlan(userAddress, planId);
                
                if (timePlan.user !== ethers.constants.AddressZero) {
                    plans[userAddress].push({ 
                        id: planId, 
                        type: 'time', 
                        token: timePlan.token 
                    });
                    
                    await fetchAndDisplayPlan(planId, 'time');
                    continue;
                }
            } catch (error) {
                console.log('Not a time-based plan:', planId);
            }
            
            // Try as goal-based
            try {
                const goalPlan = await salvaContract.viewGoalBasedPlan(userAddress, planId);
                
                if (goalPlan.user !== ethers.constants.AddressZero) {
                    plans[userAddress].push({ 
                        id: planId, 
                        type: 'goal', 
                        token: goalPlan.token 
                    });
                    
                    await fetchAndDisplayPlan(planId, 'goal');
                }
            } catch (error) {
                console.log('Not a goal-based plan:', planId);
            }
        }
        
        // Save to localStorage
        localStorage.setItem('salvaPlans', JSON.stringify(plans));
        
        hideLoading();

        // If no plans were successfully processed, show empty state
        if (plans[userAddress].length === 0) {
            const container = document.getElementById('plansContainer');
            if (container) {
                container.innerHTML = '<p class="empty-state">No active plans. Create your first commitment!</p>';
            }
        }
        
        console.log('✅ Plans loaded successfully');
        
    } catch (error) {
        console.error('Error loading plans from events:', error);
        hideLoading();
        
        const container = document.getElementById('plansContainer');
        if (container) {
            container.innerHTML = '<p class="empty-state">Error loading plans. Please refresh.</p>';
        }
    }
}