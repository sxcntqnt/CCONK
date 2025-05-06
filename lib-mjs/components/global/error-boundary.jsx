'use client';
import React, { Component } from 'react';
class ErrorBoundary extends Component {
    state = { hasError: false };
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return (<div className="flex items-center justify-center min-h-screen">
                    <h1>Something went wrong.</h1>
                    <p>{this.state.error?.message}</p>
                </div>);
        }
        return this.props.children;
    }
}
export default ErrorBoundary;
