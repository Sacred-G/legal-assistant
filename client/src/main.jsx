import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('React Error Boundary caught an error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-100">
                    <div className="bg-white p-8 rounded-lg shadow-md">
                        <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
                        <p className="text-gray-600">The application encountered an error. Please refresh the page.</p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

const root = document.getElementById('root');
if (root) {
    ReactDOM.createRoot(root).render(
        <React.StrictMode>
            <ErrorBoundary>
                <App />
            </ErrorBoundary>
        </React.StrictMode>
    );
} else {
    console.error('Root element not found');
}
