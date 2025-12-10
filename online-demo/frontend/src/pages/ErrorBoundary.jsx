import React, { Component } from 'react';
import ErrorPage from './ErrorPage.jsx';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) return <ErrorPage error={this.state.error} />;
        
        return this.props.children;
    }
}

export default ErrorBoundary;
