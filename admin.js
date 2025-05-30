class AdminDashboard {
    constructor() {
        this.contentTypeSelection = document.getElementById('contentTypeSelection');
        this.contentForms = document.getElementById('contentForms');
        this.contentListView = document.getElementById('contentListView');
        this.contentList = document.getElementById('contentList');
        this.contentTypeFilter = document.getElementById('contentTypeFilter');
        this.contentSearch = document.getElementById('contentSearch');
        
        this.setupEventListeners();
        this.loadContent();
    }

    setupEventListeners() {
        // Navigation buttons
        document.getElementById('viewContent').addEventListener('click', () => this.showViewContent());
        document.getElementById('addContent').addEventListener('click', () => this.showContentTypeSelection());
        document.getElementById('settings').addEventListener('click', () => this.showSettings());

        // Content type cards
        document.querySelectorAll('.content-type-card').forEach(card => {
            card.addEventListener('click', () => this.showContentForm(card.dataset.type));
        });

        // Form submissions
        document.querySelectorAll('.content-form').forEach(form => {
            form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        });

        // Cancel buttons
        document.querySelectorAll('.btn-secondary').forEach(button => {
            button.addEventListener('click', () => this.showContentTypeSelection());
        });

        // Content filtering
        this.contentTypeFilter.addEventListener('change', () => this.filterContent());
        this.contentSearch.addEventListener('input', () => this.filterContent());
    }

    showViewContent() {
        this.contentTypeSelection.classList.add('hidden');
        this.contentForms.classList.add('hidden');
        this.contentListView.classList.remove('hidden');
        this.updateNavigation('viewContent');
    }

    showContentTypeSelection() {
        this.contentTypeSelection.classList.remove('hidden');
        this.contentForms.classList.add('hidden');
        this.contentListView.classList.add('hidden');
        this.updateNavigation('addContent');
    }

    showSettings() {
        // TODO: Implement settings functionality
        alert('Settings functionality coming soon!');
    }

    showContentForm(type) {
        this.contentTypeSelection.classList.add('hidden');
        this.contentForms.classList.remove('hidden');
        this.contentListView.classList.add('hidden');

        // Hide all forms
        document.querySelectorAll('.content-form').forEach(form => {
            form.classList.add('hidden');
        });

        // Show selected form
        document.getElementById(`${type}Form`).classList.remove('hidden');
    }

    updateNavigation(activeButton) {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(activeButton).classList.add('active');
    }

    async handleFormSubmit(event) {
        event.preventDefault();
        const form = event.target;
        const formType = form.id.replace('Form', '');
        const formData = new FormData(form);

        try {
            // Handle CV upload separately
            if (formType === 'cv') {
                const cvFile = formData.get('cv');
                if (!cvFile || !cvFile.name) {
                    throw new Error('Please select a CV file to upload');
                }

                const uploadResponse = await fetch('/api/upload-cv', {
                    method: 'POST',
                    body: formData
                });

                if (!uploadResponse.ok) {
                    const error = await uploadResponse.json();
                    throw new Error(error.error || 'Failed to upload CV');
                }

                const result = await uploadResponse.json();
                this.showSuccess('CV uploaded successfully!');
                return;
            }

            // Handle other content types
            const data = Object.fromEntries(formData.entries());
            console.log('Form submission:', {
                type: formType,
                data: data
            });

            const response = await fetch('/api/content', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: formType,
                    data: data
                })
            });

            const result = await response.json();
            console.log('Server response:', result);

            if (!response.ok) {
                throw new Error(result.error || 'Failed to add content');
            }

            if (result.success) {
                this.showSuccess('Content added successfully!');
                form.reset();
                await this.loadContent();
                this.showViewContent();
            } else {
                throw new Error('Server returned unsuccessful response');
            }
        } catch (error) {
            console.error('Form submission error:', error);
            this.showError(`Failed to add content: ${error.message}`);
        }
    }

    async loadContent() {
        try {
            // TODO: Replace with actual API endpoint
            const response = await fetch('/api/content');
            const content = await response.json();
            this.renderContentList(content);
        } catch (error) {
            this.showError('Failed to load content. Please try again.');
            console.error('Error:', error);
        }
    }

    renderContentList(content) {
        this.contentList.innerHTML = '';
        
        content.forEach(item => {
            const contentItem = document.createElement('div');
            contentItem.className = 'content-item';
            contentItem.dataset.id = item.id;
            contentItem.dataset.type = item.type;
            contentItem.innerHTML = `
                <div class="content-item-info">
                    <h3>${item.title || item.name}</h3>
                    <p>${item.description || ''}</p>
                </div>
                <div class="content-item-actions">
                    <button onclick="adminDashboard.editContent('${item.id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="adminDashboard.deleteContent('${item.id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            this.contentList.appendChild(contentItem);
        });
    }

    filterContent() {
        const type = this.contentTypeFilter.value;
        const search = this.contentSearch.value.toLowerCase();

        document.querySelectorAll('.content-item').forEach(item => {
            const itemType = item.dataset.type;
            const itemText = item.textContent.toLowerCase();
            
            const typeMatch = type === 'all' || itemType === type;
            const searchMatch = itemText.includes(search);

            item.style.display = typeMatch && searchMatch ? 'flex' : 'none';
        });
    }

    async editContent(id) {
        try {
            const response = await fetch('/api/content');
            const allContent = await response.json();
            const content = allContent.find(item => item.id === id);
            
            if (!content) {
                throw new Error('Content not found');
            }

            this.showContentForm(content.type);
            const form = document.getElementById(`${content.type}Form`);
            
            // Populate form fields
            Object.entries(content).forEach(([key, value]) => {
                if (key !== 'id' && key !== 'type') {
                    const input = form.querySelector(`[name="${key}"]`);
                    if (input) {
                        input.value = value;
                    }
                }
            });

            // Remove any existing submit handler
            const newForm = form.cloneNode(true);
            form.parentNode.replaceChild(newForm, form);

            // Add update handler
            newForm.onsubmit = async (e) => {
                e.preventDefault();
                const formData = new FormData(newForm);
                const data = Object.fromEntries(formData.entries());

                try {
                    const updateResponse = await fetch(`/api/content/${id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            type: content.type,
                            data: data
                        })
                    });

                    if (updateResponse.ok) {
                        this.showSuccess('Content updated successfully!');
                        await this.loadContent();
                        this.showViewContent();
                    } else {
                        const error = await updateResponse.json();
                        throw new Error(error.error || 'Failed to update content');
                    }
                } catch (error) {
                    this.showError(`Failed to update content: ${error.message}`);
                }
            };
        } catch (error) {
            this.showError(`Failed to load content for editing: ${error.message}`);
            console.error('Error:', error);
        }
    }

    async deleteContent(id) {
        if (confirm('Are you sure you want to delete this content?')) {
            try {
                // Get the content type from the item's data attribute
                const item = document.querySelector(`[data-id="${id}"]`);
                if (!item) {
                    throw new Error('Content item not found');
                }
                const type = item.dataset.type;

                const response = await fetch(`/api/content/${id}?type=${type}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    this.showSuccess('Content deleted successfully!');
                    await this.loadContent();
                } else {
                    const error = await response.json();
                    throw new Error(error.error || 'Failed to delete content');
                }
            } catch (error) {
                this.showError(`Failed to delete content: ${error.message}`);
                console.error('Error:', error);
            }
        }
    }

    populateForm(content) {
        const form = document.getElementById(`${content.type}Form`);
        Object.entries(content.data).forEach(([key, value]) => {
            const input = form.querySelector(`[name="${key}"]`);
            if (input) {
                input.value = value;
            }
        });
    }

    showSuccess(message) {
        const notification = document.createElement('div');
        notification.className = 'notification success';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    showError(message) {
        const notification = document.createElement('div');
        notification.className = 'notification error';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize the admin dashboard
const adminDashboard = new AdminDashboard(); 