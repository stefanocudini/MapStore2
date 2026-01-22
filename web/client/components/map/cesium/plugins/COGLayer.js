/**
 * Copyright 2025, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import Layers from '../../../../utils/cesium/Layers';

// import {
//     Viewer,
//     GeoJsonDataSource,
// } from "cesium";
import * as Cesium from 'cesium';
import isEqual from 'lodash/isEqual';

import TIFFImageryProvider from 'tiff-imagery-provider';
import LayerUtils from '../../../../utils/cog/LayerUtils';
import { COG_LAYER_TYPE } from '../../../../utils/CatalogUtils';


const createLayer = (options, map) => {

    if (!options.visibility) {
        return {
            detached: true,
            remove: () => {}
        };
    }

    // LayerUtils.getTiffImageryProvider().then( async TIFFImageryProvider => {
    const provider = new TIFFImageryProvider({
        url: options.url
    });
    provider.readyPromise.then(() => {
        map.imageryLayers.addImageryProvider(provider);
    });
    // });

    return {
        detached: true,
        remove: () => {

        }
    };
};

Layers.registerType(COG_LAYER_TYPE, {
    create: createLayer,
    update: (layer, newOptions, oldOptions, map) => {
        if (!isEqual(newOptions.features, oldOptions.features)) {
            return createLayer(newOptions, map);
        }
        return null;
    }
});
