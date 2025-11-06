/**
 * Custom hook for terminology server operations
 *
 * Provides convenient methods for value set expansion, code lookup,
 * and validation with automatic caching
 */

import { useState, useCallback } from 'react';
import { useAppStore, ValueSetExpansion } from '@/store/app-store';
import { TerminologyClient, ValueSetExpandOptions } from '@/lib/terminology/terminology-client';
import { getExpansionCache } from '@/lib/terminology/expansion-cache';

export function useTerminologyServer() {
  const {
    terminologyServer,
    connectToTerminologyServer,
    disconnectTerminologyServer,
    addValueSetExpansion,
  } = useAppStore();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Test connection to terminology server
   */
  const testConnection = useCallback(async (baseUrl: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const client = new TerminologyClient({ baseUrl });
      const isConnected = await client.testConnection();

      if (!isConnected) {
        throw new Error('Connection test failed');
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Connection failed';
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Connect to terminology server
   */
  const connect = useCallback(
    async (baseUrl: string): Promise<boolean> => {
      const success = await testConnection(baseUrl);

      if (success) {
        connectToTerminologyServer(baseUrl);
      }

      return success;
    },
    [testConnection, connectToTerminologyServer]
  );

  /**
   * Disconnect from terminology server
   */
  const disconnect = useCallback(() => {
    disconnectTerminologyServer();
    setError(null);
  }, [disconnectTerminologyServer]);

  /**
   * Expand a value set with caching
   */
  const expandValueSet = useCallback(
    async (options: ValueSetExpandOptions): Promise<ValueSetExpansion | null> => {
      if (!terminologyServer.isConnected) {
        setError('Not connected to terminology server');
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Check cache first
        const cache = getExpansionCache();
        const cached = await cache.get(options.url, options.version);

        if (cached) {
          console.log('Using cached expansion for', options.url);
          addValueSetExpansion(options.url, cached);
          return cached;
        }

        // Fetch from server
        const client = new TerminologyClient({
          baseUrl: terminologyServer.baseUrl,
        });

        const expansion = await client.expandValueSet(options);

        // Cache the result
        await cache.set(expansion);

        // Add to store
        addValueSetExpansion(options.url, expansion);

        return expansion;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to expand value set';
        setError(message);
        console.error('Value set expansion error:', err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [terminologyServer.isConnected, terminologyServer.baseUrl, addValueSetExpansion]
  );

  /**
   * Lookup a code in a code system
   */
  const lookupCode = useCallback(
    async (system: string, code: string) => {
      if (!terminologyServer.isConnected) {
        setError('Not connected to terminology server');
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const client = new TerminologyClient({
          baseUrl: terminologyServer.baseUrl,
        });

        const result = await client.lookupCode({ system, code });
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to lookup code';
        setError(message);
        console.error('Code lookup error:', err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [terminologyServer.isConnected, terminologyServer.baseUrl]
  );

  /**
   * Validate a code against a value set
   */
  const validateCode = useCallback(
    async (url: string, system: string, code: string, display?: string) => {
      if (!terminologyServer.isConnected) {
        setError('Not connected to terminology server');
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const client = new TerminologyClient({
          baseUrl: terminologyServer.baseUrl,
        });

        const result = await client.validateCode({ url, system, code, display });
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to validate code';
        setError(message);
        console.error('Code validation error:', err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [terminologyServer.isConnected, terminologyServer.baseUrl]
  );

  /**
   * Search for value sets
   */
  const searchValueSets = useCallback(
    async (params?: { name?: string; url?: string; status?: string; _count?: number }) => {
      if (!terminologyServer.isConnected) {
        setError('Not connected to terminology server');
        return [];
      }

      setIsLoading(true);
      setError(null);

      try {
        const client = new TerminologyClient({
          baseUrl: terminologyServer.baseUrl,
        });

        const results = await client.searchValueSets(params);
        return results;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to search value sets';
        setError(message);
        console.error('Value set search error:', err);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [terminologyServer.isConnected, terminologyServer.baseUrl]
  );

  /**
   * Clear all cached expansions
   */
  const clearCache = useCallback(async () => {
    try {
      const cache = getExpansionCache();
      await cache.clear();
    } catch (err) {
      console.error('Failed to clear cache:', err);
    }
  }, []);

  return {
    isConnected: terminologyServer.isConnected,
    baseUrl: terminologyServer.baseUrl,
    expandedValueSets: terminologyServer.expandedValueSets,
    isLoading,
    error,
    testConnection,
    connect,
    disconnect,
    expandValueSet,
    lookupCode,
    validateCode,
    searchValueSets,
    clearCache,
  };
}
