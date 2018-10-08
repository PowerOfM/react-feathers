import { createAction, handleActions } from 'redux-actions'

/**
 * Creates Redux bindings (reducers and actions) for the FeathersJS authentication service
 * @param {object}    app            FeathersJS client instance
 * @param {object}    actions        Object wherein to store the service action-creators
 * @param {object}    reducers       Object wherein to store the service reducers
 * @param {function}  authInitialize Optional. Function that runs after the user has authenticated.
 *                                   Takes in `data`, and should return it afterwards.
 */
export default function reduxifyAuth (app, actions, reducers, authInitialize = (data => data)) {
  // ACTION TYPES
  const AUTHENTICATE = 'auth/AUTHENTICATE'
  const LOGOUT = 'auth/LOGOUT'
  const USER = 'auth/USER'

  // ACTION CREATORS
  actions.auth = {
    // Note: action.payload in reducer will have the value of .data below
    authenticate: createAction(
      AUTHENTICATE, (p) => ({
        promise: app.authenticate(p).then(authInitialize),
        data: undefined
      })
    ),
    logout: createAction(LOGOUT),
    user: createAction(USER)
  }

  // REDUCER
  reducers.auth = handleActions(
    {
      [`${AUTHENTICATE}_PENDING`]: (state, action) => {
        return ({
          ...state,
          errors: null,
          loading: true,
          valid: false,
          admin: false,
          user: null,
          token: null,
          ignorePendingAuth: false
        })
      },

      [`${AUTHENTICATE}_FULFILLED`]: (state, action) => {
        const user = action.payload.user

        if (state.ignorePendingAuth) {
          // A logout was dispatched between the authentication being started and completed
          app.logout()

          return {
            ...state,
            errors: null,
            loading: false,
            valid: false,
            admin: false,
            data: null,
            token: null,
            ignorePendingAuth: false
          }
        }

        return {
          ...state,
          errors: null,
          loading: false,
          valid: true,
          admin: user.admin || false,
          user: user,
          token: action.payloadtoken,
          ignorePendingAuth: false
        }
      },

      [`${AUTHENTICATE}_REJECTED`]: (state, action) => {
        return {
          ...state,
          // action.payload = { name: "NotFound", message: "No record found for id 'G6HJ45'",
          //   code:404, className: "not-found" }
          errors: action.payload,
          loading: false,
          valid: false,
          admin: false,
          user: null,
          token: null,
          ignorePendingAuth: false
        }
      },

      [LOGOUT]: (state, action) => {
        app.logout()

        return ({
          ...state,
          errors: null,
          loading: null,
          valid: false,
          admin: false,
          user: null,
          token: null,
          // Ignore the result if an authentication has been started
          ignorePendingAuth: state.isLoading
        })
      },

      [USER]: (state, action) => {
        let user = state.user
        if (user) {
          user = { ...user, ...action.payload }
        }

        return ({
          ...state,
          errors: null,
          loading: null,
          valid: false,
          admin: user.admin,
          user: user,
          // A logout may be dispatched between the authentication being started and completed
          ignorePendingAuth: false
        })
      }
    },
    {
      errors: null,
      loading: false,
      valid: false,
      admin: false,
      user: null,
      ignorePendingAuth: false
    }
  )
}
