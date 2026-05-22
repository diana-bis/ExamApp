const CONTAINER_ID = 'notify-toast-container';

class NotifyService {
    _getContainer() {
        let container = document.getElementById(CONTAINER_ID);
        if (!container) {
            container = document.createElement('div');
            container.id = CONTAINER_ID;
            container.style.cssText =
                'position:fixed;bottom:1rem;right:1rem;z-index:9999;display:flex;flex-direction:column-reverse;gap:0.5rem;';
            document.body.appendChild(container);
        }
        return container;
    }

    _show(message, type) {
        const container = this._getContainer();

        const toast = document.createElement('div');
        toast.className = `alert alert-${type} alert-dismissible fade show mb-0`;
        toast.role = 'alert';
        toast.style.cssText = 'min-width:280px;max-width:400px;box-shadow:0 4px 12px rgba(0,0,0,.15);';
        toast.innerHTML = `${message}<button type="button" class="btn-close" aria-label="Close"></button>`;

        toast.querySelector('.btn-close').addEventListener('click', () => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 200);
        });

        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 200);
        }, 3500);
    }

    notifySuccess(message) {
        this._show(message, 'success');
    }

    notifyError(message) {
        this._show(message, 'danger');
    }

    notifyInfo(message) {
        this._show(message, 'info');
    }
}

export const notifyService = new NotifyService();
