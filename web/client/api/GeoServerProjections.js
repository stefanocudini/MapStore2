/*
 * Copyright 2026, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import axios from '../libs/ajax';

const DEFAULT_LIMIT = 10; // kept low for the search panel; endpoint allows up to 200

export function searchProjections(endpointUrl, query, page = 1, limit = DEFAULT_LIMIT) {
    return axios.get(`${endpointUrl}/rest/crs`, {
        params: {
            ...(query ? { q: query } : {}),  // planned additional param - omit if absent
            offset: (page - 1) * limit,
            limit
        }
    }).then((res) => {
        return {
            results: res.data.crs || [],     // [{ id, href }] - href not used for fetch
            total: res.data.page?.total ?? 0
        };
    });
}

// Uses /rest/crs/{id} directly - URL constructed from endpointUrl + id, href not needed
export function getProjectionDef(endpointUrl, id) {
    return axios.get(`${endpointUrl}/rest/crs/${id}.json`)
        .then((res) => {
            return {
                code: res.data.id,
                def: res.data.definition   // WKT string
            };
        });
}
