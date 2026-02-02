let allCryptoData = [];
        let filteredCryptoData = [];
        let currentFilter = 'all';
        let currentPage = 1;
        const itemsPerPage = 12;
        
        // DOM elements
        const cryptoGrid = document.getElementById('cryptoGrid');
        const loadingElement = document.getElementById('loading');
        const errorElement = document.getElementById('error');
        const searchInput = document.getElementById('searchInput');
        const refreshBtn = document.getElementById('refreshBtn');
        const retryBtn = document.getElementById('retryBtn');
        const filterButtons = document.querySelectorAll('.filter-btn');
        const paginationElement = document.getElementById('pagination');
        const totalMarketCapElement = document.getElementById('totalMarketCap');
        const totalVolumeElement = document.getElementById('totalVolume');
        const topGainerElement = document.getElementById('topGainer');
        const activeCryptosElement = document.getElementById('activeCryptos');
        
        // CoinGecko API URL
        const apiUrl = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false';
        
        // Initialize the application
        document.addEventListener('DOMContentLoaded', () => {
            fetchCryptoData();
            
            // Event listeners
            searchInput.addEventListener('input', handleSearch);
            refreshBtn.addEventListener('click', fetchCryptoData);
            retryBtn.addEventListener('click', fetchCryptoData);
            
            // Filter button listeners
            filterButtons.forEach(button => {
                button.addEventListener('click', () => {
                    // Remove active class from all buttons
                    filterButtons.forEach(btn => btn.classList.remove('active'));
                    // Add active class to clicked button
                    button.classList.add('active');
                    
                    currentFilter = button.getAttribute('data-filter');
                    applyFilter();
                });
            });
        });
        
        // Fetch cryptocurrency data from CoinGecko API
        async function fetchCryptoData() {
            showLoading();
            hideError();
            
            try {
                const response = await fetch(apiUrl);
                
                if (!response.ok) {
                    throw new Error(`API error: ${response.status}`);
                }
                
                const data = await response.json();
                allCryptoData = data;
                filteredCryptoData = [...allCryptoData];
                
                hideLoading();
                updateStats();
                applyFilter();
            } catch (error) {
                console.error('Error fetching cryptocurrency data:', error);
                hideLoading();
                showError();
            }
        }
        
        // Update statistics bar
        function updateStats() {
            if (allCryptoData.length === 0) return;
            
            // Calculate total market cap
            const totalMarketCap = allCryptoData.reduce((sum, crypto) => {
                return sum + crypto.market_cap;
            }, 0);
            
            // Format to billions or trillions
            let formattedMarketCap;
            if (totalMarketCap >= 1e12) {
                formattedMarketCap = `$${(totalMarketCap / 1e12).toFixed(2)}T`;
            } else if (totalMarketCap >= 1e9) {
                formattedMarketCap = `$${(totalMarketCap / 1e9).toFixed(2)}B`;
            } else {
                formattedMarketCap = `$${(totalMarketCap / 1e6).toFixed(2)}M`;
            }
            
            // Calculate total volume
            const totalVolume = allCryptoData.reduce((sum, crypto) => {
                return sum + crypto.total_volume;
            }, 0);
            
            let formattedVolume;
            if (totalVolume >= 1e12) {
                formattedVolume = `$${(totalVolume / 1e12).toFixed(2)}T`;
            } else if (totalVolume >= 1e9) {
                formattedVolume = `$${(totalVolume / 1e9).toFixed(2)}B`;
            } else {
                formattedVolume = `$${(totalVolume / 1e6).toFixed(2)}M`;
            }
            
            // Find top gainer
            const topGainer = allCryptoData.reduce((max, crypto) => {
                return crypto.price_change_percentage_24h > max.price_change_percentage_24h ? crypto : max;
            }, allCryptoData[0]);
            
            // Update DOM elements
            totalMarketCapElement.textContent = formattedMarketCap;
            totalVolumeElement.textContent = formattedVolume;
            topGainerElement.textContent = `${topGainer.symbol.toUpperCase()} ${topGainer.price_change_percentage_24h.toFixed(2)}%`;
            activeCryptosElement.textContent = allCryptoData.length;
        }
        
        // Apply current filter to data
        function applyFilter() {
            let filteredData = [...allCryptoData];
            
            // Apply search filter if there's a search term
            const searchTerm = searchInput.value.toLowerCase();
            if (searchTerm) {
                filteredData = filteredData.filter(crypto => 
                    crypto.name.toLowerCase().includes(searchTerm) || 
                    crypto.symbol.toLowerCase().includes(searchTerm)
                );
            }
            
            // Apply category filter
            switch(currentFilter) {
                case 'gainers':
                    filteredData = filteredData.filter(crypto => crypto.price_change_percentage_24h > 0);
                    filteredData.sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h);
                    break;
                case 'losers':
                    filteredData = filteredData.filter(crypto => crypto.price_change_percentage_24h < 0);
                    filteredData.sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h);
                    break;
                case 'volume':
                    filteredData.sort((a, b) => b.total_volume - a.total_volume);
                    break;
                default:
                    // 'all' filter - sort by market cap (already sorted from API)
                    break;
            }
            
            filteredCryptoData = filteredData;
            currentPage = 1;
            renderCryptoGrid();
        }
        
        // Handle search input
        function handleSearch() {
            applyFilter();
        }
        
        // Render cryptocurrency grid with pagination
        function renderCryptoGrid() {
            cryptoGrid.innerHTML = '';
            
            if (filteredCryptoData.length === 0) {
                cryptoGrid.innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #aaa;">
                        <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 20px;"></i>
                        <h3>No cryptocurrencies found</h3>
                        <p>Try adjusting your search or filter criteria</p>
                    </div>
                `;
                paginationElement.innerHTML = '';
                return;
            }
            
            // Calculate pagination
            const totalPages = Math.ceil(filteredCryptoData.length / itemsPerPage);
            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const currentPageData = filteredCryptoData.slice(startIndex, endIndex);
            
            // Render crypto cards
            currentPageData.forEach(crypto => {
                const cryptoCard = document.createElement('div');
                cryptoCard.className = 'crypto-card';
                
                // Determine price change class
                const priceChangeClass = crypto.price_change_percentage_24h >= 0 ? 'positive' : 'negative';
                const priceChangeIcon = crypto.price_change_percentage_24h >= 0 ? 'fas fa-arrow-up' : 'fas fa-arrow-down';
                
                // Format market cap
                let marketCapFormatted;
                if (crypto.market_cap >= 1e12) {
                    marketCapFormatted = `$${(crypto.market_cap / 1e12).toFixed(2)}T`;
                } else if (crypto.market_cap >= 1e9) {
                    marketCapFormatted = `$${(crypto.market_cap / 1e9).toFixed(2)}B`;
                } else if (crypto.market_cap >= 1e6) {
                    marketCapFormatted = `$${(crypto.market_cap / 1e6).toFixed(2)}M`;
                } else {
                    marketCapFormatted = `$${crypto.market_cap.toFixed(2)}`;
                }
                
                // Format volume
                let volumeFormatted;
                if (crypto.total_volume >= 1e9) {
                    volumeFormatted = `$${(crypto.total_volume / 1e9).toFixed(2)}B`;
                } else if (crypto.total_volume >= 1e6) {
                    volumeFormatted = `$${(crypto.total_volume / 1e6).toFixed(2)}M`;
                } else {
                    volumeFormatted = `$${crypto.total_volume.toFixed(2)}`;
                }
                
                cryptoCard.innerHTML = `
                    <div class="crypto-header">
                        <div class="crypto-info">
                            <img src="${crypto.image}" alt="${crypto.name}" class="crypto-icon">
                            <div class="crypto-name">
                                <h3>${crypto.name}</h3>
                                <div class="crypto-symbol">${crypto.symbol.toUpperCase()}</div>
                            </div>
                        </div>
                        <div class="crypto-rank">#${crypto.market_cap_rank}</div>
                    </div>
                    
                    <div class="crypto-price">$${crypto.current_price.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                    
                    <div class="crypto-stats">
                        <div>
                            <div class="stat-label">Market Cap</div>
                            <div class="stat-value">${marketCapFormatted}</div>
                        </div>
                        <div>
                            <div class="stat-label">24h Volume</div>
                            <div class="stat-value">${volumeFormatted}</div>
                        </div>
                    </div>
                    
                    <div class="price-change ${priceChangeClass}">
                        <i class="${priceChangeIcon}"></i> ${crypto.price_change_percentage_24h.toFixed(2)}%
                    </div>
                `;
                
                cryptoGrid.appendChild(cryptoCard);
            });
            
            // Render pagination buttons
            renderPagination(totalPages);
        }
        
        // Render pagination buttons
        function renderPagination(totalPages) {
            paginationElement.innerHTML = '';
            
            // Previous button
            const prevButton = document.createElement('button');
            prevButton.className = 'page-btn';
            prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
            prevButton.disabled = currentPage === 1;
            prevButton.addEventListener('click', () => {
                if (currentPage > 1) {
                    currentPage--;
                    renderCryptoGrid();
                }
            });
            paginationElement.appendChild(prevButton);
            
            // Page number buttons
            const maxVisiblePages = 5;
            let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
            let endPage = startPage + maxVisiblePages - 1;
            
            if (endPage > totalPages) {
                endPage = totalPages;
                startPage = Math.max(1, endPage - maxVisiblePages + 1);
            }
            
            for (let i = startPage; i <= endPage; i++) {
                const pageButton = document.createElement('button');
                pageButton.className = `page-btn ${i === currentPage ? 'active' : ''}`;
                pageButton.textContent = i;
                pageButton.addEventListener('click', () => {
                    currentPage = i;
                    renderCryptoGrid();
                });
                paginationElement.appendChild(pageButton);
            }
            
            // Next button
            const nextButton = document.createElement('button');
            nextButton.className = 'page-btn';
            nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
            nextButton.disabled = currentPage === totalPages;
            nextButton.addEventListener('click', () => {
                if (currentPage < totalPages) {
                    currentPage++;
                    renderCryptoGrid();
                }
            });
            paginationElement.appendChild(nextButton);
        }
        
        // Show loading state
        function showLoading() {
            loadingElement.style.display = 'block';
            cryptoGrid.innerHTML = '';
            paginationElement.innerHTML = '';
        }
        
        // Hide loading state
        function hideLoading() {
            loadingElement.style.display = 'none';
        }
        
        // Show error state
        function showError() {
            errorElement.style.display = 'block';
        }
        
        // Hide error state
        function hideError() {
            errorElement.style.display = 'none';
        }