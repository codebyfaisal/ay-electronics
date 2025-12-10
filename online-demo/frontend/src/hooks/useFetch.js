// src/hooks/useFetch.js
import { useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '../api/apiClient';
import toast from 'react-hot-toast';

const useFetch = (url, options = {}, immediate = true) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const urlRef = useRef(url);
    const optionsRef = useRef(options);

    useEffect(() => {
        urlRef.current = url;
        optionsRef.current = options;
    }, [url, options]);

    const fetchData = useCallback(async (newUrl, newOptions) => {
        const fetchUrl = newUrl || urlRef.current;
        const fetchOptions = newOptions || optionsRef.current;

        setLoading(true);
        setError(null);

        try {
            const response = await apiClient.get(fetchUrl, fetchOptions);
            setData(response.data.data);
            return response.data.data;
        } catch (err) {
            let errorMessage;
            if (err.code === 'ERR_NETWORK')
                errorMessage = 'Network error: Could not connect to the server. Or maybe server is not running. Try restarting the app.';
            else
                errorMessage =
                    err.response?.data?.message ||
                    'An unexpected error occurred during fetch.';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (immediate && urlRef.current) fetchData();
    }, [immediate, url]); 
    
    return { data, loading, error, refetch: fetchData, setData };
};

export default useFetch;
