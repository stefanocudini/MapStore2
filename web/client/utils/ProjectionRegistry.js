/*
 * Copyright 2026, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import proj4 from 'proj4';
import { registerGridFiles } from './ProjectionUtils';
import { normalizeUnit } from './MapUtils';

const registry = new Map(); // code → { code, def, extent, worldExtent, ... }
const listeners = [];

// Projections natively supported by proj4.
const PROJ4_NATIVE_CODES = new Set(['EPSG:4326', 'EPSG:3857', 'EPSG:900913', 'CRS:84']);

const FORMAT = {
    PROJ4: 'proj4',
    WKT1: 'wkt1',
    WKT2: 'wkt2',
    UNKNOWN: 'unknown'
};

export function detectFormat(def) {
    if (!def || typeof def !== 'string') {
        return FORMAT.UNKNOWN;
    }
    const trimmed = def.trim();
    if (trimmed.startsWith('+proj=') || trimmed.startsWith('+init=')) {
        return FORMAT.PROJ4;
    }
    if (trimmed.startsWith('PROJCS[') || trimmed.startsWith('GEOGCS[')) {
        return FORMAT.WKT1;
    }
    if (trimmed.startsWith('PROJCRS[') || trimmed.startsWith('GEOGCRS[') || trimmed.startsWith('BOUNDCRS[')) {
        return FORMAT.WKT2;
    }
    return FORMAT.UNKNOWN;
}

export function toDef(def) {
    const format = detectFormat(def);
    // proj4js handles proj4 strings and WKT1 natively; WKT2 coverage is
    // partial but in practice most WKT2 strings parse - let proj4 try, and
    // upstream validation (isValidDef in GeoServerProjections) rejects the
    // ones that don't yield a usable unit.
    if (format === FORMAT.PROJ4 || format === FORMAT.WKT1 || format === FORMAT.WKT2) {
        return { def, supported: true };
    }
    console.warn(`[ProjectionRegistry] Unknown projection def format, skipping: ${def}`);
    return { def, supported: false };
}

export function register(projDef) {
    const { code, def, extent, worldExtent } = projDef;
    if (!code) {
        return;
    }

    const { def: normalizedDef, supported } = toDef(def);

    // keep track of whether the proj4 def is created by the registry, so that unRegister
    // can remove it without touching defs that proj4 provides natively (e.g. EPSG:326xx/327xx)
    // or that were defined before (by another registration path)
    const previousEntry = registry.get(code);
    let originalProj4Defs = !!previousEntry?.originalProj4Defs;
    if (supported && !proj4.defs(code)) {
        proj4.defs(code, normalizedDef);
        originalProj4Defs = true;
    }
    const proj4Metadata = proj4.defs(code);
    // If proj4 already knows the code (e.g. registered earlier or via the
    // legacy addProjections helper that recovers the def from proj4 itself),
    // the projection is usable regardless of how the input def parsed -
    // mark it supported so map-library adapters pick it up.
    const isSupported = supported || !!proj4Metadata;

    const isGeographic = ['longlat', 'latlong'].includes(proj4Metadata?.projName)
        || normalizeUnit(proj4Metadata?.units) === 'degrees';
    // proj4 reports axis 'enu' even for geographic CRS - default to 'neu' (OGC/ISO lat-first order) and let projDef.axisOrientation override if needed
    const axisOrientation = projDef?.axisOrientation || proj4Metadata?.axis || (isGeographic ? 'neu' : 'enu');
    const units = projDef?.units || proj4Metadata?.units || 'm';

    const entry = {
        code,
        def: normalizedDef,
        extent,
        worldExtent,
        axisOrientation,
        units,
        supported: isSupported,
        originalProj4Defs
    };
    registry.set(code, entry);

    // Notify all map-library adapters
    listeners.forEach(fn => fn(entry));
}

// codes registered at module load (see BUILTIN_DEFS), their proj4 defs are never removed
const BUILTIN_CODES = new Set();

/**
 * Removes from proj4 the def of a registry entry, only if it was created by the registry.
 * proj4js does not expose an API to un-define a projection: defs are stored as properties
 * of the `proj4.defs` function and looked up with `name in defs`, so deleting the property
 * is enough to make `proj4.defs(code)` return undefined.
 * https://github.com/proj4js/proj4js/blob/v2.19.10/lib/defs.js#L71-L77
 * NOTE: keep this aligned with proj4js in case later versions change how defs are stored
 * or add an official way to remove a projection.
 * @param {object} entry registry entry
 */
function removeProj4Def(entry) {
    if (entry?.originalProj4Defs && !BUILTIN_CODES.has(entry.code)) {
        delete proj4.defs[entry.code];
    }
}

export function unRegister(code) {
    if (registry.has(code)) {
        removeProj4Def(registry.get(code));
        registry.delete(code);
    }
}

export function unRegisterAll() {
    registry.forEach(removeProj4Def);
    registry.clear();
}

export function registerAll(projDefs = []) {
    // Returns a Promise so callers can chain .then() - for plain defs this resolves immediately via Promise.resolve
    projDefs.forEach(register);
    return Promise.resolve();
}

/**
 *  Grid files require async loading - wrap registerAll for that case
 */
export function registerAllWithGridFiles(projDefs = [], gridFiles = null, proj4Instance = proj4) {
    const gridPromise = gridFiles
        ? registerGridFiles(gridFiles, proj4Instance) // imported from ProjectionUtils
        : Promise.resolve();
    return gridPromise.then(() => registerAll(projDefs));
}

/**
 * used by utils/openlayers/projUtils.js
 * @param {*} listener
 * @returns {function} Returns an unsubscribe function.
 */
export function onRegister(listener) {
    listeners.push(listener);
    // Replay already-registered defs so late subscribers get the full picture
    registry.forEach(listener);
    return () => {
        const idx = listeners.indexOf(listener);
        if (idx !== -1) listeners.splice(idx, 1);
    };
}

export function getAll() {
    return Array.from(registry.values());
}

export function getByCode(code) {
    return registry.get(code) ?? null;
}

export function isRegistered(code) {
    return registry.has(code) || PROJ4_NATIVE_CODES.has(code);
}

// CRS that are not built into OpenLayers but are commonly required by the
// application (e.g. EPSG:4269 carries extents that OL needs for view
// calculations). EPSG:4326 / EPSG:3857 are intentionally excluded - OL ships
// them with specific axis orientations and re-registering would overwrite
// those built-ins.
const BUILTIN_DEFS = [
    {
        code: "EPSG:4269",
        def: "+proj=longlat +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +no_defs",
        axisOrientation: "neu",
        extent: [-172.54, 23.81, -47.74, 86.46],
        worldExtent: [-172.54, 23.81, -47.74, 86.46]
    },
    {
        code: "CRS:84",
        def: "+proj=longlat +datum=WGS84 +no_defs",
        axisOrientation: "enu",
        extent: [-180, -90, 180, 90],
        worldExtent: [-180, -90, 180, 90]
    }
];
BUILTIN_DEFS.forEach((def) => {
    BUILTIN_CODES.add(def.code);
    register(def);
});

const ProjectionRegistry = {
    register,
    registerAll,
    registerAllWithGridFiles,
    onRegister,
    getAll,
    getByCode,
    isRegistered,
    unRegister,
    unRegisterAll
};

export default ProjectionRegistry;
