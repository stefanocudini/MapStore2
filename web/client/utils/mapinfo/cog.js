/**
 * Copyright 2026, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Observable } from 'rxjs';
import isObject from 'lodash/isObject';

import { getMapLibrary } from '../MapUtils';


function getLayerFromLayerNode(layerNode) {
    const map = getMapLibrary()?.map;
    if (!map) return null;

    return map.getLayers().getArray().find(l =>
        l.get('id') === layerNode.id
    );
}

export default {
    buildRequest: function() {
        console.log('COG mapinfo buildRequest not implemented yet', arguments);
        return null;
    },
    // buildRequest: (layer, { point, currentLocale, map } = {}) => {
    //     //const { features = [] } = point?.intersectedFeatures?.find(({ id }) => id === layer.id) || {};
    //     const features = [];

    //     const layerOl = getLayerFromLayerNode(layer);

    //     console.log('mapinfo COG buildRequest', {layer, layerOl, point, map});
    //     return {
    //         request: {
    //             features: [...features],
    //             outputFormat: 'application/json'
    //         },
    //         metadata: {
    //             title: isObject(layer.title)
    //                 ? layer.title[currentLocale] || layer.title.default
    //                 : layer.title
    //         },
    //         url: 'client'
    //     };
    // },
    getIdentifyFlow: (layer, baseURL, { features = [] } = {}) => {

        // console.log('mapinfo COG getIdentifyFlow', layer, baseURL, features);

        return Observable.of({
            data: {
                features
            }
        });
    }
};
