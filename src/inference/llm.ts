// SPDX-License-Identifier: LGPL-3.0-only
// Copyright (c) 2026 Chris Carrington
export interface LLM {
    generateCompletion(systemPrompt: string, userPrompt: string): Promise<string>;
}
