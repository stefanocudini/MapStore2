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

// import TIFFImageryProvider from 'tiff-imagery-provider';
import LayerUtils from '../../../../utils/cog/LayerUtils';
import { COG_LAYER_TYPE } from '../../../../utils/CatalogUtils';


const createLayer = (options, map) => {

    if (!options.visibility) {
        return {
            detached: true,
            remove: () => {}
        };
    }


    let loadingBboxBind;

    // function mapBbox() {
    //     const viewRectangle = map.camera.computeViewRectangle();
    //     const cameraPitch = Math.abs(Cesium.Math.toDegrees(map.camera.pitch));

    //     let rect = undefined;

    //     if (viewRectangle && cameraPitch > 60) {
    //         rect = {
    //             minx: Cesium.Math.toDegrees(viewRectangle.west),
    //             miny: Cesium.Math.toDegrees(viewRectangle.south),
    //             maxx: Cesium.Math.toDegrees(viewRectangle.east),
    //             maxy: Cesium.Math.toDegrees(viewRectangle.north)
    //         };
    //     }
    //     return rect;
    // }

    // test COG sample 'https://oin-hotosm.s3.amazonaws.com/56f9b5a963ebf4bc00074e70/0/56f9c2d42b67227a79b4faec.tif'
    //
    async function loadingBbox({tiffImageryProvider}) {

        const provider = await tiffImageryProvider.fromUrl(options.url);

    }

    LayerUtils.getTiffImageryProvider().then( async tiffImageryProvider => {
        loadingBboxBind = loadingBbox.bind(null, {tiffImageryProvider});
        map.camera.moveEnd.addEventListener(loadingBboxBind);
    });

    return {
        detached: true,
        remove: () => {

            if (loadingBboxBind) {
                map.camera.moveEnd.removeEventListener(loadingBboxBind);
            }
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
