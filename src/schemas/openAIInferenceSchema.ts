// SPDX-License-Identifier: LGPL-3.0-only
// Copyright (c) 2026 Chris Carrington
import { z } from 'zod';

export const OpenAIInferenceSchema = z.object({
    intent: z.string(),
    entity: z.record(z.string(), z.unknown()).optional(),
});
