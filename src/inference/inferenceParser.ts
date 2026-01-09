// SPDX-License-Identifier: LGPL-3.0-only
// Copyright (c) 2026 Chris Carrington
import {InferredOutput} from "../core/model";

export interface InferenceParser {
    parse(outputText: string): InferredOutput;
}
