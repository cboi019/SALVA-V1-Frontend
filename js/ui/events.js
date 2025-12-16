// FILE: js/ui/events.js 

// Initialize all event handlers
function initEventHandlers() {
    // Tab switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            switchTab(tab);
        });
    });
    
    // Plan type selector
    const selectTimeBtn = document.getElementById('selectTimeBased');
    const selectGoalBtn = document.getElementById('selectGoalBased');
    const timeForm = document.getElementById('timeBasedForm');
    const goalForm = document.getElementById('goalBasedForm');
    
    if (selectTimeBtn) {
        selectTimeBtn.addEventListener('click', () => {
            selectTimeBtn.classList.add('active');
            selectGoalBtn.classList.remove('active');
            timeForm.style.display = 'block';
            goalForm.style.display = 'none';
        });
    }
    
    if (selectGoalBtn) {
        selectGoalBtn.addEventListener('click', () => {
            selectGoalBtn.classList.add('active');
            selectTimeBtn.classList.remove('active');
            goalForm.style.display = 'block';
            timeForm.style.display = 'none';
        });
    }
    
    // Time-Based Form Submit
    if (timeForm) {
        timeForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const token = document.getElementById('tbTokenAddress').value;
            const description = document.getElementById('tbDescription').value;
            const duration = document.getElementById('tbDuration').value;
            
            await createTimeBasedPlan(token, description, parseInt(duration));
            
            timeForm.reset();
        });
    }
    
    // Goal-Based Form Submit
    if (goalForm) {
        goalForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const token = document.getElementById('gbTokenAddress').value;
            const description = document.getElementById('gbDescription').value;
            const targetAmount = document.getElementById('gbTargetAmount').value;
            
            // Get token decimals first
            try {
                const tokenContract = new ethers.Contract(token, CONFIG.ERC20_ABI, provider);
                const decimals = await tokenContract.decimals();
                
                // Parse with correct decimals
                const targetWei = ethers.utils.parseUnits(targetAmount, decimals);
                await createGoalBasedPlan(token, description, targetWei);
                
                goalForm.reset();
            } catch (error) {
                console.error('Error creating goal:', error);
                showNotification('Invalid token address or amount', 'error');
            }
        });
    }
    
    // Token Management Form (Admin)
    const tokenManageForm = document.getElementById('tokenManageForm');
    if (tokenManageForm) {
        tokenManageForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const address = document.getElementById('adminTokenAddress').value;
            const name = document.getElementById('adminTokenName').value;
            const action = document.getElementById('adminTokenAction').value === 'true';
            
            await manageToken(address, name, action);
            
            tokenManageForm.reset();
        });
    }
}

// Switch tabs
function switchTab(tabName) {
    // Hide all tab contents
    const contents = document.querySelectorAll('.tab-content');
    contents.forEach(content => content.classList.remove('active'));
    
    // Remove active from all buttons
    const btns = document.querySelectorAll('.tab-btn');
    btns.forEach(btn => btn.classList.remove('active'));
    
    // Show selected tab
    const selectedContent = document.getElementById(`${tabName}Tab`);
    const selectedBtn = document.querySelector(`[data-tab="${tabName}"]`);
    
    if (selectedContent) selectedContent.classList.add('active');
    if (selectedBtn) selectedBtn.classList.add('active');
}