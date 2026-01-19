/**
 * Copyright 2026, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Observable } from 'rxjs';
import isObject from 'lodash/isObject';
import { getLayerInstance } from '../cog/LayerUtils';
import { getApi } from '../MapUtils';
import {
    getMapLibraryFromVisualizationMode
} from '../MapTypeUtils'
export default {
    buildRequest: (layer, { point, currentLocale, map, ...props } = {}) => {  // executed for each COG layer in TOC

        const libName = getMapLibraryFromVisualizationMode(map?.visualizationMode);

        const pixelArr = [point?.pixel.x, point?.pixel.y];

        const layerOl = getLayerInstance(layer.id, libName);

        const pickValue = layerOl.getData(pixelArr);
        const arrayValues = pickValue ? Array.from(pickValue) : [];



        const features = arrayValues.map((value, index) => ({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [point.latlng.lng, point.latlng.lat]
                },
                properties: {
                    value: value,
                    band: index
                }
            }));

        return {
            request: {
                features: [...features],
                outputFormat: 'application/json'
            },
            metadata: {
                title: isObject(layer.title)
                    ? layer.title[currentLocale] || layer.title.default
                    : layer.title
            },
            url: layer.url
        };
    },
    getIdentifyFlow: (layer, basePath, {features = []} = {}) => {

        return Observable.of({
            data: {
                features: [...features]
            }
        });
    }
};
