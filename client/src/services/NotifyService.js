// unique id used for the toast notifications container element
const CONTAINER_ID = 'notify-toast-container';

// simple service to show temporary toast notifications using Bootstrap styles
class NotifyService {

    // internal method to get or create the container element for toasts
    _getContainer() {
        // check if container already exists in DOM
        let container = document.getElementById(CONTAINER_ID);
        // if container does not exist yet -> create it
        if (!container) {
            container = document.createElement('div');
            container.id = CONTAINER_ID;
            container.style.cssText =
                'position:fixed;bottom:1rem;right:1rem;z-index:9999;display:flex;flex-direction:column-reverse;gap:0.5rem;';
            document.body.appendChild(container);
        }
        return container;
    }

    // internal method to create and show a toast message of given type (success/danger/info)
    _show(message, type) {
        // get/create notifications container
        const container = this._getContainer();

        // create toast element
        const toast = document.createElement('div');
        toast.className = `alert alert-${type} alert-dismissible fade show mb-0`;
        toast.role = 'alert';
        toast.style.cssText = 'min-width:280px;max-width:400px;box-shadow:0 4px 12px rgba(0,0,0,.15);';
        toast.innerHTML = `${message}<button type="button" class="btn-close" aria-label="Close"></button>`;

        // handle manual close button click
        toast.querySelector('.btn-close').addEventListener('click', () => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 200);
        });

        // add toast to container (newest on top)
        container.appendChild(toast);

        // auto-close notification after 3.5 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 200);
        }, 3500);
    }

    // show green success notification
    notifySuccess(message) {
        this._show(message, 'success');
    }

    // show red error notification
    notifyError(message) {
        this._show(message, 'danger');
    }

    // show blue info notification
    notifyInfo(message) {
        this._show(message, 'info');
    }
}

// export a singleton instance of the NotifyService class
export const notifyService = new NotifyService();
