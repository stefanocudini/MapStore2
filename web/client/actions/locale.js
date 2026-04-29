/**
 * Copyright 2015, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { castArray, merge } from 'lodash';

import axios from '../libs/ajax';
import { error } from './notifications';
import {getUserLocale} from '../utils/LocaleUtils';
import ConfigUtils from '../utils/ConfigUtils';

export const CHANGE_LOCALE = 'CHANGE_LOCALE';
export const LOCALE_LOAD_ERROR = 'LOCALE_LOAD_ERROR';

export function changeLocale(data) {
    return {
        type: CHANGE_LOCALE,
        messages: data.messages,
        locale: data.locale
    };
}

export function localeError(e) {
    return {
        type: LOCALE_LOAD_ERROR,
        error: e
    };
}

export function appendLocale(folder) {
    return (dispatch, getState) => {
        axios.get(folder + `/data.${getState().locale.current}.json`)
            .then((response) => {
                if (typeof response.data === "string") {
                    try {
                        JSON.parse(response.data);
                    } catch (e) {
                        dispatch(localeError('Locale file broken  for (' + getState().locale.current + '): ' + e.message));
                    }
                }
                dispatch(changeLocale({ locale: getState().locale.current, messages: merge(getState().locale.messages, response.data.messages)}));
            }).catch((e) => {
                dispatch(localeError(e));
                dispatch(error({
                    title: "notification.warning",
                    message: e.status === 404 ? "localeErrors.404" : "Error loading locale",
                    action: {
                        label: "notification.warning"
                    },
                    position: "tc"
                }));

            });
    };
}
//TODO check better with some i18n files
export function compareAndMergei18n(fallbackLanguage, targetLanguage) {
    const mergeKeys = (base, target) => {
        for (const key in base) {
            if (base.hasOwnProperty(key)) {
                if (typeof base[key] === 'object' && base[key] !== null) {
                    if (!target[key]) {
                        target[key] = {};
                    }
                    mergeKeys(base[key], target[key]);
                } else if (!target.hasOwnProperty(key)) {
                    target[key] = base[key];
                }
            }
        }
    };

    const mergedJson = JSON.parse(JSON.stringify(targetLanguage));
    mergeKeys(fallbackLanguage, mergedJson);
    return mergedJson;
}

export function loadLocale(translationFolder, language) {
    return (dispatch) => {
        let locale = language;
        if (!locale) {
            locale = getUserLocale();
        }
        const fallbackLocale = 'en-US'; //TODO load from new localConfig option
        const fallbackLocaleFile = `/static/mapstore/ms-translations/data.${fallbackLocale}.json`;

        const folders = castArray(translationFolder || ConfigUtils.getConfigProp('translationsPath'));
        const requests = locale !== fallbackLocale ? [
            axios.get(fallbackLocaleFile).catch(e => e),
            ...folders.map((folder) => {
                return axios.get(folder + `/data.${locale}.json`).catch(e => e);
            })
        ] : folders.map((folder) => {
            return axios.get(folder + `/data.${locale}.json`).catch(e => e);
        });
        Promise.all(requests).then((responses) => {
            const validResponses = responses.filter(r => r.status === 200);
            const erroredResponses = responses.filter(r => r.status !== 404 && r.status !== 200);
            if (erroredResponses.length > 0 || validResponses.length === 0) {
                const e = responses[0];
                dispatch(localeError(e));
                dispatch(error({
                    title: "notification.warning",
                    message: validResponses.length === 0 ? "localeErrors.404" : "Error loading locale",
                    action: {
                        label: "notification.warning"
                    },
                    position: "tc"
                }));
            } else {
                dispatch(changeLocale(validResponses.reduce((previous, response) => {
                    if (typeof response.data === "string") {
                        try {
                            JSON.parse(response.data);
                        } catch (e) {
                            dispatch(localeError('Locale file broken  for (' + language + '): ' + e.message));
                        }
                        return previous;
                    }
                    //TODO use compareAndMergei18n to extend response.data with fallbackLocaleFile
                    const mergedMessages = locale !== fallbackLocale && responses[0].status === 200 ? compareAndMergei18n(JSON.parse(responses[0].data).messages, response.data.messages) : response.data.messages;
                    response.data.messages = mergedMessages;
                    return merge(previous, response.data);
                }, {})));
            }
        });
    };
}

