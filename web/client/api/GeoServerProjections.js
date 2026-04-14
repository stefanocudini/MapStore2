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

/**
 * Uses /rest/crs/{id}.json directly - URL constructed from endpointUrl + id, href not needed
 * @param {string} endpointUrl - base URL of the GeoServer REST API
 * @param {string} id - projection code (e.g. "EPSG:32632")
 * @returns {Promise} Resolves to { code, def } where def is the WKT string
 */
export function getProjectionDef(endpointUrl, id) {
    // TODO probably use the specific href for the crs, returned by the search endpoint, instead of constructing it from endpointUrl + id
    return axios.get(`${endpointUrl}/rest/crs/${id}.json`)
        .then((res) => {
            return {
                code: res.data.id,
                bbox: res.data.bbox,
                bboxWGS84: res.data.bboxWGS84,
                def: res.data.definition   // WKT string
            };
        });
}
