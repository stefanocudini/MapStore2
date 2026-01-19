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

import { getLayerInstance } from '../cog/LayerUtils';

function getLayerFromLayerNode(layerNode) {
    const map = getMapLibrary()?.map;
    if (!map) return null;

    return map.getLayers().getArray().find(l =>
        l.get('id') === layerNode.id
    );
}

//const features = [];

export default {
    buildRequest: (layer, { point, currentLocale, map } = {}) => {  // executed for each COG layer in TOC
        const layerOl = getLayerInstance(layer.id, 'ol');

        const pixelArr = [point?.pixel.x, point?.pixel.y];
        const pickValue = layerOl.getData(pixelArr);

        if(pickValue) {
            console.log('COG buildRequest', layer.url, {layer, point, map, layerOl, pickValue});
        }

        const features = Array.isArray(pickValue)
            ? pickValue.map((value, index) => ({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [point.latlng.lng, point.latlng.lat]
                },
                properties: {
                    value: value,
                    band: index
                }
            })) : [];

        return {
            features: [...features],
            request: {
                features: [...features],
                outputFormat: 'application/json',
                // lat: point?.latlng?.lat,
                // lng: point?.latlng?.lng
            },
            metadata: {
                title: isObject(layer.title)
                    ? layer.title[currentLocale] || layer.title.default
                    : layer.title
            },
            url: 'client'
        };
    },
    getIdentifyFlow: (layer, basePath, { features = [], ...params } = {}) => {

        console.log('COG getIdentifyFlow', layer.url, {layer, features, params});

        // return Observable.of({
        //     data: {
        //         features: [...features]
        //     }
        // });
        return Observable.defer(() => Promise.resolve({
            data: {
                features: [...features]
            }
        }));
    }
};
