// @flow

import { MiddlewareRegistry } from '../base/redux';

import {
    CONNECTION_FAILED,
    getCurrentConnection
} from '../base/connection';
import { CONFERENCE_FAILED, getCurrentConference } from '../base/conference';
import { LOAD_CONFIG_ERROR } from '../base/config';
import { fatalErrorOccurred } from './actions';

declare var APP: Object;

/**
 * Middleware which looks for specific error actions which are considered fatal
 * if not claimed by any feature for the error recovery.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    // FIXME this middleware is disabled on web until the reload screen and
    // fatal error handling implementation is unified.
    if (typeof APP !== 'undefined') {
        return next(action);
    }

    switch (action.type) {
    case LOAD_CONFIG_ERROR: {
        // In contrary to connection and conference failure events only
        // the relevant ones are emitted for the config feature.
        return _maybeFatalErrorOccurred(store, next, action);
    }
    case CONNECTION_FAILED: {
        const { connection } = action;
        const connectionState = store.getState()['features/base/connection'];
        const currentConnection = getCurrentConnection(connectionState);

        if (connection === currentConnection) {
            return _maybeFatalErrorOccurred(store, next, action);
        }
        break;
    }
    case CONFERENCE_FAILED: {
        const { conference } = action;
        const currentConference = getCurrentConference(store);

        if (conference === currentConference) {
            return _maybeFatalErrorOccurred(store, next, action);
        }
        break;
    }
    }

    return next(action);
});

/**
 * Determines whether or not the {@code fataErrorOccurred} action is to be
 * dispatched for the given error action.
 *
 * @param {Store} store - The redux store.
 * @param {Dispatch} next - The redux {@code dispatch} function.
 * @param {Action} action - The redux action.
 * @private
 * @returns {Object} The new state.
 */
function _maybeFatalErrorOccurred({ dispatch }, next, action) {
    const { error } = action;

    // The action must be processed by the middlewares, before it can be
    // determined whether or not error recovery has been claimed by any feature.
    const result = next(action);

    // The fatalErrorOccurred action works as a catch all for any errors passed
    // to this method which have not been claimed by any other feature for error
    // recovery.
    typeof error.recoverable === 'undefined'
        && dispatch(fatalErrorOccurred(action));

    return result;
}
