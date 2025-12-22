const queryInput = document.getElementById('queryInput');
const limitSelect = document.getElementById('limitSelect');
const searchBtn = document.getElementById('searchBtn');
const loading = document.getElementById('loading');
const stats = document.getElementById('stats');
const countSpan = document.getElementById('count');
const resultsGrid = document.getElementById('resultsGrid');
const tabs = document.querySelectorAll('.tab-btn');
const searchSection = document.querySelector('.search-section');

let currentTab = 'discovery';

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentTab = tab.dataset.tab;

        if (currentTab === 'database') {
            searchSection.classList.add('hidden');
            loadDatabase();
        } else {
            searchSection.classList.remove('hidden');
            resultsGrid.innerHTML = '';
            stats.classList.add('hidden');
        }
    });
});

async function loadDatabase() {
    loading.classList.remove('hidden');
    resultsGrid.innerHTML = '';

    try {
        const response = await fetch('/api/leads');
        const data = await response.json();

        if (data.success) {
            renderResults(data.data, true);
            countSpan.innerText = data.count;
            stats.classList.remove('hidden');
        }
    } catch (e) {
        console.error(e);
    } finally {
        loading.classList.add('hidden');
    }
}

searchBtn.addEventListener('click', async () => {
    const query = queryInput.value.trim();
    if (!query) return;

    // UI State: Loading
    searchBtn.disabled = true;
    loading.classList.remove('hidden');
    stats.classList.add('hidden');
    resultsGrid.innerHTML = '';

    try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=${limitSelect.value}`);
        const data = await response.json();

        if (data.success) {
            renderResults(data.data);
            countSpan.innerText = data.count;
            stats.classList.remove('hidden');
        } else {
            alert('Error: ' + data.error);
        }
    } catch (e) {
        console.error(e);
        alert('Failed to connect to discovery engine.');
    } finally {
        searchBtn.disabled = false;
        loading.classList.add('hidden');
    }
});

function renderResults(leads, isDb = false) {
    if (leads.length === 0) {
        resultsGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-dim);">No leads found in ${isDb ? 'database' : 'search'}.</p>`;
        return;
    }

    resultsGrid.innerHTML = leads.map(lead => {
        const instagram = lead.details?.instagram || lead.instagram || 'N/A';
        const email = lead.details?.emails?.[0] || 'N/A';
        const handle = instagram !== 'N/A' ? instagram.split('/').pop() || lead.handle : 'N/A';

        return `
        <div class="lead-card">
            <div class="lead-header">
                <div class="lead-name">${lead.name}</div>
                ${lead.rating !== 'N/A' ? `<div class="rating-badge">★ ${lead.rating} ${lead.reviews ? `(${lead.reviews})` : ''}</div>` : ''}
            </div>
            
            <div class="lead-address">${lead.address || 'Instagram Discovery'}</div>
            
            <div style="margin-bottom: 16px; font-size: 13px;">
                ${email !== 'N/A' ? `<div style="color: var(--primary); margin-bottom: 4px;">✉️ ${email}</div>` : ''}
                ${handle !== 'N/A' ? `<div style="color: #c084fc;">📸 @${handle}</div>` : ''}
            </div>

            <div class="lead-footer">
                ${lead.website && lead.website !== 'N/A' ? `<a href="${lead.website}" target="_blank" class="button btn-sm btn-outline">Website</a>` : ''}
                ${instagram !== 'N/A' ? `<a href="${instagram}" target="_blank" class="button btn-sm" style="background: #c084fc; color: white;">Instagram</a>` : ''}
            </div>
        </div>
    `}).join('');
}

// Enter key support
queryInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchBtn.click();
});
