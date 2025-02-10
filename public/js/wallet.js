class WalletManager {
    constructor() {
        this.provider = window?.phantom?.solana;
        this.connection = false;
        this.publicKey = null;
        this.dropdownActive = false;
        this.lastClickTime = 0;
        this.timerInterval = null;
        this.votingEnabled = false;
        this.init();
    }

    async init() {
        try {
            // Initialize UI elements - Desktop
            this.walletContainer = document.querySelector('.wallet-container');
            this.connectButton = document.getElementById('connectButton');
            this.disconnectButton = document.getElementById('disconnectButton');
            this.walletAddress = document.getElementById('walletAddress');
            this.balanceElement = document.getElementById('balance');
            this.dropdownWalletInfo = document.getElementById('dropdownWalletInfo');
            this.dropdownBalance = document.getElementById('dropdownBalance');
            this.dropdownTrigger = document.getElementById('walletDropdownTrigger');
            this.walletDropdown = document.getElementById('walletDropdown');
            this.dropdownArrow = document.getElementById('dropdownArrow');

            // Initialize UI elements - Mobile
            this.mobileConnectButton = document.getElementById('mobileConnectButton');
            this.mobileWalletInfo = document.getElementById('mobileWalletInfo');
            this.mobileMenu = document.getElementById('mobileMenu');
            
            // Add event listeners - Desktop
            if (this.connectButton) {
                this.connectButton.addEventListener('click', async (e) => {
                    e.preventDefault();
                    const currentTime = new Date().getTime();
                    if (currentTime - this.lastClickTime > 1000) {
                        this.lastClickTime = currentTime;
                        await this.connectWallet();
                    }
                });
            }

            if (this.disconnectButton) {
                this.disconnectButton.addEventListener('click', async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const currentTime = new Date().getTime();
                    if (currentTime - this.lastClickTime > 1000) {
                        this.lastClickTime = currentTime;
                        await this.disconnectWallet();
                    }
                });
            }

            if (this.dropdownTrigger) {
                this.dropdownTrigger.addEventListener('click', () => this.toggleDropdown());
            }

            // Add event listeners - Mobile
            if (this.mobileConnectButton) {
                this.mobileConnectButton.addEventListener('click', async (e) => {
                    e.preventDefault();
                    const currentTime = new Date().getTime();
                    if (currentTime - this.lastClickTime > 1000) {
                        this.lastClickTime = currentTime;
                        if (this.publicKey) {
                            await this.disconnectWallet();
                        } else {
                            await this.connectWallet();
                        }
                    }
                });
            }

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (this.dropdownActive && !this.walletContainer?.contains(e.target)) {
                    this.closeDropdown();
                }
            });

            // Check if Phantom is installed
            if (!this.provider) {
                const message = 'Phantom wallet not found! Please install Phantom.';
                console.error(message);
                this.updateMobileWalletInfo(message, true);
                return;
            }

            // Check if previously connected
            await this.checkConnection();
        } catch (error) {
            console.error('Wallet initialization error:', error);
            this.updateMobileWalletInfo('Failed to initialize wallet', true);
        }
    }

    toggleDropdown() {
        if (this.dropdownActive) {
            this.closeDropdown();
        } else {
            this.openDropdown();
        }
    }

    openDropdown() {
        this.dropdownActive = true;
        this.walletDropdown?.classList.add('active');
        if (this.dropdownArrow) {
            this.dropdownArrow.style.transform = 'rotate(180deg)';
        }
    }

    closeDropdown() {
        this.dropdownActive = false;
        this.walletDropdown?.classList.remove('active');
        if (this.dropdownArrow) {
            this.dropdownArrow.style.transform = 'rotate(0deg)';
        }
    }

    updateMobileWalletInfo(message, isError = false) {
        if (this.mobileWalletInfo) {
            if (typeof message === 'string') {
                this.mobileWalletInfo.innerHTML = `
                    <div class="py-2 ${isError ? 'text-red-500' : 'text-white'}">
                        ${message}
                    </div>
                `;
            } else {
                this.mobileWalletInfo.innerHTML = `
                    <div class="py-2 space-y-2">
                        <div class="text-gray-300 text-sm">Wallet Address:</div>
                        <div class="text-white break-all text-sm font-mono">${message.address}</div>
                        <div class="text-gray-300 text-sm mt-2">Balance:</div>
                        <div class="text-white text-sm font-mono">${message.balance}</div>
                    </div>
                `;
            }
        }
    }

    async checkConnection() {
        try {
            const resp = await this.provider.connect({ onlyIfTrusted: true });
            await this.handleConnection(resp.publicKey.toString());
        } catch (error) {
            console.log('No previous connection found');
        }
    }

    async connectWallet() {
        try {
            const resp = await this.provider.connect();
            await this.handleConnection(resp.publicKey.toString());
        } catch (error) {
            console.error('Wallet connection error:', error);
            const errorMessage = 'Failed to connect wallet: ' + error.message;
            this.updateMobileWalletInfo(errorMessage, true);
            alert(errorMessage);
        }
    }

    async disconnectWallet() {
        try {
            await fetch('/wallet/disconnect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ wallet: this.publicKey })
            });

            await this.provider.disconnect();
            this.handleDisconnect();
        } catch (error) {
            console.error('Error disconnecting wallet:', error);
            const errorMessage = 'Failed to disconnect wallet: ' + error.message;
            this.updateMobileWalletInfo(errorMessage, true);
        }
    }

    async getAccountInfo() {
        try {
            const response = await fetch('/wallet/get-account-info', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ wallet: this.publicKey })
            });

            const data = await response.json();
            return data.success ? data.accountInfo : null;
        } catch (error) {
            console.error('Error getting account info:', error);
            this.updateMobileWalletInfo('Error getting account info', true);
            return null;
        }
    }

    async handleConnection(publicKey) {
        this.publicKey = publicKey;
        
        // Update Desktop UI
        if (this.walletContainer) {
            this.walletContainer.classList.add('connected');
        }
        
        // Update addresses
        const shortAddress = this.shortenAddress(this.publicKey);
        if (this.walletAddress) {
            this.walletAddress.textContent = shortAddress;
        }
        if (this.dropdownWalletInfo) {
            this.dropdownWalletInfo.textContent = `Connected: ${shortAddress}`;
        }
        
        // Get and display balance
        await this.updateBalance();
        
        // Get additional account information
        const accountInfo = await this.getAccountInfo();
        
        // Update Mobile UI
        this.updateMobileWalletInfo({
            address: this.publicKey,
            balance: this.balanceElement?.textContent || '0 SOL'
        });

        if (this.mobileConnectButton) {
            this.mobileConnectButton.textContent = 'Disconnect Wallet';
        }

        // Update voting elements
        await this.updateVotingElements();
        
        // Setup wallet event handlers
        this.provider.on('disconnect', () => this.handleDisconnect());
        this.provider.on('accountChanged', async (publicKey) => {
            if (publicKey) {
                await this.handleConnection(publicKey.toString());
            } else {
                this.handleDisconnect();
            }
        });
    }

    async updateVotingElements() {
        if (!this.publicKey) return;

        try {
            // Check voting eligibility
            const eligibilityResponse = await fetch(`/vote/can-vote?wallet=${this.publicKey}`);
            const eligibilityData = await eligibilityResponse.json();
            
            if (eligibilityData.success) {
                // Update user's total votes
                const userTotalVotes = document.getElementById('userTotalVotes');
                if (userTotalVotes) {
                    userTotalVotes.textContent = eligibilityData.totalVotes.toLocaleString();
                }

                // Handle voting status and timer
                this.votingEnabled = eligibilityData.canVote;
                const voteButton = document.getElementById('voteButton');
                const cooldownTimer = document.getElementById('cooldownTimer');
                const votingButtons = document.getElementById('votingButtons');

                if (voteButton && cooldownTimer) {
                    if (this.votingEnabled) {
                        voteButton.textContent = 'Cast Your Vote';
                        voteButton.disabled = false;
                        cooldownTimer.classList.add('hidden');
                    } else {
                        voteButton.disabled = true;
                        this.updateTimer(eligibilityData.nextVoteTime);
                    }
                }

                // Reset voting buttons
                if (votingButtons) votingButtons.classList.add('hidden');
                if (voteButton) voteButton.classList.remove('hidden');
            }

            // Update global stats
            const statsResponse = await fetch('/vote/voting-stats');
            const statsData = await statsResponse.json();
            
            if (statsData.success) {
                this.updateVotingStats(statsData.stats);
            }
        } catch (error) {
            console.error('Error updating voting elements:', error);
        }
    }

    updateTimer(nextVoteTime) {
        clearInterval(this.timerInterval);
        const timerDisplay = document.getElementById('timerDisplay');
        const cooldownTimer = document.getElementById('cooldownTimer');

        const updateDisplay = () => {
            const now = Date.now();
            const timeLeft = nextVoteTime - now;

            if (timeLeft <= 0) {
                clearInterval(this.timerInterval);
                cooldownTimer.classList.add('hidden');
                this.checkVotingEligibility();
                return;
            }

            const hours = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

            timerDisplay.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            cooldownTimer.classList.remove('hidden');
        };

        updateDisplay();
        this.timerInterval = setInterval(updateDisplay, 1000);
    }

    updateVotingStats(stats) {
        // Update Ronaldo stats
        const ronaldoElements = {
            percentage: document.getElementById('ronaldoPercentage'),
            votes: document.getElementById('ronaldoVotes'),
            progress: document.getElementById('ronaldoProgress')
        };
        
        if (ronaldoElements.percentage) ronaldoElements.percentage.textContent = `${stats.ronaldo.percentage}%`;
        if (ronaldoElements.votes) ronaldoElements.votes.textContent = `${stats.ronaldo.votes.toLocaleString()} votes`;
        if (ronaldoElements.progress) ronaldoElements.progress.style.width = `${stats.ronaldo.percentage}%`;
        
        // Update Messi stats
        const messiElements = {
            percentage: document.getElementById('messiPercentage'),
            votes: document.getElementById('messiVotes'),
            progress: document.getElementById('messiProgress')
        };
        
        if (messiElements.percentage) messiElements.percentage.textContent = `${stats.messi.percentage}%`;
        if (messiElements.votes) messiElements.votes.textContent = `${stats.messi.votes.toLocaleString()} votes`;
        if (messiElements.progress) messiElements.progress.style.width = `${stats.messi.percentage}%`;
        
        // Update total votes
        const totalVotes = document.getElementById('totalVotes');
        if (totalVotes) totalVotes.textContent = stats.totalVotes.toLocaleString();
    }

    async updateBalance() {
        try {
            const response = await fetch('/wallet/get-balance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ wallet: this.publicKey })
            });

            const data = await response.json();
            
            if (data.success) {
                const balance = data.balance.toFixed(4);
                const formattedBalance = `${balance} SOL`;
                
                if (this.balanceElement) {
                    this.balanceElement.textContent = formattedBalance;
                }
                if (this.dropdownBalance) {
                    this.dropdownBalance.textContent = `Balance: ${formattedBalance}`;
                }
            }
        } catch (error) {
            console.error('Error updating balance:', error);
            this.updateMobileWalletInfo('Error updating balance', true);
        }
    }

    handleDisconnect() {
        this.publicKey = null;
        
        // Reset Desktop UI
        this.resetUI();
        
        // Reset voting elements
        this.resetVotingElements();
        
        this.closeDropdown();
    }

    resetUI() {
        if (this.walletContainer) this.walletContainer.classList.remove('connected');
        if (this.walletAddress) this.walletAddress.textContent = '';
        if (this.balanceElement) this.balanceElement.textContent = '0 SOL';
        if (this.dropdownWalletInfo) this.dropdownWalletInfo.textContent = '';
        if (this.dropdownBalance) this.dropdownBalance.textContent = '';
        
        // Reset Mobile UI
        this.updateMobileWalletInfo('');
        if (this.mobileConnectButton) this.mobileConnectButton.textContent = 'Connect Wallet';
    }

    resetVotingElements() {
        const elements = {
            voteButton: document.getElementById('voteButton'),
            cooldownTimer: document.getElementById('cooldownTimer'),
            votingButtons: document.getElementById('votingButtons'),
            userTotalVotes: document.getElementById('userTotalVotes')
        };
        
        if (elements.voteButton) {
            elements.voteButton.disabled = true;
            elements.voteButton.classList.remove('hidden');
        }
        if (elements.cooldownTimer) elements.cooldownTimer.classList.add('hidden');
        if (elements.votingButtons) elements.votingButtons.classList.add('hidden');
        if (elements.userTotalVotes) elements.userTotalVotes.textContent = '0';
        
        this.votingEnabled = false;
        clearInterval(this.timerInterval);
    }
 
    shortenAddress(address) {
        return `${address.slice(0, 4)}...${address.slice(-4)}`;
    }
 }
 
 // Initialize wallet manager
 document.addEventListener('DOMContentLoaded', () => {
    window.walletManager = new WalletManager();
 });
 
 // Handle page visibility
 document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && window.walletManager) {
        window.walletManager.checkConnection();
    }
 });