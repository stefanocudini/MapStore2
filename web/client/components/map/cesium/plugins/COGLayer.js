/**
 * Copyright 2025, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import Layers from '../../../../utils/cesium/Layers';

import isEqual from 'lodash/isEqual';

// cesium v1.134
import TIFFImageryProvider from 'tiff-imagery-provider';  // v2.17
// import LayerUtils from '../../../../utils/cog/LayerUtils';
import { COG_LAYER_TYPE } from '../../../../utils/CatalogUtils';
// import axios from '../../../../libs/ajax';
import proj4 from 'proj4';

const URL_COG_2154 = 'https://cogeo.craig.fr/opendata/ortho/2019_20cm_rvb.tif';
const URL_COG_4326 = 'https://cogeo.craig.fr/opendata/ortho/2019_20cm_irc.tif';
// https://epsg.io/2154
proj4.defs("EPSG:2154", "+proj=lcc +lat_0=46.5 +lon_0=3 +lat_1=49 +lat_2=44 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs");

const createLayer = (options, map) => {

    if (!options.visibility) {
        return {
            detached: true,
            remove: () => {}
        };
    }
    const url = options.url || options?.sources[0]?.url;
    // TODO test dynamic loading LayerUtils.getTiffImageryProvider().then( async TIFFImageryProvider => {

    // const provider = TIFFImageryProvider.fromUrl(url, {
    //     projFunc: (code) => {               // projFunc is experimental in tiff-imagery-provider
    //         if (code === 2154) {
    //             return {
    //                 project: proj4(`EPSG:4326`, `EPSG:${code}`).forward,
    //                 unproject: proj4(`EPSG:4326`, `EPSG:${code}`).inverse
    //             };
    //         }
    //     }
    // });
    // provider.then((layer) => {
    //     // eslint-disable-next-line no-console
    //     console.log('COG layer ready', layer);
    //     map.imageryLayers.addImageryProvider(layer);
    // }).catch((error) => {
    //     // eslint-disable-next-line no-console
    //     console.log('COG Error loading COG layer:', error);
    // });

    // const url = URL_COG_4326;

    const provider = new TIFFImageryProvider({
        url,
        projFunc: (code) => {               // projFunc is experimental in tiff-imagery-provider
            if (code === 2154) {
                return {
                    project: proj4(`EPSG:4326`, `EPSG:${code}`).forward,
                    unproject: proj4(`EPSG:4326`, `EPSG:${code}`).inverse
                };
            }
        }
    });
    provider.readyPromise.then((result) => { // only with new..
        map.imageryLayers.addImageryProvider(provider);
        map.scene.requestRender();
    }).catch((error) => {
        // eslint-disable-next-line no-console
        console.log('COG Error loading COG layer:', error);
    });
    // provider._build(url);
    // return new Promise((resolve, reject) => {
    //     provider.readyPromise.then(() => {
    //         // eslint-disable-next-line no-console
    //         console.log('COG layer ready');
    //         resolve(provider);
    //     }).catch((error) => {
    //         // eslint-disable-next-line no-console
    //         console.log('COG Error loading COG layer:', error);
    //         reject(error);
    //     });
    // });

    provider._build(url);

    return {
        detached: true,
        add: () => {
            // provider.readyPromise.then(() => {
            //     // eslint-disable-next-line no-console
            //     console.log('COG layer ready');
            // map.imageryLayers.addImageryProvider(provider);
            //     map.scene.requestRender();
            // });
        },
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
