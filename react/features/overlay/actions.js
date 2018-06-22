import { appNavigate, reloadWithStoredParams } from '../app';
import { toURLString } from '../base/util';

import {
    MEDIA_PERMISSION_PROMPT_VISIBILITY_CHANGED,
    SET_FATAL_ERROR,
    SUSPEND_DETECTED
} from './actionTypes';

const logger = require('jitsi-meet-logger').getLogger(__filename);

/**
 * Signals that the prompt for media permission is visible or not.
 *
 * @param {boolean} isVisible - If the value is true - the prompt for media
 * permission is visible otherwise the value is false/undefined.
 * @param {string} browser - The name of the current browser.
 * @public
 * @returns {{
 *     type: MEDIA_PERMISSION_PROMPT_VISIBILITY_CHANGED,
 *     browser: {string},
 *     isVisible: {boolean}
 * }}
 */
export function mediaPermissionPromptVisibilityChanged(isVisible, browser) {
    return {
        type: MEDIA_PERMISSION_PROMPT_VISIBILITY_CHANGED,
        browser,
        isVisible
    };
}

/**
 * Reloads the page.
 *
 * @protected
 * @returns {Function}
 */
export function _reloadNow() {
    return (dispatch, getState) => {
        dispatch(discardFatalError());

        const { locationURL } = getState()['features/base/connection'];

        logger.info(`Reloading the conference using URL: ${locationURL}`);

        if (navigator.product === 'ReactNative') {
            dispatch(appNavigate(toURLString(locationURL)));
        } else {
            dispatch(reloadWithStoredParams());
        }
    };
}

/**
 * Signals that suspend was detected.
 *
 * @public
 * @returns {{
 *     type: SUSPEND_DETECTED
 * }}
 */
export function suspendDetected() {
    return {
        type: SUSPEND_DETECTED
    };
}

/**
 * Discards any fatal error currently stored.
 *
 * @returns {{
 *     type,
 *     fatalError: false
 * }}
 */
export function discardFatalError() {
    return {
        type: SET_FATAL_ERROR,
        fatalError: false
    };
}

/* eslint-disable jsdoc/require-description-complete-sentence */
/**
 * The action indicates that an unrecoverable error has occurred and the reload
 * screen will be displayed. The {@code fatalErrorCause} will be stored in the
 * Redux state and eventually can be re-emitted with {@code reemitFatalError}
 * in order to dismiss the reload screen and drop the error recovery.
 *
 * @param {Object} fatalErrorCause - The original Redux action which is
 * considered a fatal error from which the reload screen will be trying to
 * recover.
 * @returns {{
 *     type: SET_FATAL_ERROR,
 *     fatalError: true,
 *     fatalErrorCause: Action
 * }}
 */
export function fatalErrorOccurred(fatalErrorCause) {
    return {
        type: SET_FATAL_ERROR,
        fatalError: true,
        fatalErrorCause
    };
}
/* eslint-enable jsdoc/require-description-complete-sentence */

/**
 * Re-emits the action which has been stored as a fatal error. The action will
 * be removed from the Redux state and the 'fatalError' flag cleared.
 *
 * @returns {Function}
 */
export function reemitFatalError() {
    return (dispatch, getState) => {
        const state = getState();
        const { fatalErrorCause } = state['features/overlay'];

        if (fatalErrorCause) {
            fatalErrorCause.error.recoverable = false;

            dispatch(fatalErrorCause);
        }
        dispatch(discardFatalError());
    };
}
