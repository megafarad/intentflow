import {LRUCache} from 'lru-cache';

export interface SecretsManager {
    getSecret(tenantId: string, secretRef: string): Promise<string>;
}

export type Secret = {
    value: string;
    ttlMs?: number;
}

export interface SecretProvider {
    canHandle(ref: string): boolean;

    get(tenantId: string, ref: string): Promise<Secret>;
}

export class EnvSecretProvider implements SecretProvider {
    canHandle(ref: string): boolean {
        return ref.startsWith('env:');
    }

    async get(_tenantId: string, ref: string): Promise<Secret> {
        const envVarName = ref.substring(4);
        const value = process.env[envVarName];
        if (!value) {
            throw new SecretNotFoundException(`Secret ${ref} not found`);
        }
        return {
            value: value,
            ttlMs: 30_0000
        };
    }
}

export class SimpleSecretsManager implements SecretsManager {
    private cache = new LRUCache<string, { v: string, exp?: number }>({max: 1000});
    private providers: SecretProvider[] = [
        new EnvSecretProvider()
    ];

    constructor(private opts: {defaultTtlMs?: number} = {}) {
    }

    async getSecret(tenantId: string, secretRef: string): Promise<string> {
        const ref = secretRef.replaceAll('{tenantId}', tenantId);

        const key = `${tenantId}:${ref}`;
        const hit = this.cache.get(key);

        if (hit && (!hit.exp || hit.exp > Date.now())) {
            return hit.v;
        }

        const provider = this.providers.find(provider => provider.canHandle(ref));
        if (!provider) {
            throw new ProviderNotFoundException(`No provider found for secret ${ref}`);
        }

        const {value, ttlMs} = await provider.get(tenantId, ref);

        const ttl = ttlMs ?? this.opts.defaultTtlMs ?? 60_0000;

        this.cache.set(key, {v: value, exp: Number.isFinite(ttl) ? Date.now() + ttl : undefined});
        return value;
    }
}

export class SecretNotFoundException extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'SecretNotFoundException';
    }
}

export class ProviderNotFoundException extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ProviderNotFoundException';
    }
}